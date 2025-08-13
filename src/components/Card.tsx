import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const baseClasses = 'rounded-lg transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-theme-card border border-theme-primary shadow-theme-sm',
    elevated: 'bg-theme-card border border-theme-primary shadow-theme-lg',
    outlined: 'bg-transparent border-2 border-theme-secondary shadow-none',
    gradient: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border border-theme-primary shadow-theme-sm',
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover ? 'hover:shadow-theme-md cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        paddingClasses[padding],
        hoverClasses,
        clickableClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Componente CardHeader para cabeçalhos de card
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('pb-4 border-b border-theme-primary', className)}>
      {children}
    </div>
  );
};

// Componente CardContent para conteúdo do card
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('py-4', className)}>
      {children}
    </div>
  );
};

// Componente CardFooter para rodapés do card
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('pt-4 border-t border-theme-primary', className)}>
      {children}
    </div>
  );
};

// Componente CardTitle para títulos do card
interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle: React.FC<CardTitleProps> = ({ 
  children, 
  className, 
  as: Component = 'h3' 
}) => {
  return (
    <Component className={cn('text-lg font-semibold text-theme-primary mb-2', className)}>
      {children}
    </Component>
  );
};

// Componente CardDescription para descrições do card
interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => {
  return (
    <p className={cn('text-theme-secondary text-sm', className)}>
      {children}
    </p>
  );
};

// Componente CardMetric para métricas/estatísticas
interface CardMetricProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const CardMetric: React.FC<CardMetricProps> = ({ 
  value, 
  label, 
  trend = 'neutral',
  className 
}) => {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-theme-secondary'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };

  return (
    <div className={cn('text-center', className)}>
      <div className={cn('text-2xl font-bold text-theme-primary mb-1', trendColors[trend])}>
        {value}
        <span className="ml-2 text-lg">{trendIcons[trend]}</span>
      </div>
      <p className="text-sm text-theme-secondary">{label}</p>
    </div>
  );
};

// Componente CardAction para ações do card
interface CardActionProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const CardAction: React.FC<CardActionProps> = ({
  children,
  className,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-focus';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    outline: 'bg-transparent border border-theme-secondary text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500',
    ghost: 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Card; 