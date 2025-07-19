"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, ArrowRight, Upload, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CompanyFormData {
  name: string;
  domain: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export default function CompanyOnboarding() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    domain: "",
    contactEmail: session?.user?.email || "",
    contactPhone: "",
    address: "",
  });

  // Debug session
  console.log("Session data:", session);

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = async () => {
    if (step === 1) {
      // Validate basic info
      if (!formData.name || !formData.domain || !formData.contactEmail) {
        alert("Please fill in all required fields");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Submit company creation
      setIsLoading(true);
      try {
        console.log("Sending data:", formData);

        const response = await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData), // Remove userEmail from the body
        });

        const result = await response.json();
        console.log("API Response:", result);

        if (response.ok) {
          const { companyId, refresh } = result;

          if (refresh) {
            // Company created successfully, force session refresh
            console.log("Company created, refreshing session...");

            // Add a small delay to ensure database consistency
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Force a full page reload to refresh the session
            window.location.href = "/dashboard";
          } else {
            // Fallback to normal redirect
            router.push("/dashboard");
          }
        } else {
          throw new Error(result.error || "Failed to create company");
        }
      } catch (error) {
        console.error("Error creating company:", error);
        alert("Failed to create company. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Company Information</CardTitle>
              <CardDescription className="text-white/70">
                Tell us about your company to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Company Name *
                </label>
                <Input
                  placeholder="Acme Corporation"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Company Domain *
                </label>
                <Input
                  placeholder="acme-corp"
                  value={formData.domain}
                  onChange={(e) =>
                    handleInputChange(
                      "domain",
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <p className="text-xs text-white/60 mt-1">
                  This will be used for your unique workspace URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Contact Email *
                </label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    handleInputChange("contactEmail", e.target.value)
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone Number
                </label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    handleInputChange("contactPhone", e.target.value)
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">
                Customize Your Workspace
              </CardTitle>
              <CardDescription className="text-white/70">
                Upload your logo and set your brand colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="w-32 h-32 bg-white/10 rounded-lg border-2 border-dashed border-white/30 mx-auto flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-white/60" />
                </div>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Upload Company Logo
                </Button>
                <p className="text-xs text-white/60 mt-2">
                  Recommended: 200x200px, PNG or JPG
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Primary Brand Color
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg border border-white/20"></div>
                  <Input
                    type="text"
                    value="#3b82f6"
                    className="bg-white/10 border-white/20 text-white flex-1"
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Review & Create</CardTitle>
              <CardDescription className="text-white/70">
                Review your company information before creating your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Company Name:</span>
                  <span className="text-white font-medium">
                    {formData.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Domain:</span>
                  <span className="text-white font-medium">
                    {formData.domain}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Contact Email:</span>
                  <span className="text-white font-medium">
                    {formData.contactEmail}
                  </span>
                </div>
                {formData.contactPhone && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Phone:</span>
                    <span className="text-white font-medium">
                      {formData.contactPhone}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-200 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">What happens next?</span>
                </div>
                <ul className="text-sm text-blue-200/80 space-y-1">
                  <li>• Your company workspace will be created</li>
                  <li>• You'll be set as the company administrator</li>
                  <li>• You can start inviting HR managers and employees</li>
                  <li>• Begin setting up your onboarding workflows</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">NexusOne</span>
            </Link>
            <div className="text-white/60 text-sm">Step {step} of 3</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to NexusOne
          </h1>
          <p className="text-xl text-white/80">
            Let's set up your company workspace in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Progress</span>
            <span className="text-white/70 text-sm">
              {Math.round((step / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Step */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => (step > 1 ? setStep(step - 1) : router.push("/"))}
            className="text-white hover:bg-white/10"
          >
            {step === 1 ? "Back to Home" : "Previous"}
          </Button>

          <Button
            onClick={handleNextStep}
            disabled={isLoading}
            variant="gradient"
            className="min-w-32"
          >
            {isLoading ? (
              "Creating..."
            ) : step === 3 ? (
              "Create Workspace"
            ) : (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
