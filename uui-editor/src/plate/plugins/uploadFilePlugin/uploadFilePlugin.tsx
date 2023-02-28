import React from 'react';
import { UploadFileToggler} from '@epam/uui-components';

import {
    ToolbarButton as PlateToolbarButton,
    getPreventDefaultHandler,
    createPluginFactory,
    createInsertDataPlugin,
    PlateEditor,
} from "@udecode/plate";

import { isPluginActive, isTextSelected } from '../../../helpers';

import { ToolbarButton } from '../../../implementation/ToolbarButton';

import { ReactComponent as AttachIcon } from '../../../icons/attach-file.svg';

import { withFileUpload } from './withFileUpload';

const KEY = 'fileUpload';

export interface UploadFileOptions {
    uploadFile(file: File, onProgress: (progress: any) => any): any;
}

export const uploadFilePlugin = (options: UploadFileOptions) => createInsertDataPlugin({
    options,
    withOverrides: withFileUpload,
});

interface IUploadFileButton {
    editor: PlateEditor;
}

export const UploadFileButton = ({ editor }: IUploadFileButton): any => {

    if (!isPluginActive(KEY)) return null;

    return (
        <UploadFileToggler
            render={ (props) => (
                <PlateToolbarButton
                    styles={ { root: {width: 'auto', cursor: 'pointer', padding: '0px' }} }
                    active={ true }
                    onMouseDown={
                        editor
                            ? getPreventDefaultHandler()
                            : undefined
                    }
                    icon={ <ToolbarButton
                        { ...props }
                        icon={ AttachIcon }
                        isDisabled={ isTextSelected(editor, true) }
                    /> }
                />
            ) }
            onFilesAdded={ (files) =>
                (editor as any).insertData({ getData: () => 'files', files })
            }
        />
    );
};
