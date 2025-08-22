// components/Profile.tsx
import React, { useState, useEffect } from 'react';
import { UserProfile, Goal } from '../types';
import { getUserData, saveUserData } from '../services/firestoreService';

interface ProfileProps {
  userId: string;
  onProfileUpdate?: (profile: UserProfile, goal: Goal) => void;
}

export const Profile: React.FC<ProfileProps> = ({ userId, onProfileUpdate }) => {
  const [profile, setProfile] = useState<UserProfile>({
    identity: '',
    context: ''
  });
  
  const [goal, setGoal] = useState<Goal>({
    id: '',
    title: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await getUserData(userId);
        if (userData.profile) {
          setProfile(userData.profile);
        }
        if (userData.goal) {
          setGoal(userData.goal);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setMessage('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile.identity.trim() || !goal.title.trim()) {
      setMessage('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      
      const updatedGoal = {
        ...goal,
        id: goal.id || `goal_${Date.now()}`
      };
      
      await saveUserData(userId, profile, updatedGoal);
      setGoal(updatedGoal);
      setMessage('Profile saved successfully! ✅');
      
      // Notify parent component if callback provided
      if (onProfileUpdate) {
        onProfileUpdate(profile, updatedGoal);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Profile</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity Section */}
        <div>
          <label htmlFor="identity" className="block text-sm font-medium text-gray-700 mb-2">
            Who are you becoming? *
          </label>
          <input
            id="identity"
            type="text"
            value={profile.identity}
            onChange={(e) => handleInputChange('identity', e.target.value)}
            placeholder="e.g., a writer, a healthy person, an entrepreneur"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            This helps shape your daily tasks and habits
          </p>
        </div>

        {/* Context Section */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
            Tell us about your daily routine and lifestyle
          </label>
          <textarea
            id="context"
            value={profile.context}
            onChange={(e) => handleInputChange('context', e.target.value)}
            placeholder="e.g., I work from home, exercise in the morning, have 2 hours free in the evening..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            This helps us create personalized daily plans
          </p>
        </div>

        {/* Goal Section */}
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
            What's your main goal? *
          </label>
          <input
            id="goal"
            type="text"
            value={goal.title}
            onChange={(e) => setGoal(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Write a book, Get fit and healthy, Build a successful business"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Your "New Reality" - what you're working towards
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-md ${
            message.includes('successfully') || message.includes('✅') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving || !profile.identity.trim() || !goal.title.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </button>
      </form>
    </div>
  );
};

export default Profile;
