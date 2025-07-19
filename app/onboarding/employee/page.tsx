"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Send,
  Bot,
  User,
  CheckCircle,
  Upload,
  FileText,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  message: string;
  timestamp: Date;
  type?: "text" | "quick_reply" | "task" | "document_upload";
  metadata?: any;
}

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "bot",
    message:
      "Hi there! 👋 Welcome to your onboarding journey. I'm here to help you get settled in. Let's start with the basics - what's your preferred name?",
    timestamp: new Date(),
    type: "text",
  },
];

export default function EmployeeOnboarding() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (
    message: string,
    sender: "bot" | "user",
    type: "text" | "quick_reply" | "task" | "document_upload" = "text"
  ) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender,
      message,
      timestamp: new Date(),
      type,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const simulateBotResponse = (userMessage: string) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      // Simple response logic based on user input
      if (
        userMessage.toLowerCase().includes("name") ||
        userMessage.toLowerCase().includes("call me")
      ) {
        addMessage(
          "Great! It's nice to meet you. Now, let's get you set up with your employee profile. I'll need you to complete a few tasks:\n\n1. Upload your profile photo\n2. Verify your contact information\n3. Review company policies\n4. Complete tax forms\n\nShall we start with uploading your profile photo?",
          "bot"
        );
      } else if (
        userMessage.toLowerCase().includes("yes") ||
        userMessage.toLowerCase().includes("sure") ||
        userMessage.toLowerCase().includes("ok")
      ) {
        addMessage("Perfect! Here are your current onboarding tasks:", "bot");
        // Add task list
        setTimeout(() => {
          addMessage(
            "📋 **Your Onboarding Checklist**\n\n✅ Account Setup - Completed\n🔲 Profile Photo Upload - Pending\n🔲 Contact Information Verification - Pending\n🔲 Company Policies Review - Pending\n🔲 Tax Forms Completion - Pending\n\nClick on any pending task to get started!",
            "bot",
            "task"
          );
        }, 1000);
      } else if (
        userMessage.toLowerCase().includes("help") ||
        userMessage.toLowerCase().includes("support")
      ) {
        addMessage(
          "I'm here to help! You can:\n\n• Ask me about company policies\n• Get help with any onboarding task\n• Upload required documents\n• Contact HR directly\n\nWhat would you like assistance with?",
          "bot"
        );
      } else {
        addMessage(
          "Thanks for that information! Is there anything specific you'd like to know about the company or the onboarding process? I'm here to help make your first day smooth and welcoming.",
          "bot"
        );
      }
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    addMessage(inputMessage, "user");
    const userMsg = inputMessage;
    setInputMessage("");

    simulateBotResponse(userMsg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = (reply: string) => {
    addMessage(reply, "user");
    simulateBotResponse(reply);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">
                  NexusOne Onboarding
                </h1>
                <p className="text-sm text-white/60">
                  Welcome, {session?.user?.name}!
                </p>
              </div>
            </div>
            <div className="text-white/60 text-sm">🎯 Progress: 20%</div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Bot className="h-6 w-6 text-blue-400" />
              <span>Onboarding Assistant</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === "bot" && (
                        <Bot className="h-4 w-4 mt-1 text-blue-400 flex-shrink-0" />
                      )}
                      {message.sender === "user" && (
                        <User className="h-4 w-4 mt-1 text-white flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-line">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {message.type === "task" && (
                      <div className="mt-3 space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full"
                          onClick={() =>
                            handleQuickReply(
                              "I'd like to upload my profile photo"
                            )
                          }
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Profile Photo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full"
                          onClick={() =>
                            handleQuickReply(
                              "I need to review company policies"
                            )
                          }
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Review Policies
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/20 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-400" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-6 py-2 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={() => handleQuickReply("I need help")}
                >
                  Need Help
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={() => handleQuickReply("Contact HR")}
                >
                  Contact HR
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={() => handleQuickReply("Show my progress")}
                >
                  My Progress
                </Button>
              </div>
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  variant="gradient"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
