import { Avatar, AvatarProps } from '@epam/uui-components';
import { DocBuilder } from '@epam/uui-docs';
import { DefaultContext } from '../../../docs/index';

const AvatarDoc = new DocBuilder<AvatarProps>({ name: 'Avatar', component: Avatar })
    .prop('img', {
        examples: [
            {
                name: 'Olivia',
                value: 'https://avatars.dicebear.com/api/human/avatar12.svg?background=%23EBEDF5&radius=50',
                isDefault: true,
            },
        ],
        isRequired: true,
    })
    .prop('size', {
        examples: ['12', '18', '24', '36', { name: '48', value: '48', isDefault: true }, '54', '60', '72', '78', '90', '144'],
        isRequired: true,
        defaultValue: '48',
    })
    .prop('isLoading', {
        examples: [true],
    })
    .withContexts(DefaultContext);

export default AvatarDoc;
