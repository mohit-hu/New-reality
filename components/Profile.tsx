import React, { useState, useEffect } from 'react';
import { UserProfile, Goal } from '../types';

interface ProfileProps {
  userProfile: UserProfile;
  goal: Goal;
}

const Profile: React.FC<ProfileProps> = ({ userProfile, goal }) => {
  const [jobSharingText, setJobSharingText] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleShareJob = () => {
    // Placeholder for job sharing functionality
    alert(`Sharing job details: ${jobSharingText}`);
    // Here you could integrate with a service to share the job details
  };

  return (
    <div className="min-h-screen " style={{
     background: "white",
     backgroundImage: `
       linear-gradient(to right, rgba(71,85,105,0.3) 1px, transparent 1px),
       linear-gradient(to bottom, rgba(71,85,105,0.3) 1px, transparent 1px),
       radial-gradient(circle at 50% 50%, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.1) 40%, transparent 80%)
     `,
     backgroundSize: "32px 32px, 32px 32px, 100% 100%",
   }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">Profile</h1>

        {/* User Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">User Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Identity</label>
              <p className="mt-1 text-lg text-gray-800 dark:text-gray-200">{userProfile.identity}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Context</label>
              <p className="mt-1 text-lg text-gray-800 dark:text-gray-200">{userProfile.context}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Goal</label>
              <p className="mt-1 text-lg text-gray-800 dark:text-gray-200">{goal.title}</p>
            </div>
          </div>
        </div>

        {/* Job Sharing Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Job Sharing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Share Job Details or Opportunities
              </label>
              <textarea
                value={jobSharingText}
                onChange={(e) => setJobSharingText(e.target.value)}
                placeholder="Enter job details, opportunities, or any sharing information here..."
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <button
              onClick={handleShareJob}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Share Job Details
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;
