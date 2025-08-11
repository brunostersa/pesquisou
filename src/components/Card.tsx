import React from 'react';

// Função utilitária para combinar classes CSS
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

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
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
    elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600 shadow-none',
    gradient: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm',
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

  const hoverClasses = hover ? 'hover:shadow-md cursor-pointer' : '';
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
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  icon,
  action,
}) => {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center space-x-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>{children}</div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

// Componente CardContent para conteúdo do card
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return <div className={cn('', className)}>{children}</div>;
};

// Componente CardFooter para rodapés de card
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center justify-between pt-4 mt-4 border-t border-custom', className)}>
      {children}
    </div>
  );
};

// Componente CardMetric para métricas
interface CardMetricProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const CardMetric: React.FC<CardMetricProps> = ({
  title,
  value,
  icon,
  trend,
  className,
  onClick,
}) => {
  return (
    <div 
      className={cn('flex items-center', className, onClick && 'cursor-pointer hover:bg-tertiary/50 transition-colors rounded-lg p-2')}
      onClick={onClick}
    >
      {icon && (
        <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <div className="text-blue-600">{icon}</div>
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-secondary">{title}</p>
        <div className="flex items-center space-x-2">
          <p className="text-2xl font-semibold text-blue-600">{value}</p>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success-color' : 'text-error-color'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
      </div>
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
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:opacity-90 focus:ring-blue-500',
    secondary: 'bg-secondary-color text-inverse hover:opacity-90 focus:ring-secondary-color',
    outline: 'bg-transparent border border-gray-300 text-blue-600 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'bg-transparent text-blue-600 hover:bg-gray-50 focus:ring-blue-500',
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