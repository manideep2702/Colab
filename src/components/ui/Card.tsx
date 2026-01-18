import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'gradient' | 'hover';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    variant = 'default',
    padding = 'md',
    className,
    children,
    ...props
}) => {
    const baseStyles = 'rounded-2xl overflow-hidden';

    const variants = {
        default: 'bg-gray-900/50 border border-gray-800',
        glass: 'glass',
        gradient: 'bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800/50',
        hover: 'bg-gray-900/50 border border-gray-800 hover:border-primary-500/50 hover:bg-gray-800/50 transition-all duration-300',
    };

    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={cn(baseStyles, variants[variant], paddings[padding], className)}
            {...props}
        >
            {children}
        </div>
    );
};

interface AnimatedCardProps extends CardProps {
    delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    delay = 0,
    children,
    ...props
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card {...props}>{children}</Card>
        </motion.div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => (
    <div className={cn('mb-4', className)} {...props}>
        {children}
    </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
    className,
    children,
    ...props
}) => (
    <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>
        {children}
    </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
    className,
    children,
    ...props
}) => (
    <p className={cn('text-sm text-gray-400 mt-1', className)} {...props}>
        {children}
    </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => (
    <div className={cn('', className)} {...props}>
        {children}
    </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => (
    <div className={cn('mt-4 pt-4 border-t border-gray-800 flex items-center justify-between', className)} {...props}>
        {children}
    </div>
);
