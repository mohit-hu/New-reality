import React, { useState } from 'react';
import { UserProfile, Goal } from '../types';
import { saveUserData } from '../services/firestoreService';
import { FiUser, FiTarget, FiArrowRight } from 'react-icons/fi';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [profile, setProfile] = useState<UserProfile>({
    identity: '',
    context: ''
  });
  
  const [goal, setGoal] = useState<Goal>({
    id: `goal_${Date.now()}`,
    title: ''
  });

  const handleNext = () => {
    if (step === 1 && !profile.identity.trim()) {
      setError('Please enter your desired identity');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile.identity.trim()) {
      setError('Identity is required');
      return;
    }
    
    if (!goal.title.trim()) {
      setError('Goal is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await saveUserData(userId, profile, goal);
      onComplete();
    } catch (err: any) {
      console.error('Error saving user data:', err);
      setError(err.message || 'Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 animate-pulse">
            ✨
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Setting up your profile...
          </h2>
          <p className="text-gray-600 mb-4">
            Creating your personalized growth journey
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            {step === 1 ? <FiUser size={24} /> : <FiTarget size={24} />}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to Your Growth Journey! 🌟
          </h1>
          <p className="text-gray-600">
            Step {step} of 2: Let's personalize your experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm text-gray-600">{step}/2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What identity do you want to build? *
                </label>
                <input
                  type="text"
                  value={profile.identity}
                  onChange={(e) => setProfile(prev => ({ ...prev, identity: e.target.value }))}
                  placeholder="e.g., a healthy person, a successful writer, a disciplined student"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  This shapes how we'll design your daily habits and tasks
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about your current routine/context:
                </label>
                <textarea
                  value={profile.context}
                  onChange={(e) => setProfile(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="e.g., I work 9-5, have 2 hours free in evening, currently struggling with consistency..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: This helps us create more relevant suggestions
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Next Step <FiArrowRight />
              </button>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your main goal (New Reality)? *
                </label>
                <input
                  type="text"
                  value={goal.title}
                  onChange={(e) => setGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Lose 20 pounds and feel energetic, Build a successful side business"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific about what success looks like for you
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Summary:</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Identity:</strong> {profile.identity || 'Not specified'}
                </p>
                {profile.context && (
                  <p className="text-sm text-gray-600">
                    <strong>Context:</strong> {profile.context}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Start My Journey 🚀
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your data is securely stored and used only to personalize your experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
