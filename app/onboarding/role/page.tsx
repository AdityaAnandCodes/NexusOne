"use client";

import { useState } from "react";
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
import { Building2, Users, ArrowRight } from "lucide-react";

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleRoleSelection = async (role: "hr" | "employee") => {
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
        // Redirect based on role
        if (role === "hr") {
          router.push("/onboarding/company");
        } else {
          router.push("/onboarding/employee");
        }
      } else {
        console.error("Failed to set user role");
      }
    } catch (error) {
      console.error("Error setting user role:", error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome to NexusOne
          </h1>
          <p className="text-slate-600 text-lg">
            Let's get you set up. How would you like to use NexusOne?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* HR Role Card */}
          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-blue-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">I'm an HR Manager</CardTitle>
              <CardDescription className="text-base">
                Register your company and manage employees
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-slate-600 mb-6 space-y-2">
                <li>• Create and manage your company profile</li>
                <li>• Invite and manage employees</li>
                <li>• Set up departments and roles</li>
                <li>• Access HR dashboard and analytics</li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("hr")}
                disabled={loading}
                className="w-full group-hover:bg-blue-700 transition-colors"
              >
                Get Started as HR Manager
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Employee Role Card */}
          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-green-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">I'm an Employee</CardTitle>
              <CardDescription className="text-base">
                Join your company's workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-slate-600 mb-6 space-y-2">
                <li>• Join your company's workspace</li>
                <li>• Access company resources and tools</li>
                <li>• Connect with your team members</li>
                <li>• View your profile and settings</li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("employee")}
                disabled={loading}
                variant="outline"
                className="w-full group-hover:bg-green-50 group-hover:border-green-400 transition-colors"
              >
                Join as Employee
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            Don't worry, you can change this later in your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}
