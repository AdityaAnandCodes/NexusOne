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
  Settings,
  BarChart3,
  Plus,
  Bell,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-white mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Loading your dashboard...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">NexusOne</h1>
                <p className="text-sm text-white/60">
                  Welcome back, {session?.user?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-white hover:bg-white/10"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Dashboard Overview
          </h2>
          <p className="text-white/70">
            Manage your company's onboarding process and track progress
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Link href="/employees/invite">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Plus className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Invite Employee</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/onboarding/setup">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Settings className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Setup Onboarding</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/chat/admin">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">HR Chat</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Analytics</h3>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">
                Total Employees
              </CardTitle>
              <CardDescription className="text-white/70">
                All registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats?.totalEmployees || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">
                Active Onboarding
              </CardTitle>
              <CardDescription className="text-white/70">
                Currently in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {stats?.activeOnboarding || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Completed</CardTitle>
              <CardDescription className="text-white/70">
                Finished onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {stats?.completedOnboarding || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">
                Pending Tasks
              </CardTitle>
              <CardDescription className="text-white/70">
                Require attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">
                {stats?.pendingTasks || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-white/70">
              Latest onboarding updates and employee progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">
                    John Doe started onboarding
                  </p>
                  <p className="text-white/60 text-sm">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">
                    Sarah completed document upload
                  </p>
                  <p className="text-white/60 text-sm">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">
                    Onboarding checklist updated
                  </p>
                  <p className="text-white/60 text-sm">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
