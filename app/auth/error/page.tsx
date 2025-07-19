"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthAccountNotLinked":
        return {
          title: "Account Already Exists",
          description:
            "An account with this email already exists. Please sign in using your existing account.",
          action: "Try signing in again",
        };
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "You do not have permission to access this application.",
          action: "Contact your administrator",
        };
      case "Verification":
        return {
          title: "Verification Failed",
          description: "The verification link is invalid or has expired.",
          action: "Request a new verification link",
        };
      default:
        return {
          title: "Authentication Error",
          description:
            "An error occurred during authentication. Please try again.",
          action: "Try again",
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Link href="/auth/signin" className="block">
              <Button className="w-full">{errorInfo.action}</Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>

          {error === "OAuthAccountNotLinked" && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> If you previously created an account with
                this email, try signing in again. The system will automatically
                link your Google account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
