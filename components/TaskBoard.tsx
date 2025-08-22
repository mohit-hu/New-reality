import React, { useEffect, useState } from "react";
import { getDailyPlan } from "../services/firestoreService";

function getRecentDates(days = 7) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10)); // 'YYYY-MM-DD'
  }
  return dates;
}

export default function TaskListPage({ userId }: { userId: string }) {
  const [plans, setPlans] = useState<{ date: string; tasks: any[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const result: { date: string; tasks: any[] }[] = [];
      for (const date of getRecentDates(7)) {
        const plan = await getDailyPlan(userId, date);
        if (plan && plan.tasks && plan.tasks.length > 0) {
          result.push({ date, tasks: plan.tasks });
        }
      }
      setPlans(result);
      setLoading(false);
    }
    if (userId) fetch();
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Previous 7 Days: Your Tasks</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {plans.length === 0 && (
            <div className="text-gray-500">No tasks found for recent days.</div>
          )}
          {plans.map(({ date, tasks }) => (
            <div key={date} className="mb-6">
              <div className="font-semibold text-blue-600">{date}</div>
              <ul className="list-disc list-inside pl-2 mt-1">
                {tasks.map((task, idx) => (
                  <li key={idx}>
                    {task.text}
                    {task.isCompleted ? (
                      <span className="ml-2 text-green-600">(Completed)</span>
                    ) : (
                      <span className="ml-2 text-red-600">(Not Completed)</span>
                    )}
                    {task.isGIA && (
                      <span className="ml-2 text-yellow-500 font-bold">
                        [GIA]
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

