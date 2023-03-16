import { DataTable, useForm, Panel, Button, FlexCell, FlexRow, FlexSpacer, IconButton, DataTableRow } from '@epam/promo';
import React, { useCallback, useMemo } from 'react';
import { AcceptDropParams, DataTableState, DropParams, DropPosition, ITree, Metadata, useList, useTree } from '@epam/uui-core';
import { ReactComponent as undoIcon } from '@epam/assets/icons/common/content-edit_undo-18.svg';
import { ReactComponent as redoIcon } from '@epam/assets/icons/common/content-edit_redo-18.svg';
import { ReactComponent as insertAfter } from '@epam/assets/icons/common/table-row_plus_after-24.svg';
import { ReactComponent as insertBefore } from '@epam/assets/icons/common/table-row_plus_before-24.svg';
import { Task } from './types';
import { getDemoTasks } from './demoData';
import { getColumns } from './columns';
import { getInsertionOrder } from './helpers';

interface FormState {
    items: Record<number, Task>;
    tree?: ITree<Task, number>;
}

const metadata: Metadata<FormState> = {
    props: {
        items: {
            all: {
                props: {
                    name: { isRequired: true },
                },
            },
        },
    },
};

let lastId = -1;

let savedValue: FormState = { items: getDemoTasks() };

export const ProjectDemo = () => {
    const getId = useCallback((i: Task) => i.id, []);
    const getParentId = useCallback((i: Task) => i.parentId, []);

    const { lens, value, onValueChange, save, isChanged, revert, undo, canUndo, redo, canRedo } = useForm<FormState>({
        value: { items: savedValue.items },
        onSave: async (value) => {
            // At this point you usually call api.saveSomething(value) to actually send changed data to server
            savedValue = value;
        },
        getMetadata: () => metadata,
    });

    const tree = useTree({
        items: Object.values(value.items),
        params: { getId, getParentId },
    });

    // Insert new/exiting top/bottom or above/below relative to other task
    const insertTask = (position: DropPosition, relativeTask: Task | null = null, existingTask: Task | null = null) => {
        const task: Task = existingTask ? { ...existingTask } : { id: lastId--, name: '' };

        if (position === 'inside') {
            task.parentId = relativeTask.id;
            relativeTask = null; // just insert as the first child
        }

        if (relativeTask) {
            task.parentId = relativeTask.parentId;
        }

        task.order = getInsertionOrder(
            Object.values(value.items).filter(i => i.parentId === task.parentId).map(i => i.order),
            position == 'bottom' ? 'after' : 'before', // 'inside' drop should also insert at the top of the list, so it's ok to default to 'before'
            relativeTask?.order,
        );

        onValueChange({ ...value, items: { ...value.items, [task.id]: task } });
    };

    const handleCanAcceptDrop = useCallback((params: AcceptDropParams<Task, Task>) => ({ bottom: true, top: true, inside: true }), []);

    const handleDrop = useCallback((params: DropParams<Task, Task>) => insertTask(params.position, params.dstData, params.srcData), []);

    //const { tableState, setTableState } = useTableState<any>({ columns });
    const [tableState, setTableState] = React.useState<DataTableState>({ sorting: [{ field: 'order' }] });

    const { rows, listProps } = useList({
        type: 'array',
        listState: tableState,
        setListState: setTableState,
        items: Object.values(value.items),
        tree,
        getId,
        getParentId,
        getRowOptions: (task) => ({
            ...lens.prop('items').prop(task.id).toProps(), // pass IEditable to each row to allow editing
            //checkbox: { isVisible: true },
            isSelectable: true,
            dnd: {
                srcData: task,
                dstData: task,
                canAcceptDrop: handleCanAcceptDrop,
                onDrop: handleDrop,
            },
        }),
    }, []);

    const { taskColumns, summaryColumns } = useMemo(() => getColumns({ insertTask: () => {}, deleteTask: () => {} }), []);

    const summary = useMemo(() => {
        const totalEstimate = tree.value?.computeSubtotals(
            (item) => item.parentId ? 0 : (item.estimate ?? 0),
            (a, b) => a + b,
        );
        const totalCount = tree.value?.computeSubtotals(_ => 1, (a, b) => a + b);

        return {
            totalEstimate: totalEstimate?.get(undefined) ?? 0,
            totalCount: totalCount?.get(undefined) ?? 0,
        };
    }, [tree.value]);

    return <Panel style={ { width: '100%' } }>
        <FlexRow spacing='12' margin='12'>
            <FlexCell width='auto'>
                <IconButton icon={ insertAfter } onClick={ () => insertTask('top') } />
            </FlexCell>
            <FlexCell width='auto'>
                <IconButton icon={ insertBefore } onClick={ () => insertTask('bottom') } />
            </FlexCell>
            <FlexSpacer />
            <FlexCell width='auto'>
                <Button size='30' icon={ undoIcon } onClick={ undo } isDisabled={ !canUndo } />
            </FlexCell>
            <FlexCell width='auto'>
                <Button size='30' icon={ redoIcon } onClick={ redo } isDisabled={ !canRedo } />
            </FlexCell>
            <FlexCell width='auto'>
                <Button size='30' caption="Save" onClick={ save } isDisabled={ !isChanged } />
            </FlexCell>
            <FlexCell width='auto'>
                <Button size='30' caption="Revert" onClick={ revert } isDisabled={ !isChanged } />
            </FlexCell>
        </FlexRow>
        <DataTable
            headerTextCase='upper'
            getRows={ () => rows }
            columns={ taskColumns }
            value={ tableState }
            onValueChange={ setTableState }
            showColumnsConfig
            allowColumnsResizing
            allowColumnsReordering
            { ...listProps }
        >
            <DataTableRow
                columns={ summaryColumns }
                id="footer"
                rowKey="footer"
                index={ 100500 }
                value={ summary }
            />
        </DataTable>
    </Panel>;
};