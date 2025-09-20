import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300',
        destructive: 'bg-danger-100 text-danger-800 hover:bg-danger-200 dark:bg-danger-900 dark:text-danger-300',
        success: 'bg-success-100 text-success-800 hover:bg-success-200 dark:bg-success-900 dark:text-success-300',
        warning: 'bg-warning-100 text-warning-800 hover:bg-warning-200 dark:bg-warning-900 dark:text-warning-300',
        info: 'bg-info-100 text-info-800 hover:bg-info-200 dark:bg-info-900 dark:text-info-300',
        outline: 'border border-gray-200 text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
        filled: 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  dot?: boolean;
  animated?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, asChild = false, dot = false, animated = false, children, ...props }, ref) => {
    return (
      <motion.div
        className={cn(badgeVariants({ variant, size, className }))}
        ref={ref}
        initial={animated ? { scale: 0, opacity: 0 } : {}}
        animate={animated ? { scale: 1, opacity: 1 } : {}}
        whileHover={animated ? { scale: 1.05 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {dot && (
          <motion.div
            className="mr-1 h-1.5 w-1.5 rounded-full bg-current"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        {children}
      </motion.div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
