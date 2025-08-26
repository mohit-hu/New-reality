import React, { useMemo } from 'react';
import { Task } from '../types';
import { FiStar } from 'react-icons/fi';
import TaskItem from './TaskItem';

interface TaskBoardProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onToggleTask }) => {
  const { giaTasks, otherTasks } = useMemo(() => {
    const validTasks =
      tasks?.filter(
        task => task?.id && !task.id.includes('quote') && task.text?.trim()
      ) || [];
    return {
      giaTasks: validTasks.filter(task => task.isGIA),
      otherTasks: validTasks.filter(task => !task.isGIA)
    };
  }, [tasks]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* GIA Tasks */}
      {giaTasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-2">
              <FiStar size={20} />
            </div>
            Greatest Impact Activity
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({giaTasks.length} {giaTasks.length === 1 ? 'task' : 'tasks'})
            </span>
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <div className="bg-gray-100 text-gray-600 rounded-full p-2">
              <span className="text-lg">✅</span>
            </div>
            Supporting Tasks
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({otherTasks.length} {otherTasks.length === 1 ? 'task' : 'tasks'})
            </span>
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
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
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

export default TaskBoard;
