import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = memo(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-xl transition-all duration-150 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98] hover:scale-[1.02]
    transform-gpu
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-primary-600 to-primary-500
      hover:from-primary-500 hover:to-primary-400
      text-white shadow-lg shadow-primary-500/25
      focus:ring-primary-500
    `,
    secondary: `
      bg-gray-800 border border-gray-700
      hover:bg-gray-700 hover:border-gray-600
      text-gray-100
      focus:ring-gray-500
    `,
    ghost: `
      bg-transparent hover:bg-gray-800/50
      text-gray-300 hover:text-white
      focus:ring-gray-500
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-500
      hover:from-red-500 hover:to-red-400
      text-white shadow-lg shadow-red-500/25
      focus:ring-red-500
    `,
    success: `
      bg-gradient-to-r from-green-600 to-green-500
      hover:from-green-500 hover:to-green-400
      text-white shadow-lg shadow-green-500/25
      focus:ring-green-500
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], disabled && 'hover:scale-100 active:scale-100', className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';

