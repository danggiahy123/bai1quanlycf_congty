import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900',
              sizeClasses[size],
              className
            )}
            onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {(title || showCloseButton) && (
                <DialogHeader className="mb-4">
                  <div className="flex items-center justify-between">
                    {title && (
                      <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                        {title}
                      </DialogTitle>
                    )}
                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onOpenChange(false)}
                        className="ml-auto"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {description && (
                    <DialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {description}
                    </DialogDescription>
                  )}
                </DialogHeader>
              )}
              <div className="space-y-4">
                {children}
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export { Modal };
