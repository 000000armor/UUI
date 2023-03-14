import React from 'react';
import { useUuiContext } from '@epam/uui-core';

import {
    createPluginFactory,
    focusEditor,
    getBlockAbove,
    getPluginType,
    ImagePlugin,
    PlateEditor,
    ToolbarButton as PlateToolbarButton,
    TImageElement,
    insertNodes,
} from '@udecode/plate';

import { isPluginActive, isTextSelected } from '../../../helpers';

import { Image } from './ImageBlock';
import { AddImageModal } from './AddImageModal';

import { ToolbarButton } from '../../../implementation/ToolbarButton';

import { ReactComponent as ImageIcon } from '../../icons/image.svg';

const KEY = 'image';

export const imagePlugin = () => {

    const createImagePlugin = createPluginFactory<ImagePlugin>({
        key: KEY,
        type: 'image',
        isElement: true,
        isVoid: true,
        component: Image,
        handlers: {
            onKeyDown: (editor) => (e) => {
                // focus caption from image
                const entry = getBlockAbove(editor, {
                    match: { type: getPluginType(editor, KEY) },
                });
                if (!entry) return;
            },
        },
        then: (editor, { type }) => ({
            deserializeHtml: {
                rules: [
                    {
                        validNodeName: 'IMG',
                    },
                ],
                getNode: (el) => ({
                    type,
                    url: el.getAttribute('src'),
                }),
            },
        }),
        plugins: [
            {
                key: 'loader',
                type: 'loader',
                isElement: true,
                isVoid: true,
                component: Image,
            },
        ],
    });
    return createImagePlugin();
};

interface IImageButton {
    editor: PlateEditor;
}

export const ImageButton = ({
   editor,
}: IImageButton) => {
    const context = useUuiContext();

    const handleImageInsert = (url: string) => {
        const text = { text: '' };

        const image: TImageElement = {
            align: 'left',
            type: getPluginType(editor, KEY),
            url: url as any,
            children: [text],
        };
        insertNodes<TImageElement>(editor, image);
        context.uuiModals.closeAll();
    };

    if (!isPluginActive(KEY)) return null;
    const block = getBlockAbove(editor);

    return (
        <PlateToolbarButton
            styles={ { root: {width: 'auto', cursor: 'pointer', padding: '0px' }} }
            onMouseDown={ async (event) => {
                if (!editor) return;

                event.preventDefault();
                focusEditor(editor);
                context.uuiModals.show<string>(modalProps => (
                    <AddImageModal
                        editor={ editor }
                        focusEditor={ () => focusEditor(editor) }
                        insertImage={ handleImageInsert }
                        { ...modalProps }
                    />
                )).catch(() => null);
            } }
            icon={ <ToolbarButton
                isDisabled={ isTextSelected(editor, true) }
                onClick={ () => {} }
                icon={ ImageIcon }
                isActive={ block?.length && block[0].type === 'image' }
            /> }
        />
    );
};