import { AppSidebar } from "./components/AppSidebar";
import AITrainerPage from "./components/AITrainerPage";


import GoalTrackingPage from "./components/GoalTrackingPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TaskListPage from "./components/TaskBoard"; 
import { TaskHistory } from "./components/TaskHistory";
import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { 
    getUserData, 
    saveUserData,
    getDailyPlan as getStoredDailyPlan,
    saveDailyPlan,
    getPreviousDayTasksString,
    getPreviousDayReflectionString 
} from './services/firestoreService';
import { getDailyPlan } from './services/geminiService';
import { UserProfile, Goal, Task, DailyPlan } from './types';

// Import your components (create these if they don't exist)
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Onboarding from './components/Onboarding';

interface AppState {
    user: User | null;
    userProfile: UserProfile | null;
    goal: Goal | null;
    dailyPlan: DailyPlan | null;
    tasks: Task[];
    loading: boolean;
    showOnboarding: boolean;
    error: string | null;
}

const App: React.FC = () => {
    const [state, setState] = useState<AppState>({
        user: null,
        userProfile: null,
        goal: null,
        dailyPlan: null,
        tasks: [],
        loading: true,
        showOnboarding: false,
        error: null
    });
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Authentication listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setState(prev => ({ ...prev, user: currentUser }));
                await loadUserData(currentUser.uid);
            } else {
                // Auto sign in anonymously if no user
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error('Error signing in anonymously:', error);
                    setState(prev => ({ 
                        ...prev, 
                        error: 'Failed to authenticate. Please refresh the page.',
                        loading: false 
                    }));
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const loadUserData = async (userId: string) => {
        try {
            const userData = await getUserData(userId);
            
            // Check if user has completed onboarding
            if (!userData.profile?.identity || !userData.goal?.title) {
                setState(prev => ({ 
                    ...prev, 
                    showOnboarding: true, 
                    loading: false 
                }));
                return;
            }

            setState(prev => ({
                ...prev,
                userProfile: userData.profile,
                goal: userData.goal,
                showOnboarding: false
            }));

            // Load or generate today's daily plan
            await loadDailyPlan(userId, userData.profile, userData.goal);

        } catch (error) {
            console.error('Error loading user data:', error);
            setState(prev => ({ 
                ...prev, 
                error: 'Failed to load user data. Please try again.',
                loading: false 
            }));
        }
    };

    const loadDailyPlan = async (userId: string, profile: UserProfile, goal: Goal) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const storedPlan = await getStoredDailyPlan(userId, today);
            
            if (storedPlan) {
                setState(prev => ({
                    ...prev,
                    dailyPlan: storedPlan,
                    tasks: storedPlan.tasks,
                    loading: false
                }));
            } else {
                // Generate new daily plan
                await generateNewDailyPlan(userId, profile, goal);
            }
        } catch (error) {
            console.error('Error loading daily plan:', error);
            setState(prev => ({ 
                ...prev, 
                error: 'Failed to load daily plan. Please try again.',
                loading: false 
            }));
        }
    };

    const generateNewDailyPlan = async (userId: string, profile: UserProfile, goal: Goal) => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            const previousDayTasks = await getPreviousDayTasksString(userId, today);
            const previousDayReflection = await getPreviousDayReflectionString(userId, yesterday);
            
            const aiTasks = await getDailyPlan(profile, goal, previousDayTasks, previousDayReflection);
            
            const newPlan: DailyPlan = {
                date: today,
                tasks: aiTasks,
                motivationalQuote: aiTasks.find((t: Task) => t.id.includes('quote'))?.text || 'Stay focused on your goals! 🌟'
            };
            
            await saveDailyPlan(userId, newPlan);
            
            setState(prev => ({
                ...prev,
                dailyPlan: newPlan,
                tasks: aiTasks,
                loading: false
            }));
        } catch (error) {
            console.error('Error generating daily plan:', error);
            setState(prev => ({ 
                ...prev, 
                error: 'Failed to generate daily plan. Please check your API key and try again.',
                loading: false 
            }));
        }
    };

    const handleOnboardingComplete = async (profile: UserProfile, goal: Goal) => {
        if (!state.user) return;
        
        try {
            setState(prev => ({ ...prev, loading: true }));
            
            // Save user data
            await saveUserData(state.user.uid, profile, goal);
            
            setState(prev => ({
                ...prev,
                userProfile: profile,
                goal: goal,
                showOnboarding: false
            }));

            // Generate first daily plan
            await generateNewDailyPlan(state.user.uid, profile, goal);
            
        } catch (error) {
            console.error('Error completing onboarding:', error);
            setState(prev => ({ 
                ...prev, 
                error: 'Failed to save your information. Please try again.',
                loading: false 
            }));
        }
    };

    const refreshDailyPlan = async () => {
        if (!state.user || !state.userProfile || !state.goal) return;
        await generateNewDailyPlan(state.user.uid, state.userProfile, state.goal);
    };

    const handleToggleSidebar = () => {
        setSidebarCollapsed(prev => !prev);
    };

    const clearError = () => {
        setState(prev => ({ ...prev, error: null }));
    };

    // Loading state
    if (state.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading your personalized experience...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (state.error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{state.error}</p>
                    <button
                        onClick={clearError}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // No user (should not happen due to auto sign-in)
    if (!state.user) {
        return <Login />;
    }

    // Show onboarding if user hasn't completed setup
    if (state.showOnboarding || !state.userProfile || !state.goal) {
        return (
            <Onboarding
                onComplete={handleOnboardingComplete}
                loading={state.loading}
            />
        );
    }

    // Main app - Dashboard


return (
  <BrowserRouter>
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Sidebar fixed */}
      <div className="fixed top-0 left-0 h-screen z-20">
        <AppSidebar
          userId={state.user.uid}
          userName={state.userProfile.identity}
          // userAvatar={state.userProfile.avatarUrl} // You can pass an avatar URL here if available
          collapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Main content area (margin-left = sidebar width) */}
      <main className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                userProfile={state.userProfile}
                goal={state.goal}
                dailyPlan={state.dailyPlan}
                tasks={state.tasks}
                onRefreshPlan={refreshDailyPlan}
              />
            }
          />
          <Route
            path="/history"
            element={<TaskHistory userId={state.user.uid} days={5} />}
          />
          <Route path="/tasks" element={<TaskListPage userId={state.user.uid} />} />
<Route
          path="/GoalTrackingPage"
          element={
            <GoalTrackingPage 
              userId={state.user.uid}
              goal={state.goal}
              userProfile={state.userProfile}
            />
          } 
        />
     <Route 
    path="/AITrainerPage"
    element={
      <AITrainerPage 
        goal={state.goal} 
        userProfile={state.userProfile}
      />
    } 
  />

        </Routes>
      </main>
    </div>
  </BrowserRouter>
);

};

export default App;
