import * as React from 'react';
import { DocBuilder } from '@epam/uui-docs';
import { TextPlaceholder, TextPlaceholderProps } from '../TextPlaceholder';
import { DefaultContext, FormContext, GridContext, ColorPicker } from '../../../docs';
import { colors } from "../../../helpers/colorMap";

const textPlaceholderDoc = new DocBuilder<TextPlaceholderProps>({ name: 'TextPlaceholder', component: TextPlaceholder })
    .prop('wordsCount', { examples: [2, 3, 4, 5, 6, 12, 150] })
    .prop('color', {
        examples: ['gray10', 'gray40'],
        renderEditor: (editable, examples) => <ColorPicker colors={ examples.map(i => ({ value: i, hex: colors[i] })) } { ...editable } />,
        defaultValue: 'gray40',
    })
    .prop('isNotAnimated', { examples: [true, false] })
    .withContexts(DefaultContext, FormContext, GridContext);

export = textPlaceholderDoc;