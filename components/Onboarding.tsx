import React, { useState } from 'react';
import { UserProfile, Goal } from '../types';

interface OnboardingProps {
    onComplete: (profile: UserProfile, goal: Goal) => Promise<void>;
    loading: boolean;   
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, loading }) => {
    const [profile, setProfile] = useState<UserProfile>({
        identity: '',
        context: ''
    });
    const [goal, setGoal] = useState<Goal>({
        id: '',
        title: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (profile.identity && goal.title) {
            await onComplete(profile, goal);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Setting up your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                        Welcome to LifeGuide AI! 🌟
                    </h1>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What identity do you want to build? *
                            </label>
                            <input
                                type="text"
                                value={profile.identity}
                                onChange={(e) => setProfile(prev => ({ ...prev, identity: e.target.value }))}
                                placeholder="e.g., a healthy person, a successful writer, a disciplined student"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tell us about your current routine/context:
                            </label>
                            <textarea
                                value={profile.context}
                                onChange={(e) => setProfile(prev => ({ ...prev, context: e.target.value }))}
                                placeholder="e.g., I work 9-5, have 2 hours free in evening, currently struggling with consistency..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={4}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What's your main goal (New Reality)? *
                            </label>
                            <input
                                type="text"
                                value={goal.title}
                                onChange={(e) => setGoal(prev => ({ 
                                    ...prev, 
                                    title: e.target.value,
                                    id: `goal_${Date.now()}`
                                }))}
                                placeholder="e.g., Lose 20 pounds and feel energetic, Build a successful side business"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!profile.identity || !goal.title}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Start My Journey 🚀
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
