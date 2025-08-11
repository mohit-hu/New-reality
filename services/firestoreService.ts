import { ref, get, set, update, orderByKey, endAt, limitToLast, query } from "firebase/database";
import { db } from "../firebase";
import { UserProfile, Goal, DailyPlan, DailyReflection } from "../types";

// User Data fetch
export const getUserData = async (userId: string) => {
    const userRef = ref(db, `users/${userId}`); // New syntax: ref(db, path)
    const snapshot = await get(userRef); // Use get() instead of once()
    const data = snapshot.val();
    
    if (data && (data.profile || data.goal)) {
        return {
            profile: data.profile || { context: "Default context", identity: "Default identity" },
            goal: data.goal || { title: "Default goal", tasks: [] }
        };
    }
    
    return {
        profile: { context: "Default context", identity: "Default identity" },
        goal: { title: "Default goal", tasks: [] }
    };
};

// User Data update
export const saveUserData = async (userId: string, profile: UserProfile, goal: Goal) => {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { profile, goal }); // Use update() function
};

// Daily Plan fetch
export const getDailyPlan = async (userId: string, date: string): Promise<DailyPlan | null> => {
    const planRef = ref(db, `users/${userId}/dailyPlans/${date}`);
    const snapshot = await get(planRef);
    console.log('Fetched daily plan:', snapshot.val());
    return snapshot.val();
};

// Daily Plan save
export const saveDailyPlan = async (userId: string, plan: DailyPlan) => {
    const planRef = ref(db, `users/${userId}/dailyPlans/${plan.date}`);
    await set(planRef, plan); // Use set() function
};

// Daily Reflection fetch
export const getDailyReflection = async (userId: string, date: string): Promise<DailyReflection | null> => {
    const reflectionRef = ref(db, `users/${userId}/dailyReflections/${date}`);
    const snapshot = await get(reflectionRef);
    return snapshot.val();
};

// Daily Reflection save
export const saveDailyReflection = async (userId: string, date: string, reflection: DailyReflection) => {
    const reflectionRef = ref(db, `users/${userId}/dailyReflections/${date}`);
    await set(reflectionRef, reflection);
};

// For Gemini Context - Get previous day tasks
export const getPreviousDayTasksString = async (userId: string, today: string): Promise<string> => {
    const plansRef = ref(db, `users/${userId}/dailyPlans`);
    
    // Create query with new syntax
    const plansQuery = query(
        plansRef,
        orderByKey(),
        endAt(today),
        limitToLast(2)
    );
    
    const snapshot = await get(plansQuery);
    const plans = snapshot.val();
    
    if (!plans) return "No previous tasks recorded.";
    
    const planKeys = Object.keys(plans).filter(k => k < today).sort();
    const lastKey = planKeys[planKeys.length - 1];
    const lastPlan = plans[lastKey];
    
    if (lastPlan && lastPlan.tasks && lastPlan.tasks.length > 0) {
        return lastPlan.tasks
            .map((t: any) => `${t.text} (${t.isCompleted ? 'Completed' : 'Not Completed'})`)
            .join('\n');
    }
    
    return "No previous tasks recorded.";
};

// Get previous day reflection
export const getPreviousDayReflectionString = async (userId: string, yesterday: string): Promise<string | undefined> => {
    const reflection = await getDailyReflection(userId, yesterday);
    
    if (reflection) {
        return `User's reflection: "${reflection.reflection}"\nCoach's response: "${reflection.response}"`;
    }
    
    return undefined;
};