import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  getUserData,
  getDailyPlan as getStoredDailyPlan,
  saveDailyPlan,
  getPreviousDayTasksString,
  getPreviousDayReflectionString,
  saveDailyReflection
} from '../services/firestoreService';
import { getDailyPlan, getReflectionResponse } from '../services/geminiService';
import { UserProfile, Goal, Task, DailyPlan } from '../types';
import TaskBoard from './TaskBoard';
import { PageLoader, ButtonLoader } from './LoadingSpinner';
import { SparklesIcon, ChatIcon, RefreshIcon } from './Icons';

interface DashboardProps {}

// Normalize tasks coming from Firestore or AI into Task[]
const normalizeTasks = (input: unknown): Task[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input as Task[];
  if (typeof input === 'object') return Object.values(input as Record<string, Task>);
  return [];
};

const Dashboard: React.FC<DashboardProps> = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]); // Tasks for the current daily plan
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState('');
  const [reflectionResponse, setReflectionResponse] = useState('');
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Authentication listener
  // This useEffect handles initial user authentication and data loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          console.log('Auth: user signed in', currentUser.uid);
          setUser(currentUser);
          await loadUserData(currentUser.uid);
        } else {
          console.log('Auth: no user');
          setUser(null);
          setUserProfile(null);
          setGoal(null);
          setDailyPlan(null);
          setTasks([]);
        }
      } catch (err) {
        console.error('Auth handler error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to load user profile, goal, and today's daily plan
  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for', userId);
      const userData = await getUserData(userId);
      console.log('Loaded userData:', userData);

      if (!userData || !userData.profile || !userData.goal) {
        // User needs to complete onboarding — don't crash, just stop here
        console.warn('No profile/goal found for user, show onboarding or prompt user.');
        return;
      }

      setUserProfile(userData.profile);
      setGoal(userData.goal);

      // Load today's plan
      const today = new Date().toISOString().split('T')[0];
      const storedPlan = await getStoredDailyPlan(userId, today);
      console.log('Stored plan for today:', storedPlan);

      if (storedPlan) {
        setDailyPlan(storedPlan);
        const t = normalizeTasks(storedPlan.tasks as unknown);
        setTasks(t); // Set tasks from stored plan
      } else {
        // Generate new plan
        await generateNewDailyPlan(userId, userData.profile, userData.goal);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };


  const generateNewDailyPlan = async (userId: string, profile: UserProfile, userGoal: Goal) => {
    try {
      console.log('Generating new plan for', userId);
      setGeneratingPlan(true);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      console.log({ today, yesterday });

      const previousDayTasks = await getPreviousDayTasksString(userId, today);
      const previousDayReflection = await getPreviousDayReflectionString(userId, yesterday);
      console.log('Previous day context:', { previousDayTasks, previousDayReflection });

      const aiTasksRaw = await getDailyPlan(profile, userGoal, previousDayTasks, previousDayReflection);
      console.log('AI tasks raw:', aiTasksRaw);

      const aiTasks: Task[] = normalizeTasks(aiTasksRaw);

      const newPlan: DailyPlan = {
        date: today,
        tasks: aiTasks,
        motivationalQuote:
          (aiTasks.find((t: Task) => (t.text || '').toLowerCase().includes('quote'))?.text) ||
          'Stay focused on your goals!'
      };

      await saveDailyPlan(userId, newPlan);
      setDailyPlan(newPlan);
      setTasks(aiTasks);
      console.log('Saved new plan:', newPlan);
    } catch (error) {
      console.error('Error generating daily plan:', error);
      // Set fallback tasks
      const fallbackTasks: Task[] = [
        {
          id: `task_${Date.now()}_1`,
          text: 'Review your goals and priorities',
          isCompleted: false,
          isGIA: true
        },
        {
          id: `task_${Date.now()}_2`,
          text: 'Take 10 minutes for reflection',
          isCompleted: false,
          isGIA: false
        }
      ];
      setTasks(fallbackTasks);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const toggleTaskComplete = async (taskId: string) => {
    if (!user || !dailyPlan) return;

    const prevTasks = tasks;
    const updatedTasks = prevTasks.map((t: Task) =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );

    setTasks(updatedTasks);

    // Update in database
    try {
      const updatedPlan = { ...dailyPlan, tasks: updatedTasks };
      await saveDailyPlan(user.uid, updatedPlan);
      setDailyPlan(updatedPlan);
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert on error
      setTasks(prevTasks);
    }
  };

  const submitReflection = async () => {
    if (!user || !userProfile || !goal || !dailyPlan || !reflection.trim()) {
      console.warn('Cannot submit reflection — missing data or empty reflection');
      return;
    }

    setReflectionLoading(true);

    try {
      const response = await getReflectionResponse(userProfile, goal, dailyPlan, reflection);
      setReflectionResponse(response);

      // Save reflection to database
      const today = new Date().toISOString().split('T')[0];
      await saveDailyReflection(user.uid, today, {
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

  const refreshDailyPlan = async () => {
    if (!user || !userProfile || !goal) return;
    await generateNewDailyPlan(user.uid, userProfile, goal);
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

  // Loading state
  if (loading) {
    return <PageLoader message="Loading your personalized plan..." />;
  }

  // User not authenticated or profile not complete
  if (!user || !userProfile || !goal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4 ml-0">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <SparklesIcon size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to LifeGuide AI
          </h2>
          <p className="text-gray-600 mb-4">
            Please complete your profile setup first to get started with your personalized growth journey.
          </p>
        </div>
      </div>
    );
  }

  const { quotes } = getTasksByType();
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
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
                onClick={() => { void refreshDailyPlan(); }}
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
          <TaskBoard tasks={tasks} onToggleTask={toggleTaskComplete} />
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
