import React, { useState, useEffect } from 'react';
import { UserProfile, Goal } from '../types';
import { getDailyPlan, getUserData } from '../services/firestoreService';
import { PageLoader } from './LoadingSpinner';
import { GoalIcon, TrendingUpIcon } from './Icons';
import TaskHistory from './TaskHistory';

interface GoalTrackingPageProps {
  userId: string;
}

interface ProgressData {
  date: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
}

const GoalTrackingPage: React.FC<GoalTrackingPageProps> = ({ userId }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // Get user data
        const userData = await getUserData(userId);
        setUserProfile(userData?.profile || null);
        setGoal(userData?.goal || null);

        // Get last 30 days progress
        const progressPromises = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          return getDailyPlan(userId, dateStr);
        });

        const plans = await Promise.all(progressPromises);
        const validPlans = plans
          .map((plan, index) => {
            if (!plan) return null;
            
            const date = new Date();
            date.setDate(date.getDate() - index);
            
            const totalTasks = plan.tasks.filter(t => !t.id.includes('quote')).length;
            const completedTasks = plan.tasks.filter(t => t.isCompleted && !t.id.includes('quote')).length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return {
              date: date.toISOString().split('T')[0],
              completionRate,
              totalTasks,
              completedTasks
            };
          })
          .filter(Boolean) as ProgressData[];

        setProgressData(validPlans.reverse());

        // Calculate overall progress (last 7 days average)
        const recentProgress = validPlans.slice(-7);
        const avgProgress = recentProgress.length > 0 
          ? Math.round(recentProgress.reduce((sum, p) => sum + p.completionRate, 0) / recentProgress.length)
          : 0;
        setOverallProgress(avgProgress);

        // Calculate streak (consecutive days with >80% completion)
        let currentStreak = 0;
        for (let i = validPlans.length - 1; i >= 0; i--) {
          if (validPlans[i].completionRate >= 80) {
            currentStreak++;
          } else {
            break;
          }
        }
        setStreak(currentStreak);

      } catch (error) {
        console.error('Error fetching goal tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const getMotivationalMessage = (progress: number): string => {
    if (progress >= 80) return "Excellent progress! You're almost there! 🎯";
    if (progress >= 60) return "Great work! Keep up the momentum! 💪";
    if (progress >= 40) return "Good start! Stay consistent for better results! 📈";
    return "Every journey begins with a single step. You've got this! 🚀";
  };

  const getProgressColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-blue-600 bg-blue-100';
    if (rate >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getProgressBarColor = (rate: number): string => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-blue-500';
    if (rate >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return <PageLoader message="Loading your progress..." />;
  }

  if (!userProfile || !goal) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <GoalIcon className="text-gray-400 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No Goal Set
          </h2>
          <p className="text-gray-500">
            Please set up your profile and goal first to track your progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className=" p-6 space-y-6" style={{
      background: "linear-gradient(120deg, #d5c5ff 0%, #a7f3d0 50%, #f0f0f0 100%)"
    }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl shadow-2xl p-6 border border-purple-500/30">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <GoalIcon className="text-purple-400" size={32} />
              Goal Tracking
            </h1>
            <p className="text-slate-300 mb-4">Monitor your progress towards your new reality</p>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-400">Your Goal:</span>
                <p className="text-lg font-semibold text-white">{goal.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-400">Identity:</span>
                <p className="text-base text-slate-200">{userProfile.identity}</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-purple-400">{overallProgress}%</div>
            <div className="text-sm text-slate-400">7-day Average</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-300">Overall Progress</span>
            <span className="text-sm text-slate-400">{overallProgress}/100%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(overallProgress)}`}
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl">
          <p className="text-center text-purple-300 font-medium">
            {getMotivationalMessage(overallProgress)}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Current Streak */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{streak}</div>
          <div className="text-sm text-gray-600 mt-1">Day Streak</div>
          <div className="text-xs text-gray-500 mt-1">80%+ completion</div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {progressData.slice(-7).reduce((sum, p) => sum + p.completedTasks, 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Tasks Completed</div>
          <div className="text-xs text-gray-500 mt-1">This week</div>
        </div>

        {/* Best Day */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            {Math.max(...progressData.map(p => p.completionRate), 0)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">Best Day</div>
          <div className="text-xs text-gray-500 mt-1">Completion rate</div>
        </div>

        {/* Total Days */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {progressData.length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Active Days</div>
          <div className="text-xs text-gray-500 mt-1">Total tracked</div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl shadow-2xl p-6 border border-purple-500/30">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUpIcon className="text-purple-400" />
          Progress Trend (Last 30 Days)
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {progressData.slice(-21).map((data, _index) => (
            <div key={data.date} className="text-center">
              <div
                className={`w-full h-16 rounded-xl flex items-end justify-center text-xs font-medium bg-slate-700/50 border border-slate-600/50 relative`}
                title={`${data.date}: ${data.completionRate}% (${data.completedTasks}/${data.totalTasks})`}
              >
                <div
                  className={`w-full rounded-xl ${getProgressBarColor(data.completionRate)} opacity-60`}
                  style={{ height: `${Math.max(data.completionRate, 10)}%` }}
                ></div>
                <span className="text-white text-xs font-bold absolute">
                  {data.completionRate}%
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {new Date(data.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default GoalTrackingPage;
