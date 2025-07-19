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
  CheckCircle,
  Clock,
  FileText,
  Building2,
  Users,
  BookOpen,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DebugInfo {
  companyName: string;
  policyContextLength: number;
  foundPolicyFiles: boolean;
  userRole: string;
}
interface OnboardingStatus {
  totalTasks: number;
  completedTasks: number;
  totalPolicies: number;
  acknowledgedPolicies: number;
}

export default function OnboardingChat() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: "1",
          type: "assistant",
          content:
            "👋 Hello! I'm your HR onboarding assistant. I'm here to help you navigate your first days at the company. Feel free to ask me about your onboarding tasks, company policies, benefits, or any other questions you might have!",
          timestamp: new Date(),
        },
      ]);
    }
  }, [session, status, router, messages.length]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setLoading(true);

    try {
      console.log("🚀 Sending message to API:", currentMessage);

      const response = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          sessionId: sessionId,
        }),
      });

      console.log("📡 API response status:", response.status);

      if (response.ok) {
        const data = await response.json();

        console.log("✅ API response data:", {
          responseLength: data.response?.length,
          hasDebugInfo: !!data.debugInfo,
          sessionId: data.sessionId,
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setSessionId(data.sessionId);
        setOnboardingStatus(data.onboardingStatus);

        // Set debug info if available
        if (data.debugInfo) {
          setDebugInfo(data.debugInfo);
          console.log("🔧 Debug info:", data.debugInfo);
        }
      } else {
        const error = await response.json();
        console.error("❌ API error response:", error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `Sorry, I encountered an error: ${
            error.error || "Please try again later."
          }`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("❌ Network error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
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

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-white mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to Your Onboarding!</h1>
        <p className="text-slate-600">
          Your AI assistant is here to help you get started
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Onboarding Progress Sidebar */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 mr-2" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {onboardingStatus ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tasks</span>
                      <span className="text-sm text-slate-600">
                        {onboardingStatus.completedTasks}/
                        {onboardingStatus.totalTasks}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            onboardingStatus.totalTasks > 0
                              ? (onboardingStatus.completedTasks /
                                  onboardingStatus.totalTasks) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Policies</span>
                      <span className="text-sm text-slate-600">
                        {onboardingStatus.acknowledgedPolicies}/
                        {onboardingStatus.totalPolicies}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            onboardingStatus.totalPolicies > 0
                              ? (onboardingStatus.acknowledgedPolicies /
                                  onboardingStatus.totalPolicies) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    Start chatting to see your progress
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          {process.env.NODE_ENV === "development" && debugInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  🔧 Debug Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Company:</strong> {debugInfo.companyName}
                  </div>
                  <div>
                    <strong>Role:</strong> {debugInfo.userRole}
                  </div>
                  <div>
                    <strong>Policy Files:</strong>{" "}
                    {debugInfo.foundPolicyFiles ? "Found" : "None"}
                  </div>
                  <div>
                    <strong>Context Length:</strong>{" "}
                    {debugInfo.policyContextLength} chars
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Quick Links
              </CardTitle>
            </CardHeader>
            {process.env.NODE_ENV === "development" && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    🧪 Test Queries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() =>
                        setCurrentMessage("Tell me about our company handbook")
                      }
                    >
                      📖 Test Handbook Query
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setCurrentMessage("What are my benefits?")}
                    >
                      💰 Test Benefits Query
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() =>
                        setCurrentMessage("What is our code of conduct?")
                      }
                    >
                      ⚖️ Test Conduct Query
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Company Handbook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Team Directory
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Benefits Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[700px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                HR Onboarding Assistant
              </CardTitle>
              <CardDescription>
                Ask me anything about your onboarding, company policies, or
                getting started!
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === "assistant" && (
                          <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
                        )}
                        {message.type === "user" && (
                          <User className="w-4 h-4 mt-0.5 text-white" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              message.type === "user"
                                ? "text-blue-100"
                                : "text-slate-500"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <div className="flex items-center space-x-1">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !currentMessage.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
