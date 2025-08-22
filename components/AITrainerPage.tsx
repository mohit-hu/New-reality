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

  // Quick action buttons
  const quickActions = [
    { icon: HiChartBar, text: "Check my progress", query: "How am I doing with my goals?" },
    { icon: HiHeart, text: "Motivation boost", query: "I need some motivation to stay on track" },
    { icon: HiLightBulb, text: "Today's tip", query: "Give me a quick tip for today" },
    { icon: HiCog, text: "Adjust my plan", query: "Help me adjust my current plan" },
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
      content: `🏋️‍♂️ Hey there, ${userProfile.identity}! I'm your AI Personal Trainer, here to help you achieve your goal: "${goal.title}".

I've reviewed your profile and I'm excited to support your journey! Whether you need motivation, advice, progress tracking, or just someone to talk through challenges with - I'm here for you 24/7.

What would you like to work on today?`,
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
      const systemInstruction = `You are an experienced, motivational personal trainer and life coach. Your personality is encouraging, knowledgeable, and supportive but also firm when needed.

User Context:
- Goal: "${goal.title}"
- Identity: "${userProfile.identity}"
- Background: "${userProfile.context || 'Not specified'}"

Guidelines:
1. Always be encouraging and positive
2. Provide actionable, specific advice
3. Use fitness/wellness terminology appropriately
4. Keep responses conversational and engaging
5. Reference their goal and identity when relevant
6. If asked about progress, encourage them to check their goal tracking page
7. Provide practical tips they can implement immediately
8. Use motivational language and emojis appropriately
9. Keep responses under 150 words for better engagement
10. Ask follow-up questions to keep the conversation going`;

      const prompt = `The user says: "${messageContent}"

Based on their goal and profile, provide a helpful, motivational response as their personal trainer.`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
      });

      const trainerResponse = response.response.text();

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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <HiHeart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">🏋️‍♂️ AI Personal Trainer</h1>
            <p className="text-blue-100 text-sm">Your 24/7 Fitness & Wellness Coach</p>
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
                  <span className="text-xs font-semibold text-gray-600">AI Trainer</span>
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
        <form onSubmit={handleSubmit} className="flex space-x-2">
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
