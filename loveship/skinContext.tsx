import { ISkin, skinComponent, SkinContextComponentProps, ButtonCoreProps } from '@epam/uui-core';
import { DatePicker, RangeDatePicker, FlexCell, Spinner } from '@epam/uui';
import { Checkbox, FlexRow, TextInput, Button, ModalWindow, ModalBlocker, ModalFooter, ModalHeader, LabeledInput, IconButton, ButtonColorType, IconButtonProps } from './components';

const buttonTypeToColor: { [key: string]: ButtonColorType } = {
    success: 'grass',
    cancel: 'night500',
    action: 'sky',
};

const mapIconButtonProp = (props: SkinContextComponentProps<ButtonCoreProps>): IconButtonProps => {
    const resultProps: IconButtonProps = {
        ...props,
        color: 'night600',
    };

    if (props.usageContext.includes('RTE-Sidebar')) {
        resultProps.color = 'night400';
    }

    return resultProps;
};

export const skinContext: ISkin = {
    TextInput: skinComponent(TextInput),
    Spinner: skinComponent(Spinner),
    FlexRow: skinComponent(FlexRow, (props) => ({ spacing: null, ...props })),
    FlexCell: skinComponent(FlexCell),
    Button: skinComponent(Button, (props) => ({ color: buttonTypeToColor[props.type], ...props })),
    IconButton: skinComponent(IconButton, mapIconButtonProp),
    Checkbox: skinComponent(Checkbox),
    ModalWindow: skinComponent(ModalWindow),
    ModalBlocker: skinComponent(ModalBlocker, (props) => ({ blockerShadow: 'dark' as const, ...props })),
    ModalFooter: skinComponent(ModalFooter),
    ModalHeader: skinComponent(ModalHeader, (props) => ({ borderBottom: true as const, ...props })),
    LabeledInput: skinComponent(LabeledInput, (props) => ({ size: '36' as const, ...props })),
    DatePicker: skinComponent(DatePicker),
    RangeDatePicker: skinComponent(RangeDatePicker),
};
