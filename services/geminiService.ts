import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile, Goal, Task, GeminiDailyPlanResponse, DailyPlan } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set in .env.local");
}

const ai = new GoogleGenerativeAI(API_KEY);

// Sliding window rate limiting to not exceed API quotas
const MAX_REQUESTS_PER_MINUTE = 15; // As per Gemini API free tier
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const requestTimestamps: number[] = [];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const rateLimitedRequest = async <T>(requestFn: () => Promise<T>): Promise<T> => {
    const now = Date.now();

    // Remove timestamps that are outside the 1-minute window
    while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW) {
        requestTimestamps.shift();
    }

    // If the number of requests in the last minute exceeds the limit, wait.
    if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
        const oldestRequestTime = requestTimestamps[0];
        const timeToWait = (RATE_LIMIT_WINDOW - (now - oldestRequestTime)) + 1000; // Wait until the oldest request expires + 1s buffer

        console.warn(`Rate limit exceeded. Waiting for ${timeToWait / 1000} seconds...`);
        await delay(timeToWait);

        // After waiting, re-run the check
        return rateLimitedRequest(requestFn);
    }

    // Record the timestamp of the new request
    requestTimestamps.push(now);
    return requestFn();
};

// Enhanced retry with exponential backoff and quota handling
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 6000 // Start with 6s as suggested by API
): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await rateLimitedRequest(fn);
        } catch (error: any) {
            lastError = error;
            
            // Check for quota exceeded specifically
            if (error.message?.includes('429') || error.message?.includes('quota')) {
                const isQuotaError = error.message?.includes('RESOURCE_EXHAUSTED') ||
                                   error.message?.includes('quota') ||
                                   error.message?.includes('free_tier_requests');
                
                if (isQuotaError) {
                    // For quota errors, wait longer
                    const quotaDelay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                    console.warn(`🚫 Quota exceeded! Waiting ${quotaDelay/1000}s before retry ${attempt}/${maxRetries}`);
                    
                    if (attempt === maxRetries) {
                        throw new Error('Free tier quota exhausted. Please upgrade to paid tier or wait for quota reset.');
                    }
                    
                    await delay(quotaDelay);
                    continue;
                }
            }
            
            // Other retryable errors
            const isRetryable = error.message?.includes('503') || 
                              error.message?.includes('overloaded') ||
                              error.message?.includes('UNAVAILABLE');
            
            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }
            
            const delayMs = baseDelay * Math.pow(1.5, attempt - 1);
            console.log(`Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms...`);
            await delay(delayMs);
        }
    }
    
    throw lastError;
};

// Enhanced error handling
const handleAPIError = (error: any): string => {
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return '🚫 Free tier quota exceeded! You can only make 15 requests per minute. Please wait or upgrade to paid tier.';
    }
    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        return '⏳ AI service is currently busy. Please try again in a few moments.';
    }
    if (error.message?.includes('API key') || error.message?.includes('401')) {
        return '🔑 Invalid API key. Please check your configuration.';
    }
    return '❌ AI service temporarily unavailable. Please try again later.';
};

// Note: @google/generative-ai doesn't support responseSchema in the same way
// We'll use text-based prompting instead

export const getDailyPlan = async (profile: UserProfile, goal: Goal, previousDayTasks: string, previousDayReflection?: string): Promise<Task[]> => {
    
    if (!goal || !goal.title) {
        throw new Error('Goal is required to generate daily plan');
    }
    
    if (!profile || !profile.identity) {
        throw new Error('User profile with identity is required');
    }

    const systemInstruction = `You are a human-centered AI assistant for self-improvement, acting as a personal coach. Your goal is to help a user build good habits and achieve their goals by providing daily, actionable suggestions.

    Your response MUST be valid JSON with exactly this structure:
    {
        "gia": {
            "task": "string - the most important task for today",
            "reason": "string - why this is the greatest impact activity"
        },
        "otherTasks": [
            {"task": "string - first additional task"},
            {"task": "string - second additional task"}
        ],
        "motivationalQuote": "string - an inspiring quote or message"
    }

    IMPORTANT: Return ONLY the JSON object, no markdown formatting, no explanations, no additional text.

    Guiding Principles:
    1. **Identity-Based Habits:** Tasks should reinforce the user's desired identity.
    2. **Four Laws of Behavior Change:** Make tasks obvious, attractive, easy, and satisfying.
    3. **Prioritization:** Identify a clear "Greatest Impact Activity" (GIA).
    4. **Simplicity:** Tasks should be small, clear actions, not complex projects.
    5. **Context is Key:** Use the user's goal, identity, and context to create personalized plans.`;

    const prompt = `Generate a daily plan for today based on this user profile:

User Profile:
- Goal (New Reality): "${goal.title}"
- Desired Identity: "${profile.identity}"
- Context: "${profile.context || 'Not specified'}"

Previous Day's Plan & Status:
${previousDayTasks || 'No previous tasks recorded.'}
${previousDayReflection ? `\nPrevious Day's Reflection:\n${previousDayReflection}` : ''}

Return ONLY a JSON object with this exact structure:
{
    "gia": {
        "task": "the most important task for today",
        "reason": "why this is the greatest impact activity"
    },
    "otherTasks": [
        {"task": "first supporting task"},
        {"task": "second supporting task"},
        {"task": "third supporting task"},
        {"task": "fourth supporting task"}
    ],
    "motivationalQuote": "an inspiring quote or message"
}

IMPORTANT: Generate exactly 4 supporting tasks in the otherTasks array.`;
    
    try {
        return await retryWithBackoff(async () => {
            console.log('🤖 Generating daily plan with Gemini AI...');
            
            const model = ai.getGenerativeModel({
              model: "gemini-3-flash-preview",
                systemInstruction: systemInstruction,
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;

            if (!response) {
                throw new Error('Empty response from Gemini API');
            }

            let jsonText = (await response.text()).trim();

            // Handle markdown code blocks that some models return
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            let planData: GeminiDailyPlanResponse;

            try {
                planData = JSON.parse(jsonText) as GeminiDailyPlanResponse;
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.error('Raw response:', jsonText);
                throw new Error('Invalid response format from AI');
            }

            console.log('Parsed plan data:', planData);

            const tasks: Task[] = [];

            if (planData.gia?.task) {
                tasks.push({
                    id: `task_${Date.now()}_gia`,
                    text: planData.gia.task,
                    isCompleted: false,
                    isGIA: true,
                });
            }

            if (Array.isArray(planData.otherTasks)) {
                planData.otherTasks.forEach((t, index) => {
                    if (t?.task) {
                        tasks.push({
                            id: `task_${Date.now()}_${index}`,
                            text: t.task,
                            isCompleted: false,
                            isGIA: false,
                        });
                    }
                });
            }

            if (planData.motivationalQuote) {
                tasks.push({
                    id: `task_${Date.now()}_quote`,
                    text: planData.motivationalQuote,
                    isCompleted: false,
                    isGIA: false,
                });
            }

            console.log('Generated tasks:', tasks);

            if (tasks.length === 0) {
                console.error('No tasks generated. Plan data structure:', planData);
                throw new Error('No valid tasks generated');
            }

            console.log('✅ Daily plan generated successfully!');
            return tasks;
        });

    } catch (error) {
        console.error("Error generating content from Gemini API:", error);
        const userFriendlyMessage = handleAPIError(error);
        throw new Error(userFriendlyMessage);
    }
};

export const getReflectionResponse = async (profile: UserProfile, goal: Goal, dailyPlan: DailyPlan, reflectionText: string): Promise<string> => {
    const systemInstruction = `You are a warm, empathetic, and encouraging personal growth coach. Your primary goal is to make the user feel heard and supported.
    
    - Acknowledge their feelings and efforts.
    - Connect their reflection to their main goal or identity.
    - Keep your response positive and forward-looking.
    - Your response MUST be concise, friendly, and conversational (2-4 sentences max). Do not use lists or bullet points.`;

    const completedTasksText = dailyPlan.tasks.filter(t => t.isCompleted).map(t => t.text).join(', ') || 'None';
    const incompleteTasksText = dailyPlan.tasks.filter(t => !t.isCompleted).map(t => t.text).join(', ') || 'None';

    const prompt = `
        Here is the user's context for their daily reflection:
        - Their Ultimate Goal: "${goal.title}"
        - The Identity They Are Building: "${profile.identity}"
        - Tasks they completed today: ${completedTasksText}
        - Tasks they didn't complete today: ${incompleteTasksText}

        The user just shared this reflection about their day:
        "${reflectionText}"

        Based on this, provide a short, supportive, and personalized response.
    `;

    try {
        return await retryWithBackoff(async () => {
            console.log('💭 Getting reflection response from Gemini AI...');
            
            const model = ai.getGenerativeModel({
                model: "gemini-2.0-flash-lite",
                systemInstruction: systemInstruction,
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;

            if (!response) {
                throw new Error('Empty response from Gemini API');
            }

            console.log('✅ Reflection response generated successfully!');
            return (await response.text()).trim();
        });

    } catch (error) {
        console.error("Error generating reflection from Gemini API:", error);
        
        // Enhanced fallback responses for quota issues
        const fallbackResponses = [
            "Thank you for sharing your thoughts! Your commitment to growth is inspiring. Keep pushing forward – every small step counts! 🌟",
            "I appreciate you taking time to reflect. Your self-awareness shows real dedication to your goals. You're doing amazing work! 💪",
            "Your reflection shows genuine progress. Remember, consistency beats perfection every time. Keep up the excellent work! ✨",
            "Thanks for being so thoughtful about your journey. Your dedication to improvement is what will make the difference. Stay strong! 🚀",
            "Your honesty in reflection is powerful. Every day you're becoming more aligned with your goals. That's real progress! 🎯"
        ];
        
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        // Add quota warning if it's a quota error
        if ((error as any)?.message?.includes('quota') || (error as any)?.message?.includes('429')) {
            return `${randomResponse} \n\n⚠️ Note: Free tier quota limit reached. Consider upgrading for unlimited responses.`;
        }
        
        return randomResponse;
    }
};
