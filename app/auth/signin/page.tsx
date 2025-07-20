"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getSession().then(async (session) => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/user/company-status");
          if (response.ok) {
            const data = await response.json();
            if (data.hasCompany) {
              router.push("/dashboard");
            } else {
              router.push("/onboarding/company");
            }
          } else {
            router.push("/onboarding/company");
          }
        } catch (error) {
          console.error("Error checking company status:", error);
          router.push("/onboarding/company");
        }
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", {
        callbackUrl: "/auth/callback",
        redirect: true,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <section className="relative flex items-center justify-center min-h-screen px-8 py-0.5 overflow-hidden bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <div className="flex-1 space-y-10 relative z-10 max-w-xl mx-auto">
        {/* Main Heading */}
        <div className="space-y-8 transform transition-all duration-1000 translate-y-0 opacity-100">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200 mx-auto">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
            <span
              className="text-sm font-semibold tracking-wide"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              NEXUS - ALL IN ONE AGENT
            </span>
          </div>

          <h1
            className="text-5xl md:text-6xl font-black tracking-tight text-center"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Welcome Back
            <br />
            <span className="text-gray-800">Sign in to your workspace</span>
          </h1>

          <p
            className="text-lg leading-relaxed opacity-80 max-w-2xl mx-auto text-center"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Nexus One is an intelligent AI agent that revolutionizes company
            onboarding and streamlines your workflow through seamless
            integrations with Mail, GitHub, Notion, Jira, and other WorkOS
            applications.
          </p>
        </div>

        {/* Sign In Button */}
        <div className="flex flex-col gap-4 pt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 overflow-hidden w-full flex items-center justify-center"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Signing in..." : "Continue with Google"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/onboarding/company"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Create one for your company
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center gap-6 pt-4 justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Enterprise Ready
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              SOC 2 Compliant
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              GDPR Ready
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
