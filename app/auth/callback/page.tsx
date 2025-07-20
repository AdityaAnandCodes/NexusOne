"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle } from "lucide-react";

export default function AuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
    <div className="min-h-screen bg-white flex items-center justify-center px-8 py-12 overflow-hidden">
      {/* Subtle background pattern - commented out like in HeroSection */}
      {/* <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gray-900 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-600 rounded-full blur-3xl"></div>
      </div> */}

      <div
        className={`text-center space-y-8 relative z-10 transform transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
          <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
          <span
            className="text-sm font-semibold tracking-wide"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            NEXUS - AUTHENTICATION
          </span>
        </div>

        {/* Main Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <Building2
              className="h-16 w-16 mx-auto animate-pulse"
              style={{ color: "#0E0E0E" }}
            />
            <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-20"></div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h1
            className="text-4xl md:text-5xl font-black tracking-tight"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            {isChecking ? "Setting up your" : "Welcome to"}
            <br />
            <span className="text-gray-800">
              {isChecking ? "workspace" : "Nexus"}
            </span>
          </h1>

          <p
            className="text-lg leading-relaxed opacity-80 max-w-md mx-auto"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            {isChecking
              ? "Please wait while we prepare your personalized experience"
              : "Taking you to your workspace"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: isChecking ? "60%" : "100%",
                  animation: isChecking ? "pulse 2s infinite" : "none",
                }}
              ></div>
            </div>
          </div>

          {/* Status Items */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-gray-700" />
              <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                Authentication Complete
              </span>
            </div>

            {isChecking && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                  Configuring Workspace
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
