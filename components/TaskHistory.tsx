import { useEffect, useState } from 'react';
import { getPreviousDayTasksString } from '../services/firestoreService';
import { SkeletonLoader } from './LoadingSpinner';
import { CalendarIcon, CheckCircleIcon, CloseIcon } from './Icons';

interface TaskHistoryProps {
  userId: string;
  days?: number; // How many previous days to show, default 7
}

interface TaskHistoryData {
  date: string;
  tasks: {
    text: string;
    isCompleted: boolean;
  }[];
  formattedDate: string;
}

export function TaskHistory({ userId, days = 7 }: TaskHistoryProps) {
  const [taskData, setTaskData] = useState<TaskHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const allTasks: TaskHistoryData[] = [];
        
        for (let i = 1; i <= days; i++) {
          const day = new Date(Date.now() - i * 86400000);
          const dateStr = day.toISOString().split('T')[0];
          
          const tasksStr = await getPreviousDayTasksString(userId, dateStr);
          
          if (tasksStr && tasksStr !== "No previous tasks recorded.") {
            const tasks = tasksStr.split('\n')
              .filter(Boolean)
              .map(taskLine => {
                const isCompleted = taskLine.includes('(Completed)');
                const text = taskLine
                  .replace(/\s*\((Completed|Not Completed)\)\s*$/, '')
                  .replace(/^-\s*/, '')
                  .trim();
                
                return { text, isCompleted };
              })
              .filter(task => task.text.length > 0);

            if (tasks.length > 0) {
              allTasks.push({
                date: dateStr,
                tasks,
                formattedDate: day.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })
              });
            }
          }
        }
        
        setTaskData(allTasks);
      } catch (err: any) {
        console.error('Error fetching task history:', err);
        setError(err.message || 'Failed to load task history');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [userId, days]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CalendarIcon className="text-purple-600" />
          Task History
        </h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonLoader lines={1} />
              <div className="ml-4">
                <SkeletonLoader lines={2} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CalendarIcon className="text-purple-600" />
          Task History
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <CloseIcon className="text-red-500 mx-auto mb-2" size={24} />
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (taskData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CalendarIcon className="text-purple-600" />
          Task History
        </h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <CalendarIcon className="text-gray-400 mx-auto mb-3" size={32} />
          <h4 className="text-gray-600 font-medium mb-2">No Previous Tasks</h4>
          <p className="text-gray-500 text-sm">
            Complete some tasks to see your history here!
          </p>
        </div>
      </div>
    );
  }

  const totalTasks = taskData.reduce((sum, day) => sum + day.tasks.length, 0);
  const completedTasks = taskData.reduce(
    (sum, day) => sum + day.tasks.filter(task => task.isCompleted).length, 
    0
  );
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="text-purple-600" />
          Task History
        </h3>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last {days} days</div>
          <div className="text-lg font-bold text-purple-600">{completionRate}%</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
          <div className="text-xs text-blue-600">Total Tasks</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
      </div>

      {/* Task History */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {taskData.map((dayData) => (
          <div key={dayData.date} className="border-l-2 border-purple-200 pl-4">
            {/* Date Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-purple-600 text-white rounded-full w-3 h-3 -ml-6 border-2 border-white"></div>
              <h4 className="font-medium text-gray-800">{dayData.formattedDate}</h4>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {dayData.tasks.length} tasks
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-2 ml-2">
              {dayData.tasks.map((task, taskIndex) => (
                <div
                  key={taskIndex}
                  className={`flex items-start gap-2 p-2 rounded-lg ${
                    task.isCompleted 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {task.isCompleted ? (
                      <CheckCircleIcon className="text-green-600" size={16} />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <span 
                    className={`text-sm ${
                      task.isCompleted ? 'line-through' : ''
                    }`}
                  >
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {taskData.length >= days && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {/* Implement show more functionality */}}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            View More History →
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskHistory;
