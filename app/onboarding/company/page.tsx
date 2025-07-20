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
import { useState, useEffect } from "react";

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        console.log("API Response:", result);

        if (response.ok) {
          const { companyId, refresh } = result;

          if (refresh) {
            console.log("Company created, refreshing session...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            window.location.href = "/dashboard";
          } else {
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
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Company Information
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                Tell us about your company to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Company Name *
                </label>
                <Input
                  placeholder="Acme Corporation"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
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
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                />
                <p
                  className="text-sm text-gray-500 mt-2"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  This will be used for your unique workspace URL
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Contact Email *
                </label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    handleInputChange("contactEmail", e.target.value)
                  }
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Phone Number
                </label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    handleInputChange("contactPhone", e.target.value)
                  }
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Customize Your Workspace
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                Upload your logo and set your brand colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 mx-auto flex items-center justify-center mb-6 hover:border-gray-400 transition-colors duration-300">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <Button
                  variant="outline"
                  className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Upload Company Logo
                </Button>
                <p
                  className="text-sm text-gray-500 mt-3"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Recommended: 200x200px, PNG or JPG
                </p>
              </div>
              <div>
                <label
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Primary Brand Color
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl border border-gray-300 shadow-sm"></div>
                  <Input
                    type="text"
                    value="#0E0E0E"
                    className="bg-white border-gray-300 text-gray-900 flex-1 h-12 px-4 rounded-xl"
                    readOnly
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Review & Create
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                Review your company information before creating your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span
                    className="text-gray-600 font-medium"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    Company Name:
                  </span>
                  <span
                    className="text-gray-900 font-semibold"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {formData.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className="text-gray-600 font-medium"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    Domain:
                  </span>
                  <span
                    className="text-gray-900 font-semibold"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {formData.domain}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className="text-gray-600 font-medium"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    Contact Email:
                  </span>
                  <span
                    className="text-gray-900 font-semibold"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {formData.contactEmail}
                  </span>
                </div>
                {formData.contactPhone && (
                  <div className="flex justify-between items-center">
                    <span
                      className="text-gray-600 font-medium"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      Phone:
                    </span>
                    <span
                      className="text-gray-900 font-semibold"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {formData.contactPhone}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 text-gray-900 mb-4">
                  <CheckCircle className="h-6 w-6" />
                  <span
                    className="font-semibold text-lg"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    What happens next?
                  </span>
                </div>
                <ul
                  className="text-gray-700 space-y-2"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                    Your company workspace will be created
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                    You'll be set as the company administrator
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                    You can start inviting HR managers and employees
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                    Begin setting up your onboarding workflows
                  </li>
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center gap-2 text-[#0E0E0E]">
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
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  NexusOne
                </span>
              </div>
            </Link>
            <div
              className="text-gray-600 font-medium"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Step {step} of 3
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`max-w-3xl mx-auto px-6 lg:px-8 py-16 relative z-10 transform transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Header Section */}
        <div className="text-center mb-16 space-y-8">
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
              NEXUS - COMPANY SETUP
            </span>
          </div>

          <h1
            className="text-6xl font-black tracking-tight"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Welcome to <span className="text-gray-800">Nexus</span>
          </h1>

          <p
            className="text-xl leading-relaxed text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Let's set up your company workspace in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-gray-600 font-medium"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Progress
            </span>
            <span
              className="text-gray-600 font-medium"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {Math.round((step / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-black h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Step */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <Button
            onClick={() => (step > 1 ? setStep(step - 1) : router.push("/"))}
            className="group px-8 py-4 border-2 border-gray-300 font-semibold rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-300 bg-white"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            {step === 1 ? "Back to Home" : "Previous"}
          </Button>

          <Button
            onClick={handleNextStep}
            disabled={isLoading}
            className="group relative px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 min-w-40 overflow-hidden"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                "Creating..."
              ) : step === 3 ? (
                "Create Workspace"
              ) : (
                <>
                  Next{" "}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </Button>
        </div>
      </main>
    </div>
  );
}
