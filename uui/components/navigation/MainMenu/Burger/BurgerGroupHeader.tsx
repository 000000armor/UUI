import * as React from 'react';
import css from './BurgerGroupHeader.module.scss';

export interface BurgerGroupHeaderProps {
    caption: string;
}

export function BurgerGroupHeader(props: BurgerGroupHeaderProps) {
    return (
        <div className={ css.groupHeader }>
            <hr className={ css.line } />
            <span className={ css.groupName }>{props.caption}</span>
        </div>
    );
}
