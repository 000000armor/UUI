import css from './TabButton.scss';
import { TabButton as UuiTabButton, TabButtonProps as UuiTabButtonProps } from '@epam/uui';
import { withMods } from '@epam/uui-core';

export interface TabButtonMods extends UuiTabButtonProps {
    theme?: 'light' | 'dark';
}

function applyTabButtonMods(mods: TabButtonMods & UuiTabButtonProps) {
    return [
        'uui-theme-loveship',
        css.root,
        css['theme-' + (mods.theme || 'light')],
    ];
}

export const TabButton = withMods<UuiTabButtonProps, TabButtonMods>(UuiTabButton, applyTabButtonMods);
