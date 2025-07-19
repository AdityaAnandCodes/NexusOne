"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

export default function AuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user?.email) {
      checkUserCompany();
    }
  }, [session, status, router]);

  const checkUserCompany = async () => {
    if (!session?.user?.email) return;

    try {
      setIsChecking(true);

      // Wait a moment for session to be fully established
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user already belongs to a company
      const response = await fetch("/api/user/company-status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for session
      });

      if (response.ok) {
        const data = await response.json();

        if (data.hasCompany) {
          // User already has a company, redirect to dashboard
          router.push("/dashboard");
        } else {
          // User needs to select role first, then create or join a company
          router.push("/onboarding/role");
        }
      } else {
        console.log("API response not ok:", response.status);
        // If API call fails, redirect to role selection
        router.push("/onboarding/role");
      }
    } catch (error) {
      console.error("Error checking user company status:", error);
      // If error occurs, redirect to role selection
      router.push("/onboarding/role");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <Building2 className="h-16 w-16 text-white mx-auto mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-white mb-2">
          {isChecking ? "Setting up your account..." : "Redirecting..."}
        </h1>
        <p className="text-white/70">
          {isChecking
            ? "Please wait while we prepare your experience"
            : "Taking you to your workspace"}
        </p>
      </div>
    </div>
  );
}
