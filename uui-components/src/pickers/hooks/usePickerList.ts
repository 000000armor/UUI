import { useMemo } from 'react';
import { DataRowProps } from '@epam/uui-core';
import { i18n } from '../../i18n';
import { usePicker } from './usePicker';
import { usePickerListState } from './usePickerListState';
import { LastUsedRec, UsePickerListProps } from './types';

export function usePickerList<TItem, TId, TProps>(props: UsePickerListProps<TItem, TId, TProps>) {
    const sessionStartTime = useMemo(() => new Date().getTime(), []);

    const getMaxTotalItems = () => props.maxTotalItems || 50;

    const getMaxDefaultItems = () => Math.min(props.maxDefaultItems || 10, getMaxTotalItems());

    const getSettingsKey = () =>
        'loveship/PickerList/lastSelectedIds/v2/' + props.settingsKey;

    const getSelectedIdsArray = (selected: TId | TId[] | null | undefined): TId[] => {
        if (selected) {
            if (props.selectionMode === 'single') {
                return [selected as TId];
            } else {
                return selected as TId[];
            }
        }
        return [];
    };
    const addDistinct = (to: TId[], add: TId[], maxItems: number) => {
        const added: Record<string, boolean> = {};
        to.forEach((id) => {
            added[JSON.stringify(id)] = true;
        });
        const result = [...to];
        for (let n = 0; n < add.length && result.length < maxItems; n++) {
            const id = add[n];
            const key = JSON.stringify(id);
            if (!added[key]) {
                result.push(id);
                added[key] = true;
            }
        }
        return result;
    };

    const getVisibleIds = () => {
        let lastUsedUds: TId[] = [];
        if (props.settingsKey) {
            const settings = context.uuiUserSettings.get(getSettingsKey(), [] as LastUsedRec<TId>[]);
            lastUsedUds = settings.map((r) => r.id);
        }

        let visibleIds: TId[] = getSelectedIdsArray(props.value as TId | TId[]).slice(0, getMaxTotalItems());

        visibleIds = addDistinct(visibleIds, [...lastUsedUds, ...(props.defaultIds || [])], getMaxDefaultItems());

        return visibleIds;
    };

    const pickerListState = usePickerListState<TId>({
        dataSourceState: { visibleCount: getMaxDefaultItems() },
        visibleIds: getVisibleIds(),
    });

    const { dataSourceState, visibleIds } = pickerListState;
    const picker = usePicker<TItem, TId, UsePickerListProps<TItem, TId, TProps>>(props, pickerListState);
    const {
        context,
        getView,
        getEntityName,
        getDataSourceState,
        isSingleSelect,
        getName,
    } = picker;

    const getModalTogglerCaption = (totalCount: number, rowsCount: number) => {
        let togglerCaption = i18n.pickerList.showAll;
        if (totalCount != null) {
            togglerCaption += ' ' + totalCount;
        }

        if (getEntityName()) {
            togglerCaption += ' ' + getEntityName().toUpperCase();
        }

        if (!isSingleSelect() && rowsCount > 0) {
            togglerCaption += i18n.pickerList.rowsSelected(rowsCount);
        }

        return togglerCaption;
    };

    const appendLastSelected = (ids: TId[]) => {
        if (props.settingsKey) {
            let lastUsedIds = context.uuiUserSettings.get(getSettingsKey(), [] as LastUsedRec<TId>[]);
            const selectionTime = new Date().getTime();
            lastUsedIds = [...ids.map((id) => ({ id, selectionTime, sessionStartTime: sessionStartTime } as LastUsedRec<TId>)).reverse(), ...lastUsedIds].slice(
                0,
                100,
            );
            context.uuiUserSettings.set(getSettingsKey(), lastUsedIds);
        }
    };

    const sortRows = (rows: DataRowProps<TItem, TId>[]) => {
        const dsState = getDataSourceState();
        const sorting = dsState.sorting?.[0];

        if (!sorting || (!props.sortBy && !sorting.field)) {
            return rows;
        }

        const sortBy = props.sortBy || ((i: TItem) => i[sorting.field as keyof TItem]);
        const sign = sorting.direction === 'desc' ? -1 : 1;
        const stringComparer = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
        const comparer = (a: DataRowProps<TItem, TId>, b: DataRowProps<TItem, TId>) => {
            const loadingComparison = (b.isLoading ? 0 : 1) - (a.isLoading ? 0 : 1);
            if ((loadingComparison && loadingComparison !== 0) || (a.isLoading && b.isLoading)) {
                return loadingComparison;
            } else {
                return sign * stringComparer(sortBy(a.value, sorting), sortBy(b.value, sorting));
            }
        };

        return [...rows].sort(comparer);
    };

    const buildRowsList = () => {
        const maxDefaultItems = getMaxDefaultItems();
        const maxTotalItems = getMaxTotalItems();
        const view = getView();

        const result: DataRowProps<TItem, TId>[] = [];
        const added: Record<string, boolean> = {};

        const addRows = (rows: DataRowProps<TItem, TId>[], maxItems: number) => {
            for (let n = 0; n < rows.length && (!maxItems || result.length < maxItems); n++) {
                const row = rows[n];
                if (!added[row.rowKey]) {
                    result.push(row);
                    added[row.rowKey] = true;
                }
            }
        };

        addRows(view.getSelectedRows(), getMaxTotalItems());

        if (visibleIds && result.length < maxTotalItems) {
            const rows = visibleIds.map((id, n) => view.getById(id, n));
            addRows(rows, maxTotalItems);
        }

        if (!props.defaultIds && result.length < maxDefaultItems) {
            const rows = view.getVisibleRows();
            addRows(rows, maxDefaultItems);
        }

        return sortRows(result);
    };

    return {
        context,
        dataSourceState,
        getName,
        getEntityName,
        appendLastSelected,
        getSelectedIdsArray,
        getView,
        buildRowsList,
        getMaxDefaultItems,
        getModalTogglerCaption,
    };
}
