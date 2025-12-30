import { AppSidebar } from "./components/AppSidebar";
import AITrainerPage from "./components/AITrainerPage";
import TaskBoard from "./components/TaskBoard";
import GoalTrackingPage from "./components/GoalTrackingPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskHistory } from "./components/TaskHistory";
import React, { useEffect, useState, useReducer } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
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

// Import your components
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';

interface AppState {
    user: User | null;
    userProfile: UserProfile | null;
    goal: Goal | null;
    loading: boolean;
    showOnboarding: boolean;
    error: string | null;
}

type AppAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_NO_USER' }
  | { type: 'AUTH_EXISTING_USER'; payload: { user: User; profile: UserProfile; goal: Goal } }
  | { type: 'AUTH_NEW_USER'; payload: { user: User } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'ONBOARDING_START' }
  | { type: 'ONBOARDING_SUCCESS'; payload: { profile: UserProfile; goal: Goal } }
  | { type: 'ONBOARDING_ERROR'; payload: string };

const initialState: AppState = {
    user: null,
    userProfile: null,
    goal: null,
    loading: true,
    showOnboarding: false,
    error: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'AUTH_START':
            return { ...state, loading: true, error: null };
        case 'AUTH_NO_USER':
            return { ...initialState, loading: false };
        case 'AUTH_EXISTING_USER':
            return {
                ...state,
                loading: false,
                user: action.payload.user,
                userProfile: action.payload.profile,
                goal: action.payload.goal,
                showOnboarding: false,
                error: null,
            };
        case 'AUTH_NEW_USER':
            return {
                ...state,
                loading: false,
                user: action.payload.user,
                userProfile: null,
                goal: null,
                showOnboarding: true,
                error: null,
            };
        case 'AUTH_ERROR':
            return { ...state, loading: false, error: action.payload };
        case 'ONBOARDING_START':
            return { ...state, loading: true, error: null };
        case 'ONBOARDING_SUCCESS':
            return {
                ...state,
                loading: false,
                userProfile: action.payload.profile,
                goal: action.payload.goal,
                showOnboarding: false,
            };
        case 'ONBOARDING_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

// Helper to normalize tasks from Firestore or AI into a consistent Task[]
const normalizeTasks = (input: unknown): Task[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input as Task[];
  if (typeof input === 'object') return Object.values(input as Record<string, Task>);
  return [];
};



const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  // State lifted from Dashboard
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch({ type: 'AUTH_START' });
      
      if (!firebaseUser) {
        dispatch({ type: 'AUTH_NO_USER' });
        return;
      }

      try {
        const userData = await getUserData(firebaseUser.uid);
        if (userData) {
          dispatch({ 
            type: 'AUTH_EXISTING_USER', 
            payload: { 
              user: firebaseUser, 
              profile: userData.profile, 
              goal: userData.goal 
            } 
          });
        } else {
          dispatch({ 
            type: 'AUTH_NEW_USER', 
            payload: { user: firebaseUser } 
          });
        }
      } catch (err: any) {
        console.error(err);
        dispatch({ 
          type: 'AUTH_ERROR', 
          payload: err?.message || 'Failed to load user data' 
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Effect to load daily plan when user data is available
  useEffect(() => {
    if (state.user && state.userProfile && state.goal) {
      loadDailyPlan(state.user.uid, state.userProfile, state.goal);
    } else {
      // Clear plan if user logs out or data is incomplete
      setDailyPlan(null);
      setTasks([]);
    }
  }, [state.user, state.userProfile, state.goal]);

  const loadDailyPlan = async (userId: string, profile: UserProfile, goal: Goal) => {
    const today = new Date().toISOString().split('T')[0];
    const storedPlan = await getStoredDailyPlan(userId, today);

    if (storedPlan) {
      setDailyPlan(storedPlan);
      setTasks(normalizeTasks(storedPlan.tasks));
    } else {
      // Only generate new plan if user explicitly requests it to avoid quota waste
      console.log('No daily plan found for today. User can generate one manually from Dashboard.');
      setDailyPlan(null);
      setTasks([]);
    }
  };

  const generateNewDailyPlan = async (userId: string, profile: UserProfile, userGoal: Goal) => {
    setGeneratingPlan(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Fetch context data in parallel for better performance
      const [previousDayTasks, previousDayReflection] = await Promise.all([
        getPreviousDayTasksString(userId, today),
        getPreviousDayReflectionString(userId, yesterday)
      ]);

      const aiTasksRaw = await getDailyPlan(profile, userGoal, previousDayTasks, previousDayReflection);
      const aiTasks: Task[] = normalizeTasks(aiTasksRaw);

      const newPlan: DailyPlan = {
        date: today,
        tasks: aiTasks,
        motivationalQuote:
          aiTasks.find((t: Task) => t.id?.includes('quote'))?.text ||
          'Stay focused on your goals!'
      };

      await saveDailyPlan(userId, newPlan);
      setDailyPlan(newPlan);
      setTasks(aiTasks);
    } catch (error) {
      console.error('Error generating daily plan:', error);
      // You could set an error state here to show in the UI
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!state.user || !dailyPlan) return;

    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
    setTasks(updatedTasks); // Optimistic update

    const updatedPlan = { ...dailyPlan, tasks: updatedTasks };
    await saveDailyPlan(state.user.uid, updatedPlan).catch(() => setTasks(tasks)); // Revert on error
  };

  const handleOnboardingComplete = async (profile: UserProfile, goal: Goal) => {
    if (!state.user) return;
    
    dispatch({ type: 'ONBOARDING_START' });
    try {
      await saveUserData(state.user.uid, profile, goal);
      dispatch({ 
        type: 'ONBOARDING_SUCCESS', 
        payload: { profile, goal } 
      });
    } catch (err: any) {
      console.error(err);
      dispatch({ 
        type: 'ONBOARDING_ERROR', 
        payload: err?.message || 'Failed to save profile' 
      });
    }
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (state.user && state.showOnboarding) {
    return (
      <Onboarding 
        userId={state.user.uid}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen " >
        {/* Sidebar shown when user logged in */}
        {state.user && (
          <AppSidebar
            userId={state.user.uid}
            userName={state.user.displayName || 'User'}
            collapsed={isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-auto ${
          state.user ? (isSidebarCollapsed ? 'ml mr hfull'  : 'ml mr h-full') : ''
        }`}>
          <Routes>
            <Route
              path="/"
              element={
                state.user && state.userProfile && state.goal ? (
                  <Dashboard
                    userId={state.user.uid}
                    goal={state.goal}
                    userProfile={state.userProfile}
                    dailyPlan={dailyPlan}
                    tasks={tasks}
                    generatingPlan={generatingPlan}
                    onToggleTask={handleToggleTask}
                    onRefreshPlan={() =>
                      generateNewDailyPlan(state.user.uid, state.userProfile!, state.goal!)
                    }
                  />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/TaskBoard"
               element={
                state.user ? (
                  <TaskHistory userId={state.user.uid} />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/GoalTrackingPage"
              element={
                state.user ? (
                  <GoalTrackingPage userId={state.user.uid} />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/AITrainerPage"
              element={
                state.user && state.goal && state.userProfile ? (
                  <AITrainerPage 
                    goal={state.goal} 
                    userProfile={state.userProfile} 
                  />
                ) : (
                  <Login />
                )
              }
            />
            <Route 
              path="/onboarding" 
              element={
                state.user ? (
                  <Onboarding 
                    userId={state.user.uid} 
                    onComplete={handleOnboardingComplete} 
                  />
                ) : (
                  <Login />
                )
              } 
            />
            <Route
              path="/login"
              element={<Login />}
            />
            <Route
              path="/Profile"
              element={
                state.user && state.userProfile && state.goal ? (
                  <Profile userProfile={state.userProfile} goal={state.goal} />
                ) : (
                  <Login />
                )
              }
            />

          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
