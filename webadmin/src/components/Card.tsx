import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  onClick,
  variant = 'default',
}) => {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm',
    elevated: 'bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl',
    outlined: 'bg-transparent border-2 border-slate-200 dark:border-slate-700',
    glass: 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/20',
  };

  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default Card;
