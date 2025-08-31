  import React from 'react';
import { Task } from '../types';
import { CheckIcon, StarIcon, CheckCircleIcon } from './Icons';

interface TaskItemProps {
  task: Task;
  onToggle?: (taskId: string) => void;
  onClick?: (task: Task) => void;
  isHighlighted?: boolean;
  showGIABadge?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onClick,
  isHighlighted = false,
  showGIABadge = true,
  size = 'medium'
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(task);
    } else if (onToggle) {
      onToggle(task.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  };

  // Don't render invalid tasks
  if (!task || !task.id || !task.text?.trim()) {
    return null;
  }

  const sizeClasses = {
    small: 'p-2 text-sm',
    medium: 'p-3 text-base',
    large: 'p-4 text-lg'
  };

  const checkboxSizes = {
    small: 16,
    medium: 20,
    large: 24
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Toggle task: ${task.text}`}
      aria-pressed={task.isCompleted}
      className={`flex items-center gap-3 rounded-lg cursor-pointer transition-all duration-200 border ${sizeClasses[size]} ${
        task.isCompleted 
          ? 'bg-green-50 border-green-200 text-green-700'
          : isHighlighted
          ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300 shadow-md hover:shadow-lg'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <div
          className={`flex items-center justify-center rounded-full border-2 transition-all ${
            task.isCompleted
              ? 'bg-green-500 border-green-500'
              : isHighlighted
              ? 'border-purple-400 hover:border-purple-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{
            width: checkboxSizes[size],
            height: checkboxSizes[size]
          }}
        >
          {task.isCompleted && (
            <CheckIcon 
              className="text-white" 
              size={iconSizes[size]} 
            />
          )}
        </div>
      </div>

      {/* Task Text */}
      <div className="flex-1 min-w-0">
        <span
          className={`block ${
            task.isCompleted
              ? 'line-through text-green-600'
              : isHighlighted
              ? 'text-gray-800 font-medium'
              : 'text-gray-700'
          }`}
        >
          {task.text}
        </span>
        
        {/* Priority Badge */}
        {isHighlighted && !task.isCompleted && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              🎯 Priority Task
            </span>
          </div>
        )}

        {/* Completion Badge */}
        {task.isCompleted && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <CheckCircleIcon size={12} />
              Completed
            </span>
          </div>
        )}
      </div>

      {/* GIA Star Icon */}
      {task.isGIA && showGIABadge && (
        <div className="flex-shrink-0">
          <div className="bg-yellow-100 text-yellow-600 rounded-full p-1">
            <StarIcon size={iconSizes[size]} />
          </div>
        </div>
      )}
    </div>
  );
};

// Alternative compact version for lists
export const CompactTaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onClick }) => (
  <div
    onClick={() => {
      if (onClick) {
        onClick(task);
      } else if (onToggle) {
        onToggle(task.id);
      }
    }}
    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
      task.isCompleted
        ? 'bg-green-50 text-green-700'
        : 'hover:bg-gray-100'
    }`}
  >
    <div
      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
        task.isCompleted
          ? 'bg-green-500 border-green-500'
          : 'border-gray-300'
      }`}
    >
      {task.isCompleted && <CheckIcon className="text-white" size={10} />}
    </div>

    <span className={`text-sm ${task.isCompleted ? 'line-through' : ''}`}>
      {task.text}
    </span>

    {task.isGIA && (
      <StarIcon className="text-yellow-500" size={12} />
    )}
  </div>
);

// Task item for mobile view
export const MobileTaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onClick, isHighlighted }) => (
  <div
    onClick={() => {
      if (onClick) {
        onClick(task);
      } else if (onToggle) {
        onToggle(task.id);
      }
    }}
    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
      task.isCompleted
        ? 'bg-green-50 border-green-200'
        : isHighlighted
        ? 'bg-purple-50 border-purple-200'
        : 'bg-white border-gray-200'
    }`}
  >
    <div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
        task.isCompleted
          ? 'bg-green-500 border-green-500'
          : 'border-gray-300'
      }`}
    >
      {task.isCompleted && <CheckIcon className="text-white" size={12} />}
    </div>

    <div className="flex-1">
      <p className={`text-sm ${task.isCompleted ? 'line-through text-green-600' : 'text-gray-700'}`}>
        {task.text}
      </p>

      <div className="flex items-center gap-2 mt-1">
        {task.isGIA && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            <StarIcon size={10} />
            GIA
          </span>
        )}

        {isHighlighted && (
          <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
            Priority
          </span>
        )}
      </div>
    </div>
  </div>
);

export default TaskItem;
