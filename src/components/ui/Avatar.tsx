import React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    name,
    size = 'md',
    className,
    ...props
}) => {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    };

    return (
        <div
            className={cn(
                'relative rounded-full overflow-hidden flex items-center justify-center',
                'bg-gradient-to-br from-primary-500 to-secondary-500',
                'font-semibold text-white',
                sizes[size],
                className
            )}
            {...props}
        >
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{getInitials(name)}</span>
            )}
        </div>
    );
};

interface AvatarGroupProps {
    avatars: Array<{ src?: string; name: string }>;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
    avatars,
    max = 4,
    size = 'md',
}) => {
    const displayed = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
        <div className="flex -space-x-2">
            {displayed.map((avatar, i) => (
                <Avatar
                    key={i}
                    src={avatar.src}
                    name={avatar.name}
                    size={size}
                    className="ring-2 ring-gray-900"
                />
            ))}
            {remaining > 0 && (
                <div
                    className={cn(
                        'relative rounded-full flex items-center justify-center',
                        'bg-gray-700 font-medium text-gray-300 ring-2 ring-gray-900',
                        size === 'sm' && 'w-8 h-8 text-xs',
                        size === 'md' && 'w-10 h-10 text-sm',
                        size === 'lg' && 'w-12 h-12 text-base'
                    )}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
};
