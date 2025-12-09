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
      className={`flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200 border ${sizeClasses[size]} ${
        task.isCompleted 
          ? 'bg-green-500/20 border-green-500/30 text-green-300'
          : isHighlighted
          ? 'bg-purple-900/20 border-purple-500/40 hover:border-purple-500/60 shadow-lg hover:shadow-xl hover:shadow-purple-500/20'
          : 'bg-slate-700/40 border-slate-600/40 hover:border-slate-500/60 hover:bg-slate-700/50'
      }`}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <div
          className={`flex items-center justify-center rounded-full border-2 transition-all ${
            task.isCompleted
              ? 'bg-green-500 border-green-500'
              : isHighlighted
              ? 'border-purple-400 hover:border-purple-300'
              : 'border-slate-500 hover:border-slate-400'
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
              ? 'line-through text-green-400'
              : isHighlighted
              ? 'text-white font-medium'
              : 'text-slate-200'
          }`}
        >
          {task.text}
        </span>
        
        {/* Priority Badge */}
        {isHighlighted && !task.isCompleted && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/30 text-purple-200 text-xs font-medium rounded-full border border-purple-500/50">
              🎯 Priority Task
            </span>
          </div>
        )}

        {/* Completion Badge */}
        {task.isCompleted && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/30 text-green-200 text-xs font-medium rounded-full border border-green-500/50">
              <CheckCircleIcon size={12} />
              Completed
            </span>
          </div>
        )}
      </div>

      {/* GIA Star Icon */}
      {task.isGIA && showGIABadge && (
        <div className="flex-shrink-0">
          <div className="bg-yellow-500/30 text-yellow-300 rounded-full p-1 border border-yellow-500/40">
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
        ? 'bg-green-500/20 text-green-300'
        : 'hover:bg-slate-700/50'
    }`}
  >
    <div
      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
        task.isCompleted
          ? 'bg-green-500 border-green-500'
          : 'border-slate-500'
      }`}
    >
      {task.isCompleted && <CheckIcon className="text-white" size={10} />}
    </div>

    <span className={`text-sm text-slate-300 ${task.isCompleted ? 'line-through' : ''}`}>
      {task.text}
    </span>

    {task.isGIA && (
      <StarIcon className="text-yellow-400" size={12} />
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
        ? 'bg-green-500/20 border-green-500/30'
        : isHighlighted
        ? 'bg-purple-900/20 border-purple-500/40'
        : 'bg-slate-700/40 border-slate-600/40'
    }`}
  >
    <div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
        task.isCompleted
          ? 'bg-green-500 border-green-500'
          : 'border-slate-500'
      }`}
    >
      {task.isCompleted && <CheckIcon className="text-white" size={12} />}
    </div>

    <div className="flex-1">
      <p className={`text-sm ${task.isCompleted ? 'line-through text-green-400' : 'text-slate-200'}`}>
        {task.text}
      </p>

      <div className="flex items-center gap-2 mt-1">
        {task.isGIA && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/30 text-yellow-200 text-xs rounded-full border border-yellow-500/40">
            <StarIcon size={10} />
            GIA
          </span>
        )}

        {isHighlighted && (
          <span className="inline-flex items-center px-2 py-0.5 bg-purple-500/30 text-purple-200 text-xs rounded-full border border-purple-500/40">
            Priority
          </span>
        )}
      </div>
    </div>
  </div>
);

export default TaskItem;
