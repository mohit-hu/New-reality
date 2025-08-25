import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  color?: 'purple' | 'blue' | 'green' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullScreen = false,
  color = 'purple'
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    purple: 'border-purple-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    gray: 'border-gray-600'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Spinner */}
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
      />
      
      {/* Message */}
      {message && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full mx-4">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// Additional loading components for specific use cases

export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading page...' }) => (
  <LoadingSpinner size="large" message={message} fullScreen />
);

export const ButtonLoader: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    <span>Loading...</span>
  </div>
);

export const InlineLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center justify-center gap-2 py-4">
    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    {message && <span className="text-gray-600">{message}</span>}
  </div>
);

export const CardLoader: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

export const SkeletonLoader: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index} 
        className="h-4 bg-gray-200 rounded"
        style={{ width: `${Math.random() * 40 + 60}%` }}
      />
    ))}
  </div>
);

export const DotLoader: React.FC<{ color?: string }> = ({ color = 'bg-purple-600' }) => (
  <div className="flex space-x-1 justify-center items-center">
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className={`w-2 h-2 ${color} rounded-full animate-pulse`}
        style={{
          animationDelay: `${index * 0.15}s`,
          animationDuration: '1s'
        }}
      />
    ))}
  </div>
);

export default LoadingSpinner;
