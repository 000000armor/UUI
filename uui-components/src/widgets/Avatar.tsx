import * as React from 'react';
import { IHasCX, cx, IHasRawProps, IHasForwardedRef } from '@epam/uui-core';
import * as css from './Avatar.scss';

export interface AvatarProps extends IHasCX, IHasRawProps<HTMLImageElement>, IHasForwardedRef<HTMLImageElement> {
    alt?: string;
    img: string;
    size: '12' | '18' | '24' | '30' | '36' | '42' | '48' | '54' | '60' | '72' | '78' | '90' | '144';
    isLoading?: boolean;
    onClick?: () => void;
}

const AvatarComponent = (props: AvatarProps, ref: React.ForwardedRef<HTMLImageElement>) => {
    return (
            <img
                onClick={ () => props.onClick() }
                ref={ ref }
                className={ cx(css.avatar, props.cx) }
                width={ props.size }
                height={ props.size }
                src={ (props.isLoading || !props.img) ? 'https://static.cdn.epam.com/uploads/690afa39a93c88c4dd13758fe1d869d5/EPM-UUI/Images/avatar_placeholder.jpg' : props.img }
                alt={ props.alt }
                { ...props.rawProps }
            />
    );
};

export const Avatar = React.forwardRef(AvatarComponent) as <AvatarComponent>(props: AvatarProps, ref: React.ForwardedRef<HTMLImageElement>) => JSX.Element;