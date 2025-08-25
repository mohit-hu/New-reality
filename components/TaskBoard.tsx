import React from 'react';
import { Task } from '../types';
import { FiCheck, FiStar } from 'react-icons/fi';

interface TaskBoardProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onToggleTask }) => {
  const giaTasks = tasks.filter(task => task.isGIA);
  const otherTasks = tasks.filter(task => !task.isGIA && !task.id.includes('quote'));

  return (
    <div className="space-y-6">
      {/* GIA Tasks */}
      {giaTasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-2">
              <FiStar size={20} />
            </div>
            Greatest Impact Activity
          </h2>
          <div className="space-y-3">
            {giaTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                isHighlighted={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Tasks */}
      {otherTasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="bg-gray-100 text-gray-600 rounded-full p-2">
              ✅
            </div>
            Supporting Tasks
          </h2>
          <div className="space-y-3">
            {otherTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                isHighlighted={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {giaTasks.length === 0 && otherTasks.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            📋
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No tasks available
          </h3>
          <p className="text-gray-500">
            Generate your daily plan to get started with personalized tasks!
          </p>
        </div>
      )}
    </div>
  );
};

// TaskItem Component
interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  isHighlighted?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, isHighlighted = false }) => {
  return (
    <div
      className={`p-4 rounded-xl transition-all duration-200 cursor-pointer border ${
        isHighlighted
          ? task.isCompleted
            ? 'bg-green-50 border-green-200 shadow-sm'
            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 shadow-md hover:shadow-lg'
          : task.isCompleted
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md'
      }`}
      onClick={() => onToggle(task.id)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.isCompleted
              ? 'bg-green-500 border-green-500'
              : isHighlighted
              ? 'border-purple-400 hover:border-purple-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {task.isCompleted && <FiCheck className="text-white" size={14} />}
        </div>
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-base ${
              task.isCompleted
                ? 'text-gray-500 line-through'
                : isHighlighted
                ? 'text-gray-800 font-medium'
                : 'text-gray-700'
            }`}
          >
            {task.text}
          </p>
          
          {/* Priority Badge */}
          {isHighlighted && !task.isCompleted && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                🎯 Priority Task
              </span>
            </div>
          )}
          
          {/* Completion Badge */}
          {task.isCompleted && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                ✓ Completed
              </span>
            </div>
          )}
        </div>

        {/* GIA Star Icon */}
        {task.isGIA && (
          <div className="flex-shrink-0">
            <div className="bg-yellow-100 text-yellow-600 rounded-full p-1">
              <FiStar size={16} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
