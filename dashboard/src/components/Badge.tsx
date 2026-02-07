import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
                    {
                        'border-transparent bg-blue-600 text-white hover:bg-blue-700': variant === 'default',
                        'border-transparent bg-slate-600 text-white hover:bg-slate-700': variant === 'secondary',
                        'border-transparent bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
                        'border-transparent bg-green-600 text-white hover:bg-green-700': variant === 'success',
                        'border-transparent bg-yellow-600 text-white hover:bg-yellow-700': variant === 'warning',
                        'border-slate-400 text-slate-100': variant === 'outline',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = 'Badge';

export { Badge };
