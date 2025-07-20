"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  FileText,
  CheckCircle,
  BookOpen,
  Save,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface Policy {
  name: string;
  url: string;
  fileId?: string;
  required: boolean;
  uploadedAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  required: boolean;
  order: number;
  category: "documentation" | "setup" | "training" | "compliance";
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

interface CompanySettings {
  name: string;
  domain: string;
  description: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  onboarding: {
    welcomeMessage: string;
    policies: {
      handookUrl: string;
      codeOfConductUrl: string;
      privacyPolicyUrl: string;
      safePolicyUrl: string;
      benefitsUrl: string;
      customPolicies: Policy[];
    };
    tasks: Task[];
    faq: FAQ[];
  };
}

export default function CompanySetup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>({
    name: "",
    domain: "",
    description: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    onboarding: {
      welcomeMessage: "",
      policies: {
        handookUrl: "",
        codeOfConductUrl: "",
        privacyPolicyUrl: "",
        safePolicyUrl: "",
        benefitsUrl: "",
        customPolicies: [],
      },
      tasks: [],
      faq: [],
    },
  });

  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    required: false,
    order: 0,
    category: "documentation",
  });

  const [newFAQ, setNewFAQ] = useState<FAQ>({
    question: "",
    answer: "",
    category: "",
  });

  const [newPolicy, setNewPolicy] = useState<Omit<Policy, "uploadedAt">>({
    name: "",
    url: "",
    required: false,
  });

  const [policyFile, setPolicyFile] = useState<File | null>(null);

  const [standardPolicyFiles, setStandardPolicyFiles] = useState({
    handookUrl: null as File | null,
    codeOfConductUrl: null as File | null,
    privacyPolicyUrl: null as File | null,
    safePolicyUrl: null as File | null,
    benefitsUrl: null as File | null,
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Memoized upload function to prevent re-creation on every render
  const uploadPolicyFile = useCallback(
    async (file: File): Promise<{ url: string; fileId: string } | null> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/company/policy-upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return { url: data.url, fileId: data.fileId };
      }
      return null;
    },
    []
  );

  // Memoized load settings function
  const loadSettings = useCallback(async () => {
    if (initialized) return; // Prevent multiple loads

    try {
      setLoading(true);
      const response = await fetch("/api/company/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          setSettings({
            name: data.company.name || "",
            domain: data.company.domain || "",
            description: data.company.description || "",
            website: data.company.website || "",
            contactEmail: data.company.contactEmail || "",
            contactPhone: data.company.contactPhone || "",
            address: data.company.address || "",
            onboarding: {
              welcomeMessage: data.company.onboarding?.welcomeMessage || "",
              policies: {
                handookUrl: data.company.onboarding?.policies?.handookUrl || "",
                codeOfConductUrl:
                  data.company.onboarding?.policies?.codeOfConductUrl || "",
                privacyPolicyUrl:
                  data.company.onboarding?.policies?.privacyPolicyUrl || "",
                safePolicyUrl:
                  data.company.onboarding?.policies?.safePolicyUrl || "",
                benefitsUrl:
                  data.company.onboarding?.policies?.benefitsUrl || "",
                customPolicies:
                  data.company.onboarding?.policies?.customPolicies || [],
              },
              tasks: data.company.onboarding?.tasks || [],
              faq: data.company.onboarding?.faq || [],
            },
          });
        }
        setInitialized(true);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  // Authentication and authorization check - only run once
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Check if user has admin role
    if (
      session?.user &&
      !["hr_manager", "company_admin"].includes(session.user.role || "")
    ) {
      router.push("/dashboard");
      return;
    }

    // Load settings only once when properly authenticated
    if (
      session?.user &&
      ["hr_manager", "company_admin"].includes(session.user.role || "") &&
      !initialized
    ) {
      loadSettings();
    }
  }, [session, status, router, initialized, loadSettings]);

  // Helper to handle file upload for standard policies
  const handleStandardPolicyUpload = async (
    field: keyof typeof standardPolicyFiles,
    file: File | null
  ) => {
    if (!file) return;

    try {
      const result = await uploadPolicyFile(file);
      if (!result) {
        alert("Failed to upload PDF");
        return;
      }

      setSettings((prev) => ({
        ...prev,
        onboarding: {
          ...prev.onboarding,
          policies: {
            ...prev.onboarding.policies,
            [field]: result.url,
            [`${field.replace("Url", "FileId")}`]: result.fileId,
          },
        },
      }));

      setStandardPolicyFiles((prev) => ({
        ...prev,
        [field]: null,
      }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload PDF");
    }
  };

  // Save company settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/company/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Settings saved successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Add new task
  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      order: settings.onboarding.tasks.length,
    };

    setSettings((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        tasks: [...prev.onboarding.tasks, task],
      },
    }));

    setNewTask({
      title: "",
      description: "",
      required: false,
      order: 0,
      category: "documentation",
    });
  };

  // Remove task
  const removeTask = (taskId: string) => {
    setSettings((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        tasks: prev.onboarding.tasks.filter((task) => task.id !== taskId),
      },
    }));
  };

  // Add new FAQ
  const addFAQ = () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) return;

    setSettings((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        faq: [...prev.onboarding.faq, newFAQ],
      },
    }));

    setNewFAQ({
      question: "",
      answer: "",
      category: "",
    });
  };

  // Remove FAQ
  const removeFAQ = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        faq: prev.onboarding.faq.filter((_, i) => i !== index),
      },
    }));
  };

  // Add custom policy
  const addPolicy = async () => {
    if (!newPolicy.name.trim() || !policyFile) return;

    const uploadResult = await uploadPolicyFile(policyFile);
    if (!uploadResult) {
      alert("Failed to upload PDF");
      return;
    }

    const policy: Policy = {
      ...newPolicy,
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      uploadedAt: new Date().toISOString(),
    };

    setSettings((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        policies: {
          ...prev.onboarding.policies,
          customPolicies: [...prev.onboarding.policies.customPolicies, policy],
        },
      },
    }));

    setNewPolicy({
      name: "",
      url: "",
      required: false,
    });
    setPolicyFile(null);
  };

  // Remove custom policy
  const removePolicy = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        policies: {
          ...prev.onboarding.policies,
          customPolicies: prev.onboarding.policies.customPolicies.filter(
            (_, i) => i !== index
          ),
        },
      },
    }));
  };

  // Show loading state while checking authentication
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (
    !session?.user ||
    !["hr_manager", "company_admin"].includes(session.user.role || "")
  ) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Access Denied
          </h1>
          <p
            className="text-gray-600"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3 text-[#0E0E0E]">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`max-w-7xl mx-auto px-6 lg:px-8 py-12 transform transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200 mb-6">
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

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1
                className="text-5xl font-black tracking-tight mb-4"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Company <span className="text-gray-800">Setup</span>
              </h1>
              <p
                className="text-xl text-gray-600"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                Configure your company details, onboarding process, and
                knowledge base
              </p>
            </div>
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="group relative px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 overflow-hidden"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Company Details */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="flex items-center text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <Building2 className="w-6 h-6 mr-3 text-slate-700" />
                Company Details
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Basic information about your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label
                  htmlFor="name"
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Company Name *
                </Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Acme Corporation"
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="domain"
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Company Domain
                </Label>
                <Input
                  id="domain"
                  value={settings.domain}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, domain: e.target.value }))
                  }
                  placeholder="yourcompany.com"
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="description"
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of your company..."
                  rows={3}
                  className="px-4 py-3 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300 resize-none"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="website"
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Website
                </Label>
                <Input
                  id="website"
                  value={settings.website}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://company.com"
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="contactEmail"
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Contact Email *
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  placeholder="contact@company.com"
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="contactPhone"
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Contact Phone
                </Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      contactPhone: e.target.value,
                    }))
                  }
                  placeholder="+1234567890"
                  className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="address"
                  className="block text-sm font-semibold mb-3"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Company address..."
                  rows={2}
                  className="px-4 py-3 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300 resize-none"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Welcome Message */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="flex items-center text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <Users className="w-6 h-6 mr-3 text-slate-700" />
                Welcome Message
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Message shown to new employees during onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.onboarding.welcomeMessage}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    onboarding: {
                      ...prev.onboarding,
                      welcomeMessage: e.target.value,
                    },
                  }))
                }
                placeholder="Welcome to our company! We're excited to have you join our team..."
                rows={6}
                className="px-4 py-3 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300 resize-none"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              />
            </CardContent>
          </Card>

          {/* Company Policies */}
          <Card className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="flex items-center text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <FileText className="w-6 h-6 mr-3 text-slate-700" />
                Company Policies
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Upload and manage company policies and documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Standard Policies */}
              <div>
                <h4
                  className="font-bold text-lg mb-4"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Standard Policies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee Handbook */}
                  <div>
                    <Label
                      htmlFor="handbook"
                      className="block text-sm font-semibold mb-3"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Employee Handbook (PDF)
                    </Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setStandardPolicyFiles((prev) => ({
                            ...prev,
                            handookUrl: e.target.files?.[0] || null,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        key={`handbook-${
                          settings.onboarding.policies.handookUrl
                            ? "uploaded"
                            : "empty"
                        }`}
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStandardPolicyUpload(
                            "handookUrl",
                            standardPolicyFiles.handookUrl
                          )
                        }
                        disabled={!standardPolicyFiles.handookUrl}
                        className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    {settings.onboarding.policies.handookUrl ? (
                      <a
                        href={settings.onboarding.policies.handookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-700 underline mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        ✓ View uploaded PDF
                      </a>
                    ) : (
                      <span
                        className="text-sm text-gray-500 mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        No file uploaded yet
                      </span>
                    )}
                  </div>

                  {/* Code of Conduct */}
                  <div>
                    <Label
                      htmlFor="codeOfConduct"
                      className="block text-sm font-semibold mb-3"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Code of Conduct (PDF)
                    </Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setStandardPolicyFiles((prev) => ({
                            ...prev,
                            codeOfConductUrl: e.target.files?.[0] || null,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        key={`codeOfConduct-${
                          settings.onboarding.policies.codeOfConductUrl
                            ? "uploaded"
                            : "empty"
                        }`}
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStandardPolicyUpload(
                            "codeOfConductUrl",
                            standardPolicyFiles.codeOfConductUrl
                          )
                        }
                        disabled={!standardPolicyFiles.codeOfConductUrl}
                        className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    {settings.onboarding.policies.codeOfConductUrl ? (
                      <a
                        href={settings.onboarding.policies.codeOfConductUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-700 underline mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        ✓ View uploaded PDF
                      </a>
                    ) : (
                      <span
                        className="text-sm text-gray-500 mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        No file uploaded yet
                      </span>
                    )}
                  </div>

                  {/* Privacy Policy */}
                  <div>
                    <Label
                      htmlFor="privacyPolicy"
                      className="block text-sm font-semibold mb-3"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Privacy Policy (PDF)
                    </Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setStandardPolicyFiles((prev) => ({
                            ...prev,
                            privacyPolicyUrl: e.target.files?.[0] || null,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        key={`privacyPolicy-${
                          settings.onboarding.policies.privacyPolicyUrl
                            ? "uploaded"
                            : "empty"
                        }`}
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStandardPolicyUpload(
                            "privacyPolicyUrl",
                            standardPolicyFiles.privacyPolicyUrl
                          )
                        }
                        disabled={!standardPolicyFiles.privacyPolicyUrl}
                        className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    {settings.onboarding.policies.privacyPolicyUrl ? (
                      <a
                        href={settings.onboarding.policies.privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-700 underline mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        ✓ View uploaded PDF
                      </a>
                    ) : (
                      <span
                        className="text-sm text-gray-500 mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        No file uploaded yet
                      </span>
                    )}
                  </div>

                  {/* Safety Policy */}
                  <div>
                    <Label
                      htmlFor="safePolicy"
                      className="block text-sm font-semibold mb-3"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Safety Policy (PDF)
                    </Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setStandardPolicyFiles((prev) => ({
                            ...prev,
                            safePolicyUrl: e.target.files?.[0] || null,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        key={`safePolicy-${
                          settings.onboarding.policies.safePolicyUrl
                            ? "uploaded"
                            : "empty"
                        }`}
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStandardPolicyUpload(
                            "safePolicyUrl",
                            standardPolicyFiles.safePolicyUrl
                          )
                        }
                        disabled={!standardPolicyFiles.safePolicyUrl}
                        className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    {settings.onboarding.policies.safePolicyUrl ? (
                      <a
                        href={settings.onboarding.policies.safePolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-700 underline mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        ✓ View uploaded PDF
                      </a>
                    ) : (
                      <span
                        className="text-sm text-gray-500 mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        No file uploaded yet
                      </span>
                    )}
                  </div>

                  {/* Benefits Information */}
                  <div>
                    <Label
                      htmlFor="benefits"
                      className="block text-sm font-semibold mb-3"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Benefits Information (PDF)
                    </Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setStandardPolicyFiles((prev) => ({
                            ...prev,
                            benefitsUrl: e.target.files?.[0] || null,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        key={`benefits-${
                          settings.onboarding.policies.benefitsUrl
                            ? "uploaded"
                            : "empty"
                        }`}
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStandardPolicyUpload(
                            "benefitsUrl",
                            standardPolicyFiles.benefitsUrl
                          )
                        }
                        disabled={!standardPolicyFiles.benefitsUrl}
                        className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    {settings.onboarding.policies.benefitsUrl ? (
                      <a
                        href={settings.onboarding.policies.benefitsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-700 underline mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        ✓ View uploaded PDF
                      </a>
                    ) : (
                      <span
                        className="text-sm text-gray-500 mt-2 block"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        No file uploaded yet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Policies */}
              <div>
                <h4
                  className="font-bold text-lg mb-4"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Custom Policies
                </h4>

                {/* Add new policy form */}
                <div className="border border-gray-200 rounded-xl p-6 mb-6 bg-gray-50">
                  <h5
                    className="font-semibold mb-4"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    Add New Policy
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      value={newPolicy.name}
                      onChange={(e) =>
                        setNewPolicy((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Policy name"
                      className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setPolicyFile(e.target.files?.[0] || null)
                      }
                      className="px-3 py-3 border border-gray-300 rounded-xl text-sm"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    />
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="policyRequired"
                          checked={newPolicy.required}
                          onChange={(e) =>
                            setNewPolicy((prev) => ({
                              ...prev,
                              required: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-gray-900"
                        />
                        <Label
                          htmlFor="policyRequired"
                          className="text-sm font-medium"
                          style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                            color: "#0E0E0E",
                          }}
                        >
                          Required
                        </Label>
                      </div>
                      <Button
                        onClick={addPolicy}
                        disabled={!newPolicy.name.trim() || !policyFile}
                        className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                  {policyFile && (
                    <div
                      className="text-sm text-gray-600 mt-3"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      Selected file: {policyFile.name}
                    </div>
                  )}
                </div>

                {/* Policy list */}
                <div className="space-y-3">
                  {settings.onboarding.policies.customPolicies.map(
                    (policy, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors duration-300"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span
                              className="font-semibold"
                              style={{
                                fontFamily: "Inter, system-ui, sans-serif",
                                color: "#0E0E0E",
                              }}
                            >
                              {policy.name}
                            </span>
                            {policy.required && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gray-200 text-gray-800"
                                style={{
                                  fontFamily: "Inter, system-ui, sans-serif",
                                }}
                              >
                                Required
                              </Badge>
                            )}
                          </div>
                          <p
                            className="text-sm text-gray-600"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                            }}
                          >
                            {policy.url}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePolicy(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Tasks */}
          <Card className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="flex items-center text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <CheckCircle className="w-6 h-6 mr-3 text-slate-700" />
                Onboarding Tasks
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Define tasks that new employees need to complete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add new task form */}
              <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                <h5
                  className="font-semibold mb-4"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Add New Task
                </h5>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Task title"
                      className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    />
                    <select
                      value={newTask.category}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          category: e.target.value as any,
                        }))
                      }
                      className="h-12 px-4 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      <option value="documentation">Documentation</option>
                      <option value="setup">Setup</option>
                      <option value="training">Training</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Task description..."
                    rows={2}
                    className="px-4 py-3 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300 resize-none"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="taskRequired"
                        checked={newTask.required}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            required: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-gray-900"
                      />
                      <Label
                        htmlFor="taskRequired"
                        className="text-sm font-medium"
                        style={{
                          fontFamily: "Inter, system-ui, sans-serif",
                          color: "#0E0E0E",
                        }}
                      >
                        Required
                      </Label>
                    </div>
                    <Button
                      onClick={addTask}
                      disabled={!newTask.title.trim()}
                      className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>
              </div>

              {/* Task list */}
              <div className="space-y-3">
                {settings.onboarding.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors duration-300"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className="font-semibold"
                          style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                            color: "#0E0E0E",
                          }}
                        >
                          {task.title}
                        </span>
                        {task.required && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-gray-200 text-gray-800"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                            }}
                          >
                            Required
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-300 text-gray-700"
                          style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                          }}
                        >
                          {task.category}
                        </Badge>
                      </div>
                      <p
                        className="text-sm text-gray-600"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        {task.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(task.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="flex items-center text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                <BookOpen className="w-6 h-6 mr-3 text-slate-700" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription
                className="text-gray-600"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Knowledge base for new employees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add new FAQ form */}
              <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                <h5
                  className="font-semibold mb-4"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Add New FAQ
                </h5>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={newFAQ.question}
                      onChange={(e) =>
                        setNewFAQ((prev) => ({
                          ...prev,
                          question: e.target.value,
                        }))
                      }
                      placeholder="Question"
                      className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    />
                    <Input
                      value={newFAQ.category}
                      onChange={(e) =>
                        setNewFAQ((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      placeholder="Category (e.g., HR, IT, Benefits)"
                      className="h-12 px-4 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    />
                  </div>
                  <Textarea
                    value={newFAQ.answer}
                    onChange={(e) =>
                      setNewFAQ((prev) => ({ ...prev, answer: e.target.value }))
                    }
                    placeholder="Answer..."
                    rows={3}
                    className="px-4 py-3 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 transition-all duration-300 resize-none"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={addFAQ}
                      disabled={
                        !newFAQ.question.trim() || !newFAQ.answer.trim()
                      }
                      className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add FAQ
                    </Button>
                  </div>
                </div>
              </div>

              {/* FAQ list */}
              <div className="space-y-3">
                {settings.onboarding.faq.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span
                            className="font-semibold"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                              color: "#0E0E0E",
                            }}
                          >
                            {faq.question}
                          </span>
                          {faq.category && (
                            <Badge
                              variant="outline"
                              className="text-xs border-gray-300 text-gray-700"
                              style={{
                                fontFamily: "Inter, system-ui, sans-serif",
                              }}
                            >
                              {faq.category}
                            </Badge>
                          )}
                        </div>
                        <p
                          className="text-sm text-gray-600"
                          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        >
                          {faq.answer}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFAQ(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl ml-4"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
