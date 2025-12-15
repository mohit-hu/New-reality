import React, { useState } from 'react';
import { saveDailyReflection } from '../services/firestoreService';
import { getReflectionResponse } from '../services/geminiService';
import { UserProfile, Goal, Task, DailyPlan } from '../types';
import TaskBoard from './TaskBoard';
import { ButtonLoader } from './LoadingSpinner';
import { SparklesIcon, ChatIcon, RefreshIcon } from './Icons';

interface DashboardProps {
  userId: string;
  goal: Goal;
  userProfile: UserProfile;
  dailyPlan: DailyPlan | null;
  tasks: Task[];
  generatingPlan: boolean;
  onToggleTask: (taskId: string) => void;
  onRefreshPlan: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  userId,
  goal,
  userProfile,
  dailyPlan,
  tasks,
  generatingPlan,
  onToggleTask,
  onRefreshPlan
}) => {
  const [reflection, setReflection] = useState('');
  const [reflectionResponse, setReflectionResponse] = useState('');
  const [reflectionLoading, setReflectionLoading] = useState(false);

  const submitReflection = async () => {
    if (!userProfile || !goal || !dailyPlan || !reflection.trim()) {
      console.warn('Cannot submit reflection — missing data or empty reflection');
      return;
    }

    setReflectionLoading(true);

    try {
      const response = await getReflectionResponse(userProfile, goal, dailyPlan, reflection);
      setReflectionResponse(response);

      const today = new Date().toISOString().split('T')[0];
      await saveDailyReflection(userId, today, {
        reflection: reflection,
        response: response
      });
      console.log('Reflection saved');
    } catch (error) {
      console.error('Error getting reflection response:', error);
      setReflectionResponse('Thank you for sharing your thoughts. Keep up the great work! 💪');
    } finally {
      setReflectionLoading(false);
    }
  };

  const getTasksByType = () => {
    const giaTasks = tasks.filter((task: Task) => task.isGIA);
    const otherTasks = tasks.filter((task: Task) => !task.isGIA && !task.id.includes('quote'));
    const quotes = tasks.filter((task: Task) => task.id.includes('quote'));
    return { giaTasks, otherTasks, quotes };
  };

  const calculateProgress = () => {
    const completedTasks = tasks.filter((task: Task) => task.isCompleted && !task.id.includes('quote'));
    const totalTasks = tasks.filter((task: Task) => !task.id.includes('quote'));
    return totalTasks.length > 0 ? Math.round((completedTasks.length / totalTasks.length) * 100) : 0;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 17) return 'Good Afternoon! ☀️';
    return 'Good Evening! 🌙';
  };

  // Since authentication and loading are handled in App.tsx, we can assume we have valid data

  const { quotes } = getTasksByType();
  const progress = calculateProgress();

  return (
    <div className="h-full p-1" style={{
      background: "linear-gradient(120deg, #d5c5ff 0%, #a7f3d0 50%, #f0f0f0 100%)"
    }}>
      <div className="w-full mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {getGreeting()}
              </h1>
              <p className="text-gray-600 mt-1">
                Working towards: <span className="font-semibold text-purple-600">{goal.title}</span>
              </p>
              <p className="text-sm text-gray-500">
                Identity: {userProfile.identity}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-600">{progress}%</div>
              <div className="text-sm text-gray-500">Today's Progress</div>
              <button
                onClick={() => { void onRefreshPlan(); }}
                disabled={generatingPlan}
                className="mt-2 text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <RefreshIcon size={14} />
                {generatingPlan ? 'Generating...' : 'Refresh Plan'}
              </button>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Motivational Quote */}
        {quotes.length > 0 && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl shadow-lg p-6 border border-purple-200">
            <h2 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
              <SparklesIcon size={20} />
              Today's Inspiration
            </h2>
            <blockquote className="text-purple-700 text-lg font-medium italic">
              "{quotes[0].text}"
            </blockquote>
          </div>
        )}

        {/* Tasks */}
        {generatingPlan ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-pulse">
              <SparklesIcon className="text-purple-600 mx-auto mb-4" size={32} />
              <p className="text-purple-600 font-medium">Generating your personalized daily plan...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          </div>
        ) : (
          <TaskBoard tasks={tasks} onToggleTask={onToggleTask} />
        )}

        {/* Daily Reflection */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ChatIcon className="text-purple-600" />
            💭 Daily Reflection
          </h2>
          <div className="space-y-4">
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How was your day? What did you learn? Any challenges or wins?"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
            <button
              onClick={() => { void submitReflection(); }}
              disabled={!reflection.trim() || reflectionLoading}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {reflectionLoading ? <ButtonLoader /> : 'Get AI Feedback'}
            </button>
            {reflectionResponse && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                <h3 className="font-medium text-purple-800 mb-2">AI Coach Response:</h3>
                <p className="text-purple-700">{reflectionResponse}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
