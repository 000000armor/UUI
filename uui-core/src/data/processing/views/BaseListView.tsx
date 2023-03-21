import isEqual from "lodash.isequal";
import {
    BaseListViewProps, DataRowProps, ICheckable, IEditable, SortingOption, DataSourceState, DataSourceListProps,
    IDataSourceView, DataRowPathItem, SubtotalsDataRowProps, RowProps,
} from "../../../types";
import { isSubtotalRecord, Subtotals, SubtotalsRecord } from "./subtotals";
import { ItemsComparator, ITree } from "./tree/ITree";

interface NodeStats {
    isSomeCheckable: boolean;
    isSomeChecked: boolean;
    isAllChecked: boolean;
    isSomeSelected: boolean;
    hasMoreRows: boolean;
}

export abstract class BaseListView<TItem, TId, TFilter, TSubtotals = void> implements IDataSourceView<TItem, TId, TFilter, TSubtotals> {
    protected originalTree: ITree<TItem, TId, TSubtotals>;
    protected tree: ITree<TItem, TId, TSubtotals>;

    protected rows: RowProps<TItem, TId, TSubtotals>[] = [];
    public value: DataSourceState<TFilter, TId> = {};
    protected onValueChange: (value: DataSourceState<TFilter, TId>) => void;
    protected checkedByKey: Record<string, boolean> = {};
    public selectAll?: ICheckable;
    protected isDestroyed = false;
    protected hasMoreRows = false;
    protected patchComparator: ItemsComparator<TItem>;

    abstract getById(id: TId, index: number): DataRowProps<TItem, TId>;
    abstract getVisibleRows(): RowProps<TItem, TId, TSubtotals>[];
    abstract getListProps(): DataSourceListProps;

    _forceUpdate() {
        !this.isDestroyed && this.onValueChange({ ...this.value });
    }

    public destroy() {
        this.isDestroyed = true;
    }

    protected constructor(
        editable: IEditable<DataSourceState<TFilter, TId>>,
        protected props: BaseListViewProps<TItem, TId, TFilter, TSubtotals>,
    ) {
        this.onValueChange = editable.onValueChange;
        this.value = editable.value;
        this.updateCheckedLookup(this.value && this.value.checked);
    }

    protected updateRowOptions(): void {
        if (this.props.getRowOptions) {
            for (let n = 0; n < this.rows.length; n++) {
                const row = this.rows[n];
                if (!row.isLoading && !isSubtotalRecord<TItem, TId, TSubtotals>(row.value as Subtotals<TItem, TSubtotals>)) {
                    this.applyRowOptions(row as DataRowProps<TItem, TId>);
                }
            }
        }
    }

    protected updateCheckedLookup(checked: TId[]) {
        this.checkedByKey = {};
        (checked || []).forEach(id => {
            this.checkedByKey[this.idToKey(id)] = true;
        });
    }

    protected handleCheckedChange(checked: TId[]) {
        this.onValueChange({ ...this.value, checked });
    }

    protected idToKey(id: TId) {
        return JSON.stringify(id);
    }

    protected keyToId(key: string) {
        return JSON.parse(key);
    }

    protected setObjectFlag(object: any, key: string, value: boolean) {
        return { ...object, [key]: value };
    }

    public getSelectedRows: () => DataRowProps<TItem, TId>[] = () => {
        if (this.value.selectedId !== null && this.value.selectedId !== undefined) {
            return [this.getById(this.value.selectedId, 0)];
        } else if (this.value.checked) {
            return this.value.checked.map((id, n) => this.getById(id, n));
        }
        return [];
    }

    protected handleOnCheck = (rowProps: DataRowProps<TItem, TId>) => {
        let checked = this.value && this.value.checked || [];
        if (rowProps.isChecked) {
            checked = checked.filter(id => id !== rowProps.id);
            this.handleCheckedChange(checked);
        } else {
            checked = [...checked, rowProps.id];
            this.handleCheckedChange(checked);
        }
    }

    protected isSelectAllEnabled() {
        return this.props.selectAll == undefined ? true : this.props.selectAll;
    }

    protected handleOnSelect = (rowProps: DataRowProps<TItem, TId>) => {
        this.onValueChange({
            ...this.value,
            selectedId: rowProps.id,
        });
    }

    protected handleOnFocus = (focusIndex: number) => {
        if (this.onValueChange) {
            this.onValueChange({
                ...this.value,
                focusedIndex: focusIndex,
            });
        }
    }

    protected handleOnFold = (rowProps: DataRowProps<TItem, TId>) => {
        if (this.onValueChange) {
            this.onValueChange({
                ...this.value,
                folded: this.setObjectFlag(this.value && this.value.folded, rowProps.rowKey, !rowProps.isFolded),
            });
        }
    }

    protected handleSort = (sorting: SortingOption) => {
        if (this.onValueChange) {
            this.onValueChange({
                ...this.value,
                sorting: [sorting],
            });
        }
    }

    protected isFolded(item: TItem) {
        const folded = this.value.folded || {};

        const key = this.idToKey(this.props.getId(item));

        if (folded[key] != null) {
            return folded[key];
        }

        if (this.props.isFoldedByDefault) {
            return this.props.isFoldedByDefault(item);
        }

        return true;
    }

    protected getRowProps(item: TItem, index: number): DataRowProps<TItem, TId> {
        const id = this.props.getId(item);
        const key = this.idToKey(id);
        const path = this.tree.getPathById(id);
        const parentId = path.length > 0 ? path[path.length - 1].id : undefined;

        const rowProps = {
            id,
            parentId,
            key,
            rowKey: key,
            index,
            value: item,
            depth: path.length,
            path,
        } as DataRowProps<TItem, TId>;

        this.applyRowOptions(rowProps);

        return rowProps;
    }

    protected getSubtotalsRowProps(subtotal: Subtotals<TSubtotals, TId>, options: { index: number, isFolded: boolean }) {
        const rowOptions = this.props.rowOptions;
        const { id, parentId } = subtotal;
        const key = id;
        const pathToParent = this.tree.getPathById(parentId);
        const item = this.tree.getById(parentId);
        const pathItem = parentId ? this.tree.getPathItem(item) : undefined;
        const path = pathItem ? [...pathToParent, pathItem] : pathToParent;
        const rowProps = {
            id,
            parentId,
            key,
            rowKey: key,
            value: subtotal,
            depth: path.length,
            indent: path.length + 1,
            path,
            checkbox: rowOptions?.checkbox?.isVisible && { isVisible: true, isDisabled: true },
            isFoldable: false,
            isLastChild: false,
            ...options,
        } as DataRowProps<Subtotals<TSubtotals, TId>, string>;

        return rowProps;
    }

    protected applyRowOptions(row: DataRowProps<TItem, TId>) {
        const isLoading = row.value === undefined;
        const rowOptions = (this.props.getRowOptions && !isLoading)
            ? this.props.getRowOptions(row.value, row.index)
            : this.props.rowOptions;
        const isCheckable = rowOptions && rowOptions.checkbox && rowOptions.checkbox.isVisible && !rowOptions.checkbox.isDisabled;
        const isSelectable = rowOptions && rowOptions.isSelectable;
        if (rowOptions != null) {
            const rowValue = row.value;
            Object.assign(row, rowOptions);
            row.value = (rowOptions.value) ?? rowValue;
        }
        row.isFocused = this.value.focusedIndex === row.index;
        row.isChecked = !!this.checkedByKey[row.rowKey];
        row.isSelected = this.value.selectedId === row.id;
        row.isCheckable = isCheckable;
        row.onCheck = isCheckable && this.handleOnCheck;
        row.onSelect = rowOptions && rowOptions.isSelectable && this.handleOnSelect;
        row.onFocus = (isSelectable || isCheckable) && this.handleOnFocus;
    }

    protected getLoadingRow(id: any, index: number = 0, path: DataRowPathItem<TId, TItem>[] = null): DataRowProps<TItem, TId> {
        const rowOptions = this.props.rowOptions;

        return {
            id,
            rowKey: this.idToKey(id),
            index,
            isLoading: true,
            depth: path ? path.length : 0,
            path: path ?? [],
            checkbox: rowOptions?.checkbox?.isVisible && { isVisible: true, isDisabled: true },
        };
    }

    // Extracts a flat list of currently visible rows from the tree
    protected rebuildRows() {
        const rows: RowProps<TItem, TId, TSubtotals>[] = [];
        let lastIndex = this.getLastRecordIndex();

        const isFlattenSearch = this.isFlattenSearch?.() ?? false;
        const searchIsApplied = !!this.value?.search;

        const iterateNode = (
            parentId: TId,
            appendRows: boolean, // Will be false, if we are iterating folded nodes.
        ): NodeStats => {
            let currentLevelRows = 0;
            let stats = this.getDefaultNodeStats();

            const layerRows: DataRowProps<TItem, TId>[] = [];
            const nodeInfo = this.tree.getNodeInfo(parentId);

            const ids = this.tree.getChildrenIdsByParentId(parentId);
            const subtotalRecord = this.tree.getSubtotalRecordByParentId(parentId);
            const parentRow = rows[rows.length - 1];

            for (let n = 0; n < ids.length; n++) {
                const id = ids[n];
                const item = this.tree.getById(id);
                const row = this.getRowProps(item, rows.length);

                if (appendRows && (!this.isPartialLoad() || (this.isPartialLoad() && rows.length < lastIndex))) {
                    rows.push(row);
                    layerRows.push(row);
                    currentLevelRows++;
                }

                stats = this.getRowStats(row, stats);

                row.isFoldable = false;
                row.isLastChild = (n == ids.length - 1) && (nodeInfo.count === ids.length);
                row.indent = isFlattenSearch ? 0 : row.path.length + 1;
                const estimatedChildrenCount = this.getEstimatedChildrenCount(id);
                if (!isFlattenSearch && estimatedChildrenCount !== undefined) {
                    const childrenIds = this.tree.getChildrenIdsByParentId(id);

                    if (estimatedChildrenCount > 0) {
                        row.isFoldable = true;
                        let isFolded = this.isFolded(item);
                        if (searchIsApplied && childrenIds.length > 0) {
                            isFolded = false;
                        }
                        row.isFolded = isFolded;
                        row.onFold = row.isFoldable && this.handleOnFold;

                        if (childrenIds.length > 0) { // some children are loaded
                            const childStats = iterateNode(id, appendRows && !row.isFolded);
                            row.isChildrenChecked = childStats.isSomeChecked;
                            row.isChildrenSelected = childStats.isSomeSelected;
                            stats = this.mergeStats(stats, childStats);
                        } else if (!row.isFolded && appendRows) {  // children are not loaded
                            const parentsWithRow = [...row.path, this.tree.getPathItem(item)];
                            for (let m = 0; m < estimatedChildrenCount && rows.length < lastIndex; m++) {
                                const row = this.getLoadingRow('_loading_' + rows.length, rows.length, parentsWithRow);
                                row.indent = parentsWithRow.length + 1;
                                row.isLastChild = m == (estimatedChildrenCount - 1);
                                rows.push(row);
                                currentLevelRows++;
                            }
                        }
                    }
                }
            }

            if (subtotalRecord && !parentRow?.isFolded) {
                const subtotalRow = this.getSubtotalsRowProps(subtotalRecord, {
                    index: rows.length,
                    isFolded: parentRow?.isFolded ?? false,
                });
                rows.push(subtotalRow as RowProps<TItem, TId, TSubtotals>);
            }

            const pathToParent = this.tree.getPathById(parentId);
            const path = parentId ? [...pathToParent, this.tree.getPathItem(this.tree.getById(parentId))] : pathToParent;
            if (appendRows) {
                let missingCount: number = this.getMissingRecordsCount(parentId, rows.length, currentLevelRows);
                if (missingCount > 0) {
                    stats.hasMoreRows = true;
                }

                // Append loading rows, stop at lastIndex (last row visible)
                while (rows.length < lastIndex && missingCount > 0) {
                    const row = this.getLoadingRow('_loading_' + rows.length, rows.length, path);
                    rows.push(row);
                    layerRows.push(row);
                    currentLevelRows++;
                    missingCount--;
                }
            }

            const isListFlat = path.length === 0 && !layerRows.some(r => r.isFoldable);
            if (isListFlat || isFlattenSearch) {
                layerRows.forEach(r => r.indent = 0);
            }

            return stats;
        };

        const rootStats = iterateNode(undefined, true);

        if (rootStats.isSomeCheckable && this.isSelectAllEnabled()) {
            this.selectAll = {
                value: rootStats.isAllChecked,
                onValueChange: this.handleSelectAll,
                indeterminate: this.value.checked && this.value.checked.length > 0 && !rootStats.isAllChecked,
            };
        } else if (this.tree.getRootIds().length === 0 && this.props.rowOptions?.checkbox?.isVisible && this.isSelectAllEnabled()) {
            // Nothing loaded yet, but we guess that something is checkable. Add disabled checkbox for less flicker.
            this.selectAll = {
                value: false,
                onValueChange: () => {},
                isDisabled: true,
                indeterminate: this.value.checked?.length > 0,
            };
        } else {
            this.selectAll = null;
        }

        this.rows = rows;
        this.hasMoreRows = rootStats.hasMoreRows;
    }

    private getEstimatedChildrenCount = (id: TId) => {
        if (!id) return undefined;

        const item = this.tree.getById(id);
        const childCount = this.getChildCount(item);
        if (childCount === undefined) return undefined;

        const nodeInfo = this.tree.getNodeInfo(id);
        if (nodeInfo?.count !== undefined) {
            // nodes are already loaded, and we know the actual count
            return nodeInfo.count;
        }

        return childCount;
    }

    private getMissingRecordsCount(id: TId, totalRowsCount: number, loadedChildrenCount: number) {
        const nodeInfo = this.tree.getNodeInfo(id);

        const estimatedChildCount = this.getEstimatedChildrenCount(id);

        // Estimate how many more nodes there are at current level, to put 'loading' placeholders.
        if (nodeInfo.count !== undefined) { // Exact count known
            return nodeInfo.count - loadedChildrenCount;
        }

        const lastIndex = this.getLastRecordIndex();
        // estimatedChildCount = undefined for top-level rows only.
        if (!id && totalRowsCount < lastIndex) {
            return lastIndex - totalRowsCount; // let's put placeholders down to the bottom of visible list
        }

        if (estimatedChildCount > loadedChildrenCount) { // According to getChildCount (put into estimatedChildCount), there are more rows on this level
            return estimatedChildCount - loadedChildrenCount;
        }

        // We have a bad estimate - it even less that actual items we have
        // This would happen is getChildCount provides a guess count, and we scroll thru children past this count
        // let's guess we have at least 1 item more than loaded
        return 1;
    }

    private getDefaultNodeStats = () => ({
        isSomeCheckable: false, isSomeChecked: false, isAllChecked: true,
        isSomeSelected: false, hasMoreRows: false,
    })

    private getRowStats = (row: DataRowProps<TItem, TId>, actualStats: NodeStats): NodeStats => {
        let { isSomeCheckable, isSomeChecked, isAllChecked, isSomeSelected } = actualStats;

        if (row.checkbox) {
            isSomeCheckable = true;
            if (row.isChecked) {
                isSomeChecked = true;
            }
            if (!row.isChecked && !row.checkbox.isDisabled) {
                isAllChecked = false;
            }
        }

        if (row.isSelected) {
            isSomeSelected = true;
        }

        return { ...actualStats, isSomeCheckable, isSomeChecked, isAllChecked, isSomeSelected };
    }

    private mergeStats = (parentStats: NodeStats, childStats: NodeStats) => ({
        ...parentStats,
        isSomeCheckable: parentStats.isSomeCheckable || childStats.isSomeCheckable,
        isSomeChecked: parentStats.isSomeChecked || childStats.isSomeChecked,
        isAllChecked: parentStats.isAllChecked && childStats.isAllChecked,
        hasMoreRows: parentStats.hasMoreRows || childStats.hasMoreRows,
    })

    protected canBeSelected = (row: RowProps<TItem, TId, TSubtotals>) =>
        row.checkbox && row.checkbox.isVisible && !row.checkbox.isDisabled

    protected getLastRecordIndex = () => this.value.topIndex + this.value.visibleCount;

    protected shouldRebuildTree = (prevValue: DataSourceState<TFilter, TId>, newValue: DataSourceState<TFilter, TId>) =>
        this.searchWasChanged(prevValue, newValue)
        || this.sortingWasChanged(prevValue, newValue)
        || this.filterWasChanged(prevValue, newValue)
        || newValue.page !== prevValue.page
        || newValue.pageSize !== prevValue.pageSize


    protected shouldRebuildRows = (prevValue: DataSourceState<TFilter, TId>, newValue: DataSourceState<TFilter, TId>) =>
        !prevValue
        || !isEqual(newValue.checked, prevValue.checked)
        || newValue.selectedId !== prevValue.selectedId
        || newValue.folded !== prevValue.folded


    protected sortingWasChanged = (prevValue: DataSourceState<TFilter, TId>, newValue: DataSourceState<TFilter, TId>) =>
        !isEqual(newValue.sorting, prevValue.sorting)

    protected filterWasChanged = (prevValue: DataSourceState<TFilter, TId>, newValue: DataSourceState<TFilter, TId>) =>
        !isEqual(newValue.filter, prevValue.filter)

    protected searchWasChanged = (prevValue: DataSourceState<TFilter, TId>, newValue: DataSourceState<TFilter, TId>) =>
        newValue.search !== prevValue.search

    protected abstract handleSelectAll(checked: boolean): void;
    protected abstract getChildCount(item: TItem): number | undefined;
    protected isFlattenSearch = () => false;
    protected isPartialLoad = () => false;
    public loadData() {}
    public abstract reload(): void;
}
