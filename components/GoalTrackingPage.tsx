// src/components/GoalTrackingPage.tsx
'use client'

import  { use, useEffect, useState } from "react";
import { Progress } from "flowbite-react";
import { getDailyPlan } from "../services/firestoreService";
import { Goal, UserProfile, DailyPlan } from "../types";

// Add missing type extensions
declare module "flowbite-react" {
  interface ProgressProps {
    showProgressLabel?: boolean;
    label?: string;
    labelPosition?: "inside" | "outside";
  }
}

interface GoalProgress {
  date: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
}

interface GoalTrackingProps {
  userId: string;
  goal: Goal;
  userProfile: UserProfile;
}

function getLastNDays(days = 30) {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function GoalTrackingPage({ userId, goal, userProfile }: GoalTrackingProps) {
  const [progressData, setProgressData] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalDaysTracked, setTotalDaysTracked] = useState(0);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);

  useEffect(() => {
    async function fetchProgressData() {
      setLoading(true);
      const last30Days = getLastNDays(30);
      const progressArray: GoalProgress[] = [];
      let totalCompleted = 0;
      let totalTasks = 0;
      let daysWithData = 0;

      for (const date of last30Days) {
        try {
          const plan = await getDailyPlan(userId, date);
          
          if (plan?.tasks) {
            const completed = plan.tasks.filter(task => task.isCompleted).length;
            const total = plan.tasks.length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            progressArray.push({
              date,
              completedTasks: completed,
              totalTasks: total,
              completionRate: rate,
            });

            totalCompleted += completed;
            totalTasks += total;
            daysWithData++;
          }
        } catch (error) {
          console.error(`Error fetching data for ${date}:`, error);
        }
      }

      setProgressData(progressArray);
      setTotalDaysTracked(daysWithData);
      setTotalTasksCompleted(totalCompleted);
      setOverallProgress(totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0);
      setLoading(false);
    }

    if (userId) {
      fetchProgressData();
    }
  }, [userId, goal]);

  const recentWeekData = progressData.slice(-7);
  const weeklyAverage = recentWeekData.length > 0 
    ? Math.round(recentWeekData.reduce((sum, day) => sum + day.completionRate, 0) / recentWeekData.length)
    : 0;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading your goal progress...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">🎯 Your Goal Journey</h1>
        <h2 className="text-xl mb-4">{goal.title}</h2>
        <p className="text-blue-100">Identity: {userProfile.identity}</p>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{overallProgress}%</div>
          <div className="text-gray-600">Overall Progress</div>
        </div>
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{totalDaysTracked}</div>
          <div className="text-gray-600">Days Tracked</div>
        </div>
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{totalTasksCompleted}</div>
          <div className="text-gray-600">Tasks Completed</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">🚀 Overall Goal Achievement</h3>
        <Progress 
          progress={overallProgress} 
          size="lg" 
          color="blue"
          label={`${overallProgress}% Complete`}
          labelPosition="outside"
          showProgressLabel
        />
        <div className="mt-2 text-sm text-gray-600">
          Based on {totalDaysTracked} days of task completion data
        </div>
      </div>

      {/* Weekly Average */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Recent Week Average</h3>
        <Progress 
          progress={weeklyAverage} 
          size="md" 
          color={weeklyAverage >= 70 ? "green" : weeklyAverage >= 50 ? "yellow" : "red"}
          label={`${weeklyAverage}% This Week`}
          labelPosition="outside"
          showProgressLabel
        />
      </div>

      {/* Daily Progress History */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">📈 Daily Progress History</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {progressData.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No progress data available. Complete some daily tasks to see your progress!
            </div>
          ) : (
            progressData.slice().reverse().map((day) => (
              <div key={day.date} className="flex items-center justify-between p-3 border rounded">
                <div className="flex flex-col">
                  <div className="font-medium">{day.date}</div>
                  <div className="text-sm text-gray-600">
                    {day.completedTasks}/{day.totalTasks} tasks completed
                  </div>
                </div>
                <div className="w-1/3">
                  <Progress 
                    progress={day.completionRate} 
                    size="sm"
                    color={day.completionRate === 100 ? "green" : day.completionRate >= 70 ? "blue" : day.completionRate >= 40 ? "yellow" : "red"}
                  />
                </div>
                <div className="font-semibold text-right min-w-[60px]">
                  {day.completionRate}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Motivational Section */}
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold mb-2">💪 Keep Going!</h3>
        <p className="mb-4">
          {overallProgress >= 80 ? "Excellent progress! You're almost there!" 
           : overallProgress >= 60 ? "Great work! Keep up the momentum!" 
           : overallProgress >= 40 ? "Good start! Stay consistent for better results!"
           : "Every journey begins with a single step. You've got this!"}
        </p>
        <div className="text-sm opacity-90">
          "Progress, not perfection" - {userProfile.identity}
        </div>
      </div>
    </div>
  );
}