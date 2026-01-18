import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger';
    className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
    value,
    max = 100,
    size = 'md',
    showLabel = false,
    variant = 'default',
    className,
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    };

    const variants = {
        default: 'bg-primary-500',
        gradient: 'bg-gradient-to-r from-primary-500 to-secondary-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
    };

    return (
        <div className={cn('w-full', className)}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-medium text-gray-200">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={cn('w-full bg-gray-800 rounded-full overflow-hidden', sizes[size])}>
                <div
                    className={cn('h-full rounded-full transition-all duration-500 ease-out', variants[variant])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};



interface CircularProgressProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
    className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    max = 100,
    size = 80,
    strokeWidth = 6,
    showLabel = true,
    className,
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-gray-800"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500 ease-out"
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                </defs>
            </svg>
            {showLabel && (
                <span className="absolute text-sm font-semibold text-white">
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
};
