import * as React from 'react';
import cx from 'classnames';

import { PlateTableRowElement } from '@udecode/plate';

import css from './Table.scss';

const DEFAULT_HEADER_ROW_HEIGHT = 42;
const DEFAULT_HEIGHT = 50;

export function TableRow(props: any) {
    const { attributes, children, element } = props;

    const isHeaderRow = () => {
        return element.children[0]?.type === 'th';
    };

    if (!element.size) {
        if(isHeaderRow()) {
            element.size = DEFAULT_HEADER_ROW_HEIGHT;
        } else {
            element.size = DEFAULT_HEIGHT;
        }
    }

    return <PlateTableRowElement
        { ...attributes }
        { ...props }
        className={ cx(css.row, isHeaderRow() && css.headerRow) }
    >
        { children }
    </PlateTableRowElement>;
}
