import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        default: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-2',
        xl: 'h-12 w-12 border-4',
      },
      variant: {
        default: 'border-gray-300 border-t-primary-600',
        primary: 'border-primary-200 border-t-primary-600',
        white: 'border-gray-200 border-t-white',
        success: 'border-success-200 border-t-success-600',
        danger: 'border-danger-200 border-t-danger-600',
        warning: 'border-warning-200 border-t-warning-600',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string;
  centered?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size,
  variant,
  text,
  centered = false,
  ...props
}) => {
  const content = (
    <div className="flex flex-col items-center space-y-2">
      <motion.div
        className={cn(spinnerVariants({ size, variant, className }))}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        {...props}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export { LoadingSpinner };
