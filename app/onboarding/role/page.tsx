"use client";

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, ArrowRight, UserPlus } from "lucide-react";

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState<
    "checking" | "invited" | "not-invited"
  >("checking");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleRoleSelection = async (role: "hr" | "employee" | "applicant") => {
    setLoading(true);

    try {
      const response = await fetch("/api/user/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Set role response:", data);

        // Redirect based on role
        if (role === "hr") {
          router.push("/onboarding/company");
        } else if (role === "employee") {
          if (data.hasCompany) {
            router.push("/onboarding");
          } else {
            router.push("/onboarding");
          }
        } else if (role === "applicant") {
          // Redirect to public application page
          router.push("/apply");
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to set user role:", errorData);
        alert(errorData.error || "Failed to set role");
      }
    } catch (error) {
      console.error("Error setting user role:", error);
      alert("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        const response = await fetch("/api/user/invitation-status");
        const data = await response.json();
        setInvitationStatus(data.hasInvitation ? "invited" : "not-invited");
      } catch (error) {
        setInvitationStatus("not-invited");
      }
    };

    if (session?.user?.email) {
      checkInvitation();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Please sign in first</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 overflow-hidden">
      <div
        className={`w-full max-w-6xl relative z-10 transform transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Header Section */}
        <div className="text-center mb-12 space-y-6">
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
              NEXUS - ROLE SELECTION
            </span>
          </div>

          <h1
            className="text-5xl font-black tracking-tight"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Welcome to <span className="text-gray-800">Nexus</span>
          </h1>

          <p
            className="text-xl leading-relaxed opacity-80 max-w-2xl mx-auto"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Let's get you set up. How would you like to use Nexus?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* HR Role Card */}
          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-gray-400 bg-white rounded-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                <Building2 className="w-8 h-8" style={{ color: "#0E0E0E" }} />
              </div>
              <CardTitle
                className="text-xl font-semibold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                I'm an HR Manager
              </CardTitle>
              <CardDescription
                className="text-base opacity-80"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Register your company and manage employees
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul
                className="text-sm opacity-80 mb-6 space-y-2 min-h-[120px]"
                style={{
                  color: "#0E0E0E",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                <li>• Create and manage your company profile</li>
                <li>• Invite and manage employees</li>
                <li>• Set up departments and roles</li>
                <li>• Access HR dashboard and analytics</li>
                <li>• Review job applications and resumes</li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("hr")}
                disabled={loading}
                className="group relative w-full bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 overflow-hidden"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started as HR
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
            </CardContent>
          </Card>

          {/* Employee Role Card */}
          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-gray-400 bg-white rounded-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                <Users className="w-8 h-8" style={{ color: "#0E0E0E" }} />
              </div>
              <CardTitle
                className="text-xl font-semibold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                I'm an Employee
              </CardTitle>
              <CardDescription
                className="text-base opacity-80"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Join your company's workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul
                className="text-sm opacity-80 mb-6 space-y-2 min-h-[120px]"
                style={{
                  color: "#0E0E0E",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                <li>• Join your company's workspace</li>
                <li>• Access company resources and tools</li>
                <li>• Complete onboarding process</li>
                <li>• View company policies and documents</li>
                <li>• Connect with your team members</li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("employee")}
                disabled={loading}
                className="group relative w-full border-2 font-semibold rounded-xl transition-all duration-300 border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                  backgroundColor: "white",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  Join as Employee
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Applicant Role Card */}
          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-gray-400 bg-white rounded-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle
                className="text-xl font-semibold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                I'm an Applicant
              </CardTitle>
              <CardDescription
                className="text-base opacity-80"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Apply for job opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul
                className="text-sm opacity-80 mb-6 space-y-2 min-h-[120px]"
                style={{
                  color: "#0E0E0E",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                <li>• Submit your resume and application</li>
                <li>• Apply for open positions</li>
                <li>• Track your application status</li>
                <li>• Upload cover letters and documents</li>
                <li>• Get notified about opportunities</li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("applicant")}
                disabled={loading}
                className="group relative w-full bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 overflow-hidden"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Apply for Jobs
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Don't worry, you can change this later in your profile settings
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
