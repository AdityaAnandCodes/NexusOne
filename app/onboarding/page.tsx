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
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <h1
            className="text-2xl font-bold mb-2"
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3 text-[#0E0E0E]">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.0701 12.01C19.2003 12.0284 19.3255 12.0723 19.4388 12.1392C19.552 12.206 19.6509 12.2946 19.7298 12.3997C19.8088 12.5049 19.8662 12.6245 19.8989 12.7519C19.9315 12.8793 19.9387 13.0118 19.9201 13.142C19.6694 14.876 18.8567 16.4799 17.6067 17.7075C16.3566 18.9352 14.7383 19.7187 13.0001 19.938V21C13.0001 21.2652 12.8947 21.5196 12.7072 21.7071C12.5196 21.8946 12.2653 22 12.0001 22C11.7348 22 11.4805 21.8946 11.293 21.7071C11.1054 21.5196 11.0001 21.2652 11.0001 21V19.938C9.26203 19.7184 7.64403 18.9347 6.39423 17.7071C5.14442 16.4795 4.33182 14.8758 4.08106 13.142C4.0434 12.8794 4.11158 12.6127 4.27061 12.4004C4.42964 12.1881 4.66649 12.0477 4.92906 12.01C5.19162 11.9723 5.45839 12.0405 5.67069 12.1996C5.88298 12.3586 6.0234 12.5954 6.06106 12.858C6.26788 14.2856 6.982 15.5909 8.07267 16.535C9.16334 17.479 10.5576 17.9986 12.0001 17.9986C13.4426 17.9986 14.8368 17.479 15.9274 16.535C17.0181 15.5909 17.7322 14.2856 17.9391 12.858C17.9577 12.728 18.0018 12.6029 18.0687 12.4899C18.1357 12.3769 18.2243 12.2783 18.3294 12.1995C18.4345 12.1208 18.5541 12.0635 18.6814 12.031C18.8086 11.9985 18.94 11.9913 19.0701 12.01ZM12.0001 2C12.8191 2 13.5921 2.197 14.2741 2.546C13.8214 2.86439 13.4656 3.30179 13.2461 3.80981C13.0266 4.31784 12.9519 4.87668 13.0302 5.42452C13.1086 5.97237 13.337 6.48787 13.6901 6.91399C14.0432 7.34011 14.5073 7.66025 15.0311 7.839L15.4091 7.969C15.5535 8.01827 15.6847 8.09994 15.7927 8.20776C15.9007 8.31557 15.9826 8.44666 16.0321 8.591L16.1611 8.969C16.3311 9.469 16.6251 9.901 17.0001 10.236V12C17.0001 13.3261 16.4733 14.5979 15.5356 15.5355C14.5979 16.4732 13.3261 17 12.0001 17C10.674 17 9.40221 16.4732 8.46453 15.5355C7.52684 14.5979 7.00006 13.3261 7.00006 12V7C7.00006 5.67392 7.52684 4.40215 8.46453 3.46447C9.40221 2.52678 10.674 2 12.0001 2ZM19.0001 1C19.1871 1 19.3705 1.05248 19.5292 1.15147C19.688 1.25046 19.8157 1.392 19.8981 1.56L19.9461 1.677L20.0761 2.055C20.2133 2.45718 20.4343 2.82563 20.7247 3.13594C21.015 3.44625 21.3679 3.69135 21.7601 3.855L21.9451 3.925L22.3231 4.054C22.5102 4.11786 22.6743 4.2358 22.7945 4.3929C22.9146 4.54999 22.9855 4.7392 22.9981 4.93658C23.0108 5.13396 22.9646 5.33065 22.8654 5.50178C22.7663 5.67291 22.6186 5.8108 22.4411 5.898L22.3231 5.946L21.9451 6.076C21.5429 6.2132 21.1744 6.43428 20.8641 6.72459C20.5538 7.01491 20.3087 7.36783 20.1451 7.76L20.0751 7.945L19.9461 8.323C19.8821 8.51014 19.7641 8.6741 19.6069 8.79416C19.4497 8.91423 19.2605 8.98499 19.0631 8.99752C18.8658 9.01004 18.6691 8.96376 18.498 8.86452C18.327 8.76528 18.1892 8.61755 18.1021 8.44L18.0541 8.323L17.9241 7.945C17.7869 7.54282 17.5658 7.17437 17.2755 6.86406C16.9852 6.55375 16.6322 6.30865 16.2401 6.145L16.0551 6.075L15.6771 5.946C15.4899 5.88214 15.3258 5.7642 15.2057 5.6071C15.0855 5.45001 15.0146 5.2608 15.002 5.06342C14.9894 4.86604 15.0355 4.66935 15.1347 4.49822C15.2339 4.32709 15.3815 4.1892 15.5591 4.102L15.6771 4.054L16.0551 3.924C16.4572 3.7868 16.8257 3.56572 17.136 3.27541C17.4463 2.98509 17.6914 2.63217 17.8551 2.24L17.9251 2.055L18.0541 1.677C18.1214 1.47959 18.2489 1.30818 18.4185 1.18679C18.5881 1.06539 18.7915 1.00008 19.0001 1Z"
                  fill="black"
                />
              </svg>
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                NexusOne
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`max-w-7xl mx-auto px-6 lg:px-8 py-12 transform transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200 mb-6">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
            <span
              className="text-sm font-semibold tracking-wide"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              NEXUS - ONBOARDING ASSISTANT
            </span>
          </div>

          <h1
            className="text-5xl font-black tracking-tight mb-4"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Welcome to Your <span className="text-gray-800">Onboarding</span>
          </h1>
          <p
            className="text-xl text-gray-600"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Your AI assistant is here to help you get started
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Onboarding Progress Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle
                  className="flex items-center text-lg font-semibold"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  <Users className="w-5 h-5 mr-3 text-slate-700" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {onboardingStatus ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-sm font-semibold"
                          style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                            color: "#0E0E0E",
                          }}
                        >
                          Tasks
                        </span>
                        <span
                          className="text-sm font-medium text-gray-600"
                          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        >
                          {onboardingStatus.completedTasks}/
                          {onboardingStatus.totalTasks}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-slate-800 h-3 rounded-full transition-all duration-500 ease-out"
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
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-sm font-semibold"
                          style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                            color: "#0E0E0E",
                          }}
                        >
                          Policies
                        </span>
                        <span
                          className="text-sm font-medium text-gray-600"
                          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        >
                          {onboardingStatus.acknowledgedPolicies}/
                          {onboardingStatus.totalPolicies}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gray-700 h-3 rounded-full transition-all duration-500 ease-out"
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
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      Start chatting to see your progress
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {process.env.NODE_ENV === "development" && debugInfo && (
              <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle
                    className="flex items-center text-lg font-semibold"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    🔧 Debug Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="space-y-2 text-sm text-gray-700"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
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

            {process.env.NODE_ENV === "development" && (
              <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle
                    className="flex items-center text-lg font-semibold"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    🧪 Test Queries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-900 rounded-xl font-medium transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      onClick={() =>
                        setCurrentMessage("Tell me about our company handbook")
                      }
                    >
                      📖 Test Handbook Query
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-900 rounded-xl font-medium transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      onClick={() => setCurrentMessage("What are my benefits?")}
                    >
                      💰 Test Benefits Query
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-900 rounded-xl font-medium transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
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

            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle
                  className="flex items-center text-lg font-semibold"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  <BookOpen className="w-5 h-5 mr-3 text-slate-700" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-900 rounded-xl font-medium transition-all duration-300"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    <FileText className="w-4 h-4 mr-3 text-slate-600" />
                    Company Handbook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-900 rounded-xl font-medium transition-all duration-300"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    <Users className="w-4 h-4 mr-3 text-slate-600" />
                    Team Directory
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-900 rounded-xl font-medium transition-all duration-300"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    <Building2 className="w-4 h-4 mr-3 text-slate-600" />
                    Benefits Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg h-[700px] flex flex-col">
              <CardHeader>
                <CardTitle
                  className="flex items-center text-2xl font-bold"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  <MessageCircle className="w-6 h-6 mr-3 text-slate-700" />
                  HR Onboarding Assistant
                </CardTitle>
                <CardDescription
                  className="text-gray-600"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Ask me anything about your onboarding, company policies, or
                  getting started!
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-6 space-y-4">
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
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                          message.type === "user"
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {message.type === "assistant" && (
                            <Bot className="w-4 h-4 mt-0.5 text-slate-700" />
                          )}
                          {message.type === "user" && (
                            <User className="w-4 h-4 mt-0.5 text-white" />
                          )}
                          <div className="flex-1">
                            <p
                              className="text-sm whitespace-pre-wrap"
                              style={{
                                fontFamily: "Inter, system-ui, sans-serif",
                              }}
                            >
                              {message.content}
                            </p>
                            <p
                              className={`text-xs mt-2 ${
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Bot className="w-4 h-4 text-slate-700" />
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                            <span
                              className="text-sm"
                              style={{
                                fontFamily: "Inter, system-ui, sans-serif",
                              }}
                            >
                              Thinking...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex space-x-3">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={loading}
                    className="flex-1 h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !currentMessage.trim()}
                    className="group relative px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 overflow-hidden"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Send className="w-4 h-4" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
