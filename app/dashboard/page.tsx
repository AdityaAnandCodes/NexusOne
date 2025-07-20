"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Users,
  MessageSquare,
  MessageCircle,
  Settings,
  BarChart3,
  Plus,
  Bell,
  ChevronRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalEmployees: number;
  activeOnboarding: number;
  completedOnboarding: number;
  pendingTasks: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (!session?.user?.companyId) {
      router.push("/onboarding/company");
      return;
    }

    // Load dashboard data
    loadDashboardData();
  }, [session, status, router]);

  const loadDashboardData = async () => {
    try {
      // This would fetch from tenant-specific API
      setStats({
        totalEmployees: 42,
        activeOnboarding: 8,
        completedOnboarding: 34,
        pendingTasks: 15,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || isLoading) {
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
            Loading your dashboard...
          </h1>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Manage Employees",
      description: "Add & invite team members",
      icon: Users,
      href: "/hr/employees",
      color: "text-slate-700",
    },
    {
      title: "Company Setup",
      description: "Configure policies & onboarding",
      icon: Settings,
      href: "/hr/setup",
      color: "text-slate-700",
    },
    {
      title: "Onboarding Management",
      description: "Review employee progress",
      icon: Users,
      href: "/hr/onboarding",
      color: "text-slate-700",
    },
    {
      title: "Onboarding Chat",
      description: "AI assistant for new hires",
      icon: MessageCircle,
      href: "/onboarding",
      color: "text-slate-700",
    },
  ];

  const secondaryActions = [
    {
      title: "Setup Onboarding",
      description: "Configure onboarding flow",
      icon: Settings,
      href: "/onboarding/setup",
      color: "text-slate-700",
    },
    {
      title: "HR Chat",
      description: "Internal communication",
      icon: MessageSquare,
      href: "/chat/admin",
      color: "text-slate-700",
    },
    {
      title: "Analytics",
      description: "Performance insights",
      icon: BarChart3,
      href: "/analytics",
      color: "text-slate-700",
    },
  ];

  const recentActivities = [
    {
      title: "John Doe started onboarding",
      time: "2 hours ago",
      icon: Users,
      color: "bg-slate-100 text-slate-700",
    },
    {
      title: "Sarah completed document upload",
      time: "4 hours ago",
      icon: MessageSquare,
      color: "bg-gray-100 text-gray-700",
    },
    {
      title: "Onboarding checklist updated",
      time: "1 day ago",
      icon: Settings,
      color: "bg-slate-200 text-slate-800",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
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
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    NexusOne
                  </h1>
                  <p
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    Welcome back, {session?.user?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSignOut}
                className="group relative px-6 py-2 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 overflow-hidden"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                <span className="relative z-10">Sign Out</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
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
              NEXUS - COMPANY DASHBOARD
            </span>
          </div>

          <h2
            className="text-5xl font-black tracking-tight mb-4"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Dashboard Overview
          </h2>
          <p
            className="text-xl text-gray-600"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Manage your company's onboarding process and track progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <Users className="h-5 w-5 text-slate-700" />
                Total Employees
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                All registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-gray-900 flex items-center gap-2"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {stats?.totalEmployees || 0}
                <TrendingUp className="h-5 w-5 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <Clock className="h-5 w-5 text-slate-700" />
                Active Onboarding
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Currently in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-slate-800"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {stats?.activeOnboarding || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <MessageSquare className="h-5 w-5 text-slate-700" />
                Completed
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Finished onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-slate-800"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {stats?.completedOnboarding || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <Bell className="h-5 w-5 text-slate-700" />
                Pending Tasks
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Require attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-slate-800"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {stats?.pendingTasks || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3
            className="text-2xl font-bold mb-6"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="group bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-400 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <action.icon
                      className={`h-8 w-8 ${action.color} mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                    />
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {action.title}
                    </h3>
                    <p
                      className="text-gray-600 text-sm mb-3"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {action.description}
                    </p>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all mx-auto" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mb-12">
          <h3
            className="text-2xl font-bold mb-6"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Additional Tools
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {secondaryActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="group bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-400 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <action.icon
                      className={`h-8 w-8 ${action.color} mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                    />
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {action.title}
                    </h3>
                    <p
                      className="text-gray-600 text-sm mb-3"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {action.description}
                    </p>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all mx-auto" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle
              className="text-2xl font-bold"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              Recent Activity
            </CardTitle>
            <CardDescription
              className="text-gray-600"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Latest onboarding updates and employee progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300"
                >
                  <div
                    className={`w-12 h-12 ${activity.color} rounded-xl flex items-center justify-center`}
                  >
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-semibold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {activity.title}
                    </p>
                    <p
                      className="text-gray-600 text-sm"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {activity.time}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
