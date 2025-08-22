import { useEffect, useState } from "react";

// Api function: fetch tasks by date
import { getPreviousDayTasksString } from "services/firestoreService";

interface TaskHistoryProps {
  userId: string;
  days?: number; // Kitne previous din dikhaane hain, default 2
}

export function TaskHistory({ userId, days = 2 }: TaskHistoryProps) {
  const [taskData, setTaskData] = useState<{ date: string; tasks: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const all: { date: string; tasks: string[] }[] = [];
      for (let i = 1; i <= days; i++) {
        const day = new Date(Date.now() - i * 86400000);
        const dateStr = day.toISOString().split("T")[0];
        const tasksStr = await getPreviousDayTasksString(userId, dateStr);
        if (tasksStr) all.push({ date: dateStr, tasks: tasksStr.split("\n").filter(Boolean) });
      }
      setTaskData(all);
      setLoading(false);
    }
    fetchTasks();
  }, [userId, days]);

  if (loading) return <div className="p-4 text-gray-500">Loading previous tasks...</div>;

  if (taskData.length === 0) {
    return <div className="p-4 text-gray-500">No previous day tasks found.</div>;
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-3">Previous Day Tasks</h3>
      {taskData.map(({ date, tasks }) => (
        <div key={date} className="mb-4">
          <div className="font-bold text-blue-600 mb-1">{date}</div>
          <ul className="list-disc list-inside text-sm space-y-1 pl-2">
            {tasks.map((task, idx) => (
              <li key={idx}>{task}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
