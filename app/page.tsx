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
  Shield,
  BarChart3,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);

  // Check if authenticated user has a company
  useEffect(() => {
    if (session?.user?.email) {
      checkUserCompany();
    }
  }, [session]);

  const checkUserCompany = async () => {
    setIsCheckingCompany(true);
    try {
      const response = await fetch("/api/user/company-status");
      if (response.ok) {
        const data = await response.json();
        setHasCompany(data.hasCompany);

        // If user has a company, redirect to dashboard
        if (data.hasCompany) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking company status:", error);
    } finally {
      setIsCheckingCompany(false);
    }
  };

  const handleGetStarted = () => {
    if (session?.user) {
      // User is authenticated, check if they have a company
      if (hasCompany === false) {
        router.push("/onboarding/company");
      } else if (hasCompany === true) {
        router.push("/dashboard");
      } else {
        // Still checking, do nothing for now
      }
    } else {
      // User not authenticated, go to sign in
      router.push("/auth/signin");
    }
  };

  const getCtaText = () => {
    if (status === "loading" || isCheckingCompany) return "Loading...";
    if (!session) return "Get Started";
    if (hasCompany === false) return "Create Your Company";
    if (hasCompany === true) return "Go to Dashboard";
    return "Get Started";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">NexusOne</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-white/80 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-white/80 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#contact"
                className="text-white/80 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              {!session ? (
                <>
                  <Link href="/auth/signin">
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Button variant="glassmorphism" onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-white/80 text-sm">
                    Welcome, {session.user?.name || session.user?.email}
                  </span>
                  <Button variant="glassmorphism" onClick={handleGetStarted}>
                    {getCtaText()}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Revolutionize Your
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}
              Employee Onboarding
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform new hire experiences with AI-powered conversational
            onboarding. Streamline processes, ensure compliance, and create
            memorable first impressions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              variant="gradient"
              className="min-w-48"
              onClick={handleGetStarted}
              disabled={status === "loading" || isCheckingCompany}
            >
              {getCtaText()}
            </Button>
            <Link href="#demo">
              <Button size="xl" variant="glassmorphism">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div
          id="features"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-blue-400 mb-4" />
              <CardTitle className="text-white">AI Chat Assistant</CardTitle>
              <CardDescription className="text-white/70">
                Conversational onboarding that guides employees through every
                step naturally
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <Shield className="h-12 w-12 text-green-400 mb-4" />
              <CardTitle className="text-white">
                Multi-Tenant Security
              </CardTitle>
              <CardDescription className="text-white/70">
                Enterprise-grade data isolation with separate databases per
                company
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">Role-Based Access</CardTitle>
              <CardDescription className="text-white/70">
                Granular permissions for admins, HR managers, and employees
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-yellow-400 mb-4" />
              <CardTitle className="text-white">Analytics Dashboard</CardTitle>
              <CardDescription className="text-white/70">
                Track completion rates, identify bottlenecks, and optimize
                processes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <Zap className="h-12 w-12 text-orange-400 mb-4" />
              <CardTitle className="text-white">Quick Setup</CardTitle>
              <CardDescription className="text-white/70">
                Get started in minutes with customizable templates and workflows
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <Building2 className="h-12 w-12 text-indigo-400 mb-4" />
              <CardTitle className="text-white">White-Label Ready</CardTitle>
              <CardDescription className="text-white/70">
                Fully customizable branding to match your company's identity
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Onboarding?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join hundreds of companies creating exceptional employee experiences
          </p>
          <Button
            size="xl"
            variant="gradient"
            onClick={handleGetStarted}
            disabled={status === "loading" || isCheckingCompany}
          >
            {getCtaText()}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building2 className="h-6 w-6 text-white" />
              <span className="text-lg font-semibold text-white">NexusOne</span>
            </div>
            <div className="text-white/60 text-sm">
              © 2025 NexusOne. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
