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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setState(s => ({ ...s, loading: true }));
      if (!firebaseUser) {
        setState({
          user: null,
          userProfile: null,
          goal: null,
          dailyPlan: null,
          tasks: [],
          loading: false,
          showOnboarding: false,
          error: null
        });
        return;
      }

      try {
        const userData = await getUserData(firebaseUser.uid);
        console.log('userData from DB:', userData);
        if (userData) {
          setState(s => ({
            ...s,
            user: firebaseUser,
            userProfile: userData.profile,
            goal: userData.goal,
            loading: false,
            showOnboarding: false
          }));
        } else {
          setState(s => ({
            ...s,
            user: firebaseUser,
            userProfile: null,
            goal: null,
            loading: false,
            showOnboarding: true
          }));
        }
      } catch (err: any) {
        console.error(err);
        setState(s => ({ ...s, loading: false, error: err?.message || 'Failed to load user data' }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async (profile: UserProfile, goal: Goal) => {
    if (!state.user) return;
    setState(s => ({ ...s, loading: true }));
    try {
      await saveUserData(state.user.uid, profile, goal);
      setState(s => ({
        ...s,
        userProfile: profile,
        goal: goal,
        loading: false,
        showOnboarding: false
      }));
    } catch (err: any) {
      console.error(err);
      setState(s => ({ ...s, loading: false, error: err?.message || 'Failed to save profile' }));
    }
  };

  if (state.loading) return <div>Loading...</div>;

  if (state.user && state.showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} loading={state.loading} />;
  }

  return state.user ? (
    <Dashboard
      user={state.user}
      userProfile={state.userProfile}
      goal={state.goal}
      dailyPlan={state.dailyPlan}
      tasks={state.tasks}
      // ...other props...
    />
  ) : (
    <Login />
  );
};


export default App;
