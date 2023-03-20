import { IEditable, DataSourceState, IDataSourceView } from "../../../types";
import { ArrayListView, BaseArrayListViewProps } from "./ArrayListView";

export interface AsyncListViewProps<TItem, TId, TFilter, TSubtotals = void> extends BaseArrayListViewProps<TItem, TId, TFilter, TSubtotals> {
    api(): Promise<TItem[]>;
}

export class AsyncListView<TItem, TId, TFilter = any, TSubtotals = void> extends ArrayListView<TItem, TId, TFilter, TSubtotals>
    implements IDataSourceView<TItem, TId, TFilter, TSubtotals> {
    private isloading: boolean = false;
    private isloaded: boolean = false;

    constructor(
        protected editable: IEditable<DataSourceState<TFilter, TId>>,
        protected props: AsyncListViewProps<TItem, TId, TFilter, TSubtotals>,
    ) {
        super(editable, props);
        this.props = props;
        this.update(editable.value, props);
    }

    public loadData() {
        if (this.isLoaded || this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.props.api().then((items) => {
            this.isLoaded = true;
            this.isLoading = false;
            this.update(this.editable.value, { ...this.props, items });
            this._forceUpdate();
        });
    }

    public reload = () => {
        this.isLoading = false;
        this.isLoaded = false;
        super.reload();
    }

    public getVisibleRows = () => {
        const from = this.value.topIndex;
        const count = this.value.visibleCount;
        const rows = [];
        if (!this.isLoaded) {
            while (rows.length < count) {
                const index = from + rows.length;
                const row = this.getLoadingRow('_loading_' + index, index);
                rows.push(row);
            }
            return rows;
        }

        return this.rows.slice(this.value.topIndex, this.getLastRecordIndex());
    }

    public getListProps = () => {
        if (!this.isLoaded) {
            return {
                rowsCount: this.value.visibleCount,
                knownRowsCount: this.value.visibleCount,
                exactRowsCount: this.value.visibleCount,
                totalCount: this.value.visibleCount,
                selectAll: this.selectAll,
            };
        }

        return {
            rowsCount: this.rows.length,
            knownRowsCount: this.rows.length,
            exactRowsCount: this.rows.length,
            totalCount: this.tree.getTotalRecursiveCount(),
            selectAll: this.selectAll,
        };
    }

    get isLoading(): boolean {
        return this.isloading;
    }

    set isLoading(isLoading: boolean) {
        this.isloading = isLoading;
    }

    get isLoaded(): boolean {
        return this.isloaded;
    }

    set isLoaded(isloaded: boolean) {
        this.isloaded = isloaded;
    }
}
