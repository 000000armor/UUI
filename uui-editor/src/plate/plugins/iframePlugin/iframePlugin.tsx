import React from 'react';
import { UploadFileToggler } from '@epam/uui-components';

import {
    createPluginFactory,
    getBlockAbove,
    insertEmptyElement,
    PlateEditor,
    ToolbarButton as PlateToolbarButton,
} from '@udecode/plate';

import { ToolbarButton } from '../../../implementation/ToolbarButton';

import { ReactComponent as PdfIcon } from '../../../icons/pdf.svg';

import { isPluginActive, isTextSelected } from '../../../helpers';

import { IframeBlock } from './IframeBlock';

const KEY = 'iframe';

export const iframePlugin = () => {
    const createIframePlugin = createPluginFactory({
        key: KEY,
        isElement: true,
        isVoid: true,
        component: IframeBlock,
        handlers: {
            onKeyDown: (editor) => (event) => {
                const block = getBlockAbove(editor);
                const type = block?.length && block[0].type;

                if (event.keyCode == 13 && type === 'iframe') {
                    return insertEmptyElement(editor, 'paragraph');
                }

                if ((event.key === 'Backspace' || event.key === 'Delete') && type === 'iframe') {
                    return insertEmptyElement(editor, 'paragraph');
                }
            },
        },
    });

    return createIframePlugin();
};

interface IIframeButton {
    editor: PlateEditor;
}

export const IframeButton = ({ editor }: IIframeButton) => {

    if (!isPluginActive(KEY)) return null;

    return (
        <UploadFileToggler
            render={ (props) => (
                <PlateToolbarButton
                    styles={ { root: {width: 'auto', cursor: 'pointer', padding: '0px' }} }
                    active={ true }
                    onMouseDown={
                        editor
                            ? (e) => e.preventDefault()
                            : undefined
                    }
                    icon={ <ToolbarButton
                        { ...props }
                        icon={ PdfIcon }
                        isDisabled={ isTextSelected(editor, true) }
                    /> }
                />
            ) }
            onFilesAdded={ (files) =>
                (editor as any).insertData({ getData: () => 'files', files })
            }
            accept='.pdf'
        />
    );
};