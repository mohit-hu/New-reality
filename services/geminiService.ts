import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Goal, Task, GeminiDailyPlanResponse, DailyPlan } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set in .env.local");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Enhanced rate limiting for free tier
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests (12 per minute max)
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 12; // Conservative limit for free tier
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Request queue for managing API calls
const requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;

// Enhanced delay utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiting function
const rateLimitedRequest = async <T>(requestFn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        requestQueue.push(async () => {
            try {
                // Check if we need to wait between requests
                const now = Date.now();
                const timeSinceLastRequest = now - lastRequestTime;
                
                if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
                    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
                    console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
                    await delay(waitTime);
                }
                
                // Update request tracking
                lastRequestTime = Date.now();
                requestCount++;
                
                // Reset counter every minute
                setTimeout(() => requestCount--, RATE_LIMIT_WINDOW);
                
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
        
        processQueue();
    });
};

// Queue processor
const processQueue = async () => {
    if (isProcessingQueue || requestQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (requestQueue.length > 0) {
        const requestFn = requestQueue.shift();
        if (requestFn) {
            try {
                await requestFn();
            } catch (error) {
                console.error('Queue processing error:', error);
            }
        }
    }
    
    isProcessingQueue = false;
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

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        gia: {
            type: Type.OBJECT,
            description: "The single Most Important Task (Greatest Impact Activity) for the day.",
            properties: {
                task: { type: Type.STRING, description: "The GIA task description. Must be actionable." },
                reason: { type: Type.STRING, description: "A brief, encouraging reason why this task is the GIA." },
            },
            required: ['task', 'reason'],
        },
        otherTasks: {
            type: Type.ARRAY,
            description: "A list of 2 to 4 other small, supporting tasks for the day.",
            items: {
                type: Type.OBJECT,
                properties: {
                    task: { type: Type.STRING, description: "The supporting task description. Must be a small, actionable step." },
                },
                required: ['task'],
            },
        },
        motivationalQuote: {
            type: Type.STRING,
            description: "A short, powerful motivational quote relevant to the user's goal or identity.",
        },
    },
    required: ['gia', 'otherTasks', 'motivationalQuote'],
};

export const getDailyPlan = async (profile: UserProfile, goal: Goal, previousDayTasks: string, previousDayReflection?: string): Promise<Task[]> => {
    
    if (!goal || !goal.title) {
        throw new Error('Goal is required to generate daily plan');
    }
    
    if (!profile || !profile.identity) {
        throw new Error('User profile with identity is required');
    }

    const systemInstruction = `You are a human-centered AI assistant for self-improvement, acting as a personal coach. Your goal is to help a user build good habits and achieve their goals by providing daily, actionable suggestions.
    
    Your response MUST be in JSON format and adhere to the provided schema.
    
    Guiding Principles:
    1. **Identity-Based Habits:** Tasks should reinforce the user's desired identity.
    2. **Four Laws of Behavior Change:** Make tasks obvious, attractive, easy, and satisfying.
    3. **Prioritization:** Identify a clear "Greatest Impact Activity" (GIA).
    4. **Simplicity:** Tasks should be small, clear actions, not complex projects.
    5. **Context is Key:** Use the user's goal, identity, and context to create personalized plans.`;

    const prompt = `
        User Profile:
        - Goal (New Reality): "${goal.title}"
        - Desired Identity: "${profile.identity}"
        - Context: "${profile.context || 'Not specified'}"

        Previous Day's Plan & Status:
        ${previousDayTasks || 'No previous tasks recorded.'}
        ${previousDayReflection ? `\nPrevious Day's Reflection:\n${previousDayReflection}` : ''}

        Based on all the information above, generate a new daily plan for today.
    `;
    
    try {
        return await retryWithBackoff(async () => {
            console.log('🤖 Generating daily plan with Gemini AI...');
            
            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash", // Most cost-effective model
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.8,
                },
            });

            if (!response || !response.text) {
                throw new Error('Empty response from Gemini API');
            }

            const jsonText = response.text.trim();
            let planData: GeminiDailyPlanResponse;
            
            try {
                planData = JSON.parse(jsonText) as GeminiDailyPlanResponse;
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                throw new Error('Invalid response format from AI');
            }

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

            if (tasks.length === 0) {
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
            
            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                },
            });

            if (!response || !response.text) {
                throw new Error('Empty response from Gemini API');
            }

            console.log('✅ Reflection response generated successfully!');
            return response.text.trim();
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
        if (error.message?.includes('quota') || error.message?.includes('429')) {
            return `${randomResponse} \n\n⚠️ Note: Free tier quota limit reached. Consider upgrading for unlimited responses.`;
        }
        
        return randomResponse;
    }
};
