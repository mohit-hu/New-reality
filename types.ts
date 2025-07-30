
export interface UserProfile {
  identity: string; // e.g., "a writer", "a healthy person"
  context: string; // "My daily routine involves..."
}

export interface Goal {
  id: string;
  title: string; // The "New Reality"
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  isGIA: boolean; // Greatest Impact Activity
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  motivationalQuote: string;
}

export interface GeminiDailyPlanResponse {
    gia: {
        task: string;
        reason: string;
    };
    otherTasks: {
        task: string;
    }[];
    motivationalQuote: string;
}

export interface DailyReflection {
  reflection: string;
  response: string;
}
