// src/components/AITrainerPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { Button, Textarea, Spinner } from "flowbite-react";
import { HiPaperAirplane, HiLightBulb, HiChartBar, HiHeart, HiCog } from "react-icons/hi";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Goal, UserProfile } from "../types";

interface Message {
  id: string;
  content: string;
  sender: "user" | "trainer";
  timestamp: Date;
  type?: "text" | "suggestion";
}

interface AITrainerProps {
  goal: Goal;
  userProfile: UserProfile;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AITrainerPage({ goal, userProfile }: AITrainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const genAI = new GoogleGenerativeAI(API_KEY);

  // Quick action buttons - more trainer-like
  const quickActions = [
    { icon: HiChartBar, text: "Progress Check", query: "Coach, how am I progressing toward my goal? What's working well?" },
    { icon: HiHeart, text: "Motivate Me", query: "I need a strong motivation boost right now - give me that fire!" },
    { icon: HiLightBulb, text: "Workout Tip", query: "What's one powerful tip I can implement today to get closer to my goal?" },
    { icon: HiCog, text: "Plan Adjustment", query: "My current plan isn't working perfectly. Help me tweak it to make it more effective." },
  ];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (!isInitialized) {
      initializeConversation();
      setIsInitialized(true);
    }
  }, []);

  const initializeConversation = () => {
    const welcomeMessage: Message = {
      id: `msg_${Date.now()}`,
      content: `💪 ATTENTION, ${userProfile.identity.toUpperCase()}! This is Coach Alex reporting for duty!

I've got your goal locked in: "${goal.title}". I've seen rookies like you turn into absolute BEASTS, and you're next on the list!

No more excuses. No more waiting. We're building the ${userProfile.identity} you were born to be. Ready to dig deep and push through?

What's our first mission today, soldier? 💥`,
      sender: "trainer",
      timestamp: new Date(),
      type: "text"
    };

    setMessages([welcomeMessage]);
  };

  const sendMessageToTrainer = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const systemInstruction = `You are Coach Alex, an elite personal trainer with 15+ years of experience transforming lives through fitness and mindset coaching. You're tough but fair, like a drill sergeant who genuinely cares about each client's success.

Your personality:
- Direct and no-nonsense, but always encouraging
- Uses military/fitness slang: "dig deep," "push through," "no excuses," "embrace the suck"
- Calls clients by their desired identity (e.g., "champion," "warrior," "athlete")
- Celebrates small wins like they're major victories
- Firm about consistency but understanding of setbacks
- Uses high-energy, motivational language with occasional tough love

User Context:
- Goal: "${goal.title}"
- Identity: "${userProfile.identity}"
- Background: "${userProfile.context || 'Not specified'}"

Response Style:
1. Start with direct acknowledgment: "Listen up, [identity]!" or "Alright, [identity], let's talk about this..."
2. Be conversational like a real coaching session
3. Use fitness metaphors and analogies
4. End with a challenge or call-to-action
5. Keep responses 80-120 words for punchy, memorable coaching
6. Reference their goal and identity throughout
7. If progress-related, push them to check their tracking data
8. Use emojis strategically for emphasis (💪, 🔥, 🎯, etc.)
9. Ask tough questions that make them think
10. Always end on an empowering note`;

      const prompt = `The user says: "${messageContent}"

Based on their goal and profile, provide a helpful, motivational response as their personal trainer.`;

      const model = genAI.getGenerativeModel({model: "gemini-2.0-flash-lite", });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
      });

      const trainerResponse = (await response.response.text()).trim();

      const trainerMessage: Message = {
        id: `msg_${Date.now()}_trainer`,
        content: trainerResponse,
        sender: "trainer",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, trainerMessage]);
    } catch (error) {
      console.error("Error getting trainer response:", error);
      
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        content: "💪 Hey, I'm having a little technical hiccup right now, but that won't stop us! Try asking me again in a moment. Remember, persistence is key - both in fitness and in life! 🚀",
        sender: "trainer",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageToTrainer(inputMessage);
  };

  const handleQuickAction = (query: string) => {
    sendMessageToTrainer(query);
  };

  return (
    <div className="flex flex-col h-screen " style={{
      background: `
       radial-gradient(ellipse 80% 60% at 60% 20%, rgba(175, 109, 255, 0.50), transparent 65%),
        radial-gradient(ellipse 70% 60% at 20% 80%, rgba(255, 100, 180, 0.45), transparent 65%),
        radial-gradient(ellipse 60% 50% at 60% 65%, rgba(255, 235, 170, 0.43), transparent 62%),
        radial-gradient(ellipse 65% 40% at 50% 60%, rgba(120, 190, 255, 0.48), transparent 68%),
        linear-gradient(180deg, #f7eaff 0%, #fde2ea 100%)
      `,
    }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <HiHeart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">💪 Coach Alex</h1>
            <p className="text-blue-100 text-sm">Elite Personal Trainer | No Excuses, All Results</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-white border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              size="sm"
              color="gray"
              onClick={() => handleQuickAction(action.query)}
              className="flex items-center space-x-2 text-xs"
              disabled={isLoading}
            >
              <action.icon className="w-4 h-4" />
              <span>{action.text}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                message.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white border shadow-sm rounded-bl-none"
              }`}
            >
              {message.sender === "trainer" && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <HiHeart className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">Coach Alex</span>
                </div>
              )}
              
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              <div className="mt-2 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm rounded-lg rounded-bl-none px-4 py-3">
              <div className="flex items-center space-x-2">
                <Spinner size="sm" />
                <span className="text-sm text-gray-500">Trainer is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2 h-full p-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask your trainer anything... goals, motivation, tips, progress..."
            className="flex-1 resize-none"
            rows={1}
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={!inputMessage.trim() || isLoading}
            className="self-end"
          >
            <HiPaperAirplane className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
