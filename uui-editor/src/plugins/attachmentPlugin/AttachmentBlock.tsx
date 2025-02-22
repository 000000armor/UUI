import React, { useState } from 'react';
import cx from 'classnames';
import { uuiMod, uuiSkin } from '@epam/uui-core';
import { IconContainer } from '@epam/uui-components';


import { ReactComponent as DownloadIcon } from '../../icons/download-icon.svg';
import { ReactComponent as FileIcon } from '../../icons/file-file-24.svg';
import { ReactComponent as DocIcon } from '../../icons/file-file_word-24.svg';
import { ReactComponent as ExelIcon } from '../../icons/file-file_excel-24.svg';
import { ReactComponent as PdfIcon } from '../../icons/file-file_pdf-24.svg';
import { ReactComponent as ImgIcon } from '../../icons/file-file_image-24.svg';
import { ReactComponent as VideoIcon } from '../../icons/file-file_video-24.svg';
import { ReactComponent as TableIcon } from '../../icons/file-file_table-24.svg';
import { ReactComponent as TextIcon } from '../../icons/file-file_text-24.svg';
import { ReactComponent as MailIcon } from '../../icons/file-file_eml-24.svg';

import css from './AttachmentBlock.module.scss';
import { setElements } from '@udecode/plate-common';
import { useFocused, useReadOnly, useSelected } from 'slate-react';

const { FlexRow, FlexCell, TextInput, Spinner } = uuiSkin;

function getReadableFileSizeString(fileSizeInBytes: number) {
    let i = -1;
    let byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1000;
        i++;
    } while (fileSizeInBytes > 1000);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}

export function AttachmentBlock(props: any) {
    const isSelected = useSelected() && useFocused();
    const isReadonly = useReadOnly();

    const { element, editor, children } = props;
    const [fileName, setFileName] = useState(element.data.fileName || element.fileName);

    const changeName = (name: string) => {
        setElements(editor, {
            ...element,
            data: {
                ...element.data,
                fileName: name,
            },
        });
    };

    const handleKeyDown = (event: any) => {
        event.preventDefault();
        if (event.code === 'Enter') {
            event.target.click();
            event.target.blur();
        }
    };

    const getIcon = () => {
        const { data } = element;
        const type = data?.extension && data?.extension.toLowerCase();
        switch (type) {
            case 'doc':
            case 'docx': {
                return <IconContainer size={ 48 } icon={ DocIcon } cx={ css.docColor }/>;
            }
            case 'xls':
            case 'xlsx': {
                return <IconContainer size={ 48 } icon={ ExelIcon } cx={ css.xlsColor }/>;
            }
            case 'pdf': {
                return <IconContainer size={ 48 } icon={ PdfIcon } cx={ css.pdfColor }/>;
            }
            case 'gif':
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'webp': {
                return <IconContainer size={ 48 } icon={ ImgIcon } cx={ css.img }/>;
            }
            case 'avi':
            case 'mov':
            case 'mp4':
            case 'wmw':
            case 'mkv': {
                return <IconContainer size={ 48 } icon={ VideoIcon } cx={ css.img }/>;
            }
            case 'csv':
            case 'xml': {
                return <IconContainer size={ 48 } icon={ TableIcon } cx={ css.img }/>;
            }
            case 'rtf':
            case 'txt': {
                return <IconContainer size={ 48 } icon={ TextIcon } cx={ css.img }/>;
            }
            case 'eml':
            case 'emlx': {
                return <IconContainer size={ 48 } icon={ MailIcon } cx={ css.img }/>;
            }
            default: {
                return <IconContainer size={ 48 } icon={ FileIcon } cx={ css.img }/>;
            }
        }
    };

    return (
        <FlexRow
            rawProps={ {
                ...props.attributes,
                contentEditable: false,
                style: { userSelect: "none" },
            } }
            alignItems='stretch'
            cx={ cx(css.row, isSelected && uuiMod.focus) }
        >
            <FlexCell width={ 90 } shrink={ 0 } cx={ css.imgBox }>
                { getIcon() }
            </FlexCell>
            <FlexCell width="100%" cx={ css.info }>
                {
                    isReadonly
                        ? <div className={ css.fileName }> { fileName }</div>
                        : <TextInput
                            cx={ css.input }
                            onClick={ (e: any) =>  { e.stopPropagation(); e.preventDefault(); } }
                            placeholder='Describe attachment: book, link...'
                            onBlur={ () => changeName(fileName) }
                            value={ fileName }
                            onValueChange={ setFileName }
                            isReadonly={ isReadonly }
                        />
                }
                <div className={ css.sizeLabel }> { getReadableFileSizeString(element.data.size) } </div>
            </FlexCell>
            <FlexCell width='auto' shrink={ 0 } cx={ css.imgBox }>
                <a href={ element.data.path } onKeyDown={handleKeyDown} download={ true } className={ css.linkWrapper }>
                    <IconContainer icon={ DownloadIcon } cx={ css.img }/>
                </a>
            </FlexCell>
            { children }
        </FlexRow>
    );
}
