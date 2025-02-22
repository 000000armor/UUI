import React, { useCallback, useState } from 'react';
import {
    PickerInput, DataPickerRow, PickerItem, FlexCell,
} from '@epam/promo';
import {
    DataRowProps, LazyDataSourceApiRequest, useLazyDataSource, useUuiContext,
} from '@epam/uui-core';
import { Person } from '@epam/uui-docs';

export default function LazyPersonsMultiPickerWithCustomUserRow() {
    const svc = useUuiContext();
    const [value, onValueChange] = useState<number[]>();

    const loadPersons = useCallback((request: LazyDataSourceApiRequest<Person, number>) => {
        return svc.api.demo.persons(request);
    }, []);

    const dataSource = useLazyDataSource(
        {
            api: loadPersons,
        },
        [],
    );

    const renderUserRow = (props: DataRowProps<Person, number>) => (
        <DataPickerRow
            { ...props }
            key={ props.rowKey }
            alignActions="center"
            padding="12"
            renderItem={ (item) => <PickerItem { ...props } title={ item.name } subtitle={ item.jobTitle } avatarUrl={ item.avatarUrl } /> }
        />
    );

    return (
        <FlexCell width={ 300 }>
            <PickerInput
                dataSource={ dataSource }
                value={ value }
                onValueChange={ onValueChange }
                renderRow={ renderUserRow }
                entityName="person"
                selectionMode="multi"
                valueType="id"
            />
        </FlexCell>
    );
}
