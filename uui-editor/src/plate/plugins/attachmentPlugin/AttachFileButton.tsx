import React, { memo, useMemo } from 'react';
import { UploadFileToggler } from '@epam/uui-components';

import {
    ToolbarButton as PlateToolbarButton,
    PlateEditor, focusEditor
} from "@udecode/plate";

import { isPluginActive, isTextSelected } from '../../../helpers';
import { ToolbarButton } from '../../../implementation/ToolbarButton';
import { ReactComponent as AttachIcon } from '../../../icons/attach-file.svg';
import { ATTACHMENT_KEY, UploadFileOptions } from '../attachmentPlugin/attachmentPlugin';
import { createFileUploader } from '../attachmentPlugin/file_uploader';

interface IUploadFileButton {
    editor: PlateEditor;
}

export const AttachFileButton = memo(({ editor }: IUploadFileButton): any => {
    const onFilesAdded = useMemo(() => createFileUploader(editor), [editor]);

    if (!isPluginActive(ATTACHMENT_KEY)) return null;

    return (
        <UploadFileToggler
            render={ (props) => (
                <PlateToolbarButton
                    styles={ { root: { width: 'auto', cursor: 'pointer', padding: '0px' } } }
                    active={ true }
                    onMouseDown={ (e) => {
                        e.preventDefault();
                        focusEditor(editor);
                    } }
                    icon={ <ToolbarButton
                        { ...props }
                        onClick={ () => {
                            focusEditor(editor);
                            props.onClick();
                            focusEditor(editor);
                        } }
                        icon={ AttachIcon }
                        isDisabled={ isTextSelected(editor, true) }
                    /> }
                />
            ) }
            onFilesAdded={ onFilesAdded }
        />
    );
});
