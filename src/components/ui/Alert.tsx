import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  className?: string;
}

export const Alert = ({ children, variant = 'info', title, className = '' }: AlertProps) => {
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
      title: 'text-green-800 dark:text-green-400',
      text: 'text-green-700 dark:text-green-300'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
      title: 'text-yellow-800 dark:text-yellow-400',
      text: 'text-yellow-700 dark:text-yellow-300'
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      title: 'text-red-800 dark:text-red-400',
      text: 'text-red-700 dark:text-red-300'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: 'text-blue-800 dark:text-blue-400',
      text: 'text-blue-700 dark:text-blue-300'
    }
  };

  const config = variants[variant];

  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${config.container} ${className}`}>
      <div className="flex-shrink-0">{config.icon}</div>
      <div className="flex-1">
        {title && (
          <h4 className={`font-medium mb-1 ${config.title}`}>{title}</h4>
        )}
        <div className={`text-sm ${config.text}`}>{children}</div>
      </div>
    </div>
  );
};
