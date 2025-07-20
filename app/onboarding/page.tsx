"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  Github,
  FileText,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  integrationData?: {
    type: string;
    action: string;
    response: string;
  };
}

interface OnboardingStatus {
  totalTasks: number;
  completedTasks: number;
  totalPolicies: number;
  acknowledgedPolicies: number;
}

interface DebugInfo {
  companyName: string;
  policyContextLength: number;
  foundPolicyFiles: boolean;
  userRole: string;
  integrationIntent?: any;
}

export default function OnboardingChat() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    totalTasks: 0,
    completedTasks: 0,
    totalPolicies: 0,
    acknowledgedPolicies: 0,
  });
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Authentication check and welcome message
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (messages.length === 0) {
      setMessages([
        {
          id: "1",
          type: "assistant",
          content: `👋 Hello ${
            session?.user?.name || "there"
          }! I'm your AI-powered HR onboarding assistant.

I can help you with:
🏢 **Company policies & documents** - Ask me about handbooks, benefits, codes of conduct
📋 **Onboarding tasks** - Track your progress and get guidance
🔗 **Integrations** - I can help with GitHub repositories, Jira tickets, and Notion pages
❓ **General questions** - Anything about your new role or company

**Quick examples:**
• "Show me the employee handbook"
• "Create a Jira ticket for my laptop setup"
• "What are my GitHub repositories?"
• "What benefits are available?"

How can I help you get started?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [session, status, router, messages.length]);

  // Suggested prompts for quick access
  const suggestedPrompts = [
    "What are my onboarding tasks?",
    "Show me company policies",
    "What are my GitHub repositories?",
    "Create a new Jira ticket",
    "Tell me about benefits",
    "What's in the employee handbook?",
  ];

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || currentMessage;
    if (!messageToSend.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update onboarding status if provided
        if (data.onboardingStatus) {
          setOnboardingStatus(data.onboardingStatus);
        }

        // Update debug info if provided
        if (data.debugInfo) {
          setDebugInfo(data.debugInfo);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: data.response,
          timestamp: new Date(),
          integrationData: data.integrationData,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setSessionId(data.sessionId);
      } else {
        const error = await response.json();
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `❌ I encountered an error: ${
            error.error || "Please try again later."
          }`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "🔌 I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "github":
        return <Github className="w-4 h-4" />;
      case "jira":
        return <Settings className="w-4 h-4" />;
      case "notion":
        return <FileText className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getIntegrationColor = (type: string) => {
    switch (type) {
      case "github":
        return "bg-gray-900 text-white";
      case "jira":
        return "bg-blue-600 text-white";
      case "notion":
        return "bg-black text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-black" />
          <h1
            className="text-xl font-semibold"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  const progressPercentage =
    onboardingStatus.totalTasks > 0
      ? Math.round(
          (onboardingStatus.completedTasks / onboardingStatus.totalTasks) * 100
        )
      : 0;

  const policyProgressPercentage =
    onboardingStatus.totalPolicies > 0
      ? Math.round(
          (onboardingStatus.acknowledgedPolicies /
            onboardingStatus.totalPolicies) *
            100
        )
      : 0;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 text-[#0E0E0E]">
              <MessageCircle className="w-8 h-8" />
              <div>
                <span
                  className="text-2xl font-bold block"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  NexusOne HR Assistant
                </span>
                {debugInfo && (
                  <span className="text-sm text-gray-600">
                    {debugInfo.companyName}
                  </span>
                )}
              </div>
            </div>

            {/* Onboarding Progress */}
            {(onboardingStatus.totalTasks > 0 ||
              onboardingStatus.totalPolicies > 0) && (
              <div className="flex items-center gap-4">
                {onboardingStatus.totalTasks > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">
                        Tasks: {onboardingStatus.completedTasks}/
                        {onboardingStatus.totalTasks}
                      </span>
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {progressPercentage}%
                    </span>
                  </div>
                )}

                {onboardingStatus.totalPolicies > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">
                        Policies: {onboardingStatus.acknowledgedPolicies}/
                        {onboardingStatus.totalPolicies}
                      </span>
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${policyProgressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {policyProgressPercentage}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 overflow-hidden">
        <div className="h-full">
          {/* Chat Interface */}
          <div className="flex flex-col h-full min-h-0">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full min-h-0">
              <CardHeader className="border-b border-gray-100 flex-shrink-0">
                <CardTitle
                  className="flex items-center text-xl font-semibold"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  <Bot className="w-5 h-5 mr-2 text-gray-700" />
                  AI HR Assistant
                  <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                    Online
                  </Badge>
                </CardTitle>
                <CardDescription
                  className="text-gray-600"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Your intelligent assistant for onboarding, policies, and
                  integrations
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                {/* Suggested Prompts - Only show when no messages yet */}
                {messages.length <= 1 && (
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-700 mb-3 font-medium">
                      Try asking:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedPrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => sendMessage(prompt)}
                          disabled={loading}
                          className="text-xs hover:bg-gray-100"
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-lg ${
                          message.type === "user"
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.type === "assistant" && (
                            <Bot className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                          )}
                          {message.type === "user" && (
                            <User className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {message.integrationData && (
                                <Badge
                                  className={`text-xs ${getIntegrationColor(
                                    message.integrationData.type
                                  )}`}
                                >
                                  {getIntegrationIcon(
                                    message.integrationData.type
                                  )}
                                  <span className="ml-1 capitalize">
                                    {message.integrationData.type}{" "}
                                    {message.integrationData.action}
                                  </span>
                                </Badge>
                              )}
                            </div>
                            <p
                              className="text-sm leading-relaxed whitespace-pre-wrap"
                              style={{
                                fontFamily: "Inter, system-ui, sans-serif",
                              }}
                            >
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p
                                className={`text-xs ${
                                  message.type === "user"
                                    ? "text-gray-300"
                                    : "text-gray-500"
                                }`}
                                style={{
                                  fontFamily: "Inter, system-ui, sans-serif",
                                }}
                              >
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {message.integrationData && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Zap className="w-3 h-3" />
                                  Integration
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-gray-600" />
                          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                            }}
                          >
                            Processing your request...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-100 p-4 flex-shrink-0">
                  <div className="flex gap-3">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about policies, tasks, integrations, or anything else..."
                      disabled={loading}
                      className="flex-1 h-11 px-4 border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={loading || !currentMessage.trim()}
                      className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        sendMessage("What are my GitHub repositories?")
                      }
                      disabled={loading}
                      className="text-xs"
                    >
                      <Github className="w-3 h-3 mr-1" />
                      GitHub
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage("Show me company policies")}
                      disabled={loading}
                      className="text-xs"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Policies
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        sendMessage("What are my onboarding tasks?")
                      }
                      disabled={loading}
                      className="text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Tasks
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Debug Info (Development Only) */}
      {debugInfo && process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-3 rounded-lg shadow-lg max-w-sm">
          <div className="font-bold mb-1">Debug Info:</div>
          <div>Company: {debugInfo.companyName}</div>
          <div>Policy Context: {debugInfo.policyContextLength} chars</div>
          <div>Policy Files: {debugInfo.foundPolicyFiles ? "✓" : "✗"}</div>
          <div>Role: {debugInfo.userRole}</div>
          {debugInfo.integrationIntent && (
            <div>Integration: {debugInfo.integrationIntent.type}</div>
          )}
        </div>
      )}
    </div>
  );
}
