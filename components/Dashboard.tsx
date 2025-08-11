import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
    getUserData, 
    getDailyPlan as getStoredDailyPlan,
    saveDailyPlan,
    getPreviousDayTasksString,
    getPreviousDayReflectionString 
} from '../services/firestoreService'; 
import { getDailyPlan, getReflectionResponse } from '../services/geminiService';
import { UserProfile, Goal, Task, DailyPlan } from '../types';  
interface DashboardProps {
    
}

const Dashboard: React.FC<DashboardProps> = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [goal, setGoal] = useState<Goal | null>(null);
    const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [reflection, setReflection] = useState<string>('');
    const [reflectionResponse, setReflectionResponse] = useState<string>('');

    // Authentication listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                try {
                    const userData = await getUserData(currentUser.uid);
                    setUserProfile(userData.profile);
                    setGoal(userData.goal);
                    
                    // Load today's plan
                    const today = new Date().toISOString().split('T')[0];
                    const storedPlan = await getStoredDailyPlan(currentUser.uid, today);
                    
                    if (storedPlan) {
                        setDailyPlan(storedPlan);
                        setTasks(storedPlan.tasks);
                    } else {
                        // Generate new plan
                        await generateNewDailyPlan(currentUser.uid, userData.profile, userData.goal);
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const generateNewDailyPlan = async (userId: string, profile: UserProfile, userGoal: Goal) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            const previousDayTasks = await getPreviousDayTasksString(userId, today);
            const previousDayReflection = await getPreviousDayReflectionString(userId, yesterday);
            
            const aiTasks = await getDailyPlan(profile, userGoal, previousDayTasks, previousDayReflection);
            
            const newPlan: DailyPlan = {
                date: today,
                tasks: aiTasks,
                motivationalQuote: aiTasks.find((t: Task) => t.id.includes('quote'))?.text || 'Stay focused on your goals!'
            };
            
            await saveDailyPlan(userId, newPlan);
            setDailyPlan(newPlan);
            setTasks(aiTasks);
        } catch (error) {
            console.error('Error generating daily plan:', error);
        }
    };

    const toggleTaskComplete = async (taskId: string) => {
        if (!user || !dailyPlan) return;

        const updatedTasks = tasks.map((t: Task) => 
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        );

        setTasks(updatedTasks);
        
        // Update in database
        const updatedPlan = { ...dailyPlan, tasks: updatedTasks };
        await saveDailyPlan(user.uid, updatedPlan);
        setDailyPlan(updatedPlan);
    };

    const submitReflection = async () => {
        if (!user || !userProfile || !goal || !dailyPlan || !reflection.trim()) return;

        try {
            const response = await getReflectionResponse(userProfile, goal, dailyPlan, reflection);
            setReflectionResponse(response);
        } catch (error) {
            console.error('Error getting reflection response:', error);
            setReflectionResponse('Thank you for sharing your thoughts. Keep up the great work!');
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading your personalized plan...</p>
                </div>
            </div>
        );
    }

    if (!user || !userProfile || !goal) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to LifeGuide AI</h2>
                    <p className="text-gray-600">Please complete your profile setup first.</p>
                </div>
            </div>
        );
    }

    const { giaTasks, otherTasks, quotes } = getTasksByType();
    const progress = calculateProgress();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Good Morning! 🌅</h1>
                            <p className="text-gray-600 mt-2">
                                Working towards: <span className="font-semibold text-blue-600">{goal.title}</span>
                            </p>
                            <p className="text-gray-500">
                                Identity: <span className="font-medium">{userProfile.identity}</span>
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-600">{progress}%</div>
                            <div className="text-sm text-gray-500">Today's Progress</div>
                        </div>
                    </div>
                </div>

                {/* Motivational Quote */}
                {quotes.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 mb-6 text-white">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-2">Today's Inspiration</h3>
                            <p className="text-xl italic">"{quotes[0].text}"</p>
                        </div>
                    </div>
                )}

                {/* GIA Task */}
                {giaTasks.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            🎯 Greatest Impact Activity (GIA)
                        </h2>
                        <div 
                            key={giaTasks[0].id}
                            className={`p-4 rounded-lg border-2 ${
                                giaTasks[0].isCompleted 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-yellow-50 border-yellow-200'
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    checked={giaTasks[0].isCompleted}
                                    onChange={() => toggleTaskComplete(giaTasks[0].id)}
                                    className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className={`text-lg ${
                                        giaTasks[0].isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
                                    }`}>
                                        {giaTasks[0].text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
{/* Other Tasks */}
{otherTasks.length > 0 && (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            📋 Supporting Tasks
        </h2>
        <div className="space-y-3">
            {/* FIX: गलती वाली लाइन हटाकर ये use करें */}
            {otherTasks.map((task: Task) => (
                <div
                    key={task.id}
                    className={`p-3 rounded-lg border ${
                        task.isCompleted 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => toggleTaskComplete(task.id)}
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <p className={`${
                            task.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'
                        }`}>
                            {task.text}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </div>
)}

                {/* Daily Reflection */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        💭 Daily Reflection
                    </h2>
                    <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="How was your day? What did you learn? Any challenges or wins?"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                    />
                    <button
                        onClick={submitReflection}
                        disabled={!reflection.trim()}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Get AI Feedback
                    </button>
                    
                    {reflectionResponse && (
                        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                            <p className="text-blue-800">{reflectionResponse}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
