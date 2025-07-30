
import React from 'react';
import { Task } from '../types';
import { CheckIcon, StarIcon } from './Icons';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        task.isCompleted ? 'bg-emerald-50 text-slate-500' : 'bg-slate-100 hover:bg-slate-200'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center mr-4 transition-all duration-200 flex-shrink-0 ${
          task.isCompleted ? 'bg-brand-secondary' : 'bg-white border-2 border-slate-300'
        }`}
      >
        {task.isCompleted && <CheckIcon className="w-4 h-4 text-white" />}
      </div>
      <span className={`flex-grow ${task.isCompleted ? 'line-through' : ''}`}>
        {task.text}
      </span>
      {task.isGIA && <StarIcon className="w-5 h-5 ml-3 text-amber-400 flex-shrink-0" />}
    </div>
  );
};

export default TaskItem;
