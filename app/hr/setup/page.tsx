"use client";

import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Upload,
  FileText,
  Plus,
  Trash2,
  Save,
  Building2,
  Users,
  BookOpen,
  CheckCircle,
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

  const uploadPolicyFile = async (
    file: File
  ): Promise<{ url: string; fileId: string } | null> => {
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
  };

  const [standardPolicyFiles, setStandardPolicyFiles] = useState({
    handookUrl: null as File | null,
    codeOfConductUrl: null as File | null,
    privacyPolicyUrl: null as File | null,
    safePolicyUrl: null as File | null,
    benefitsUrl: null as File | null,
  });

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

      // Store both URL and fileId with proper field names
      setSettings((prev) => ({
        ...prev,
        onboarding: {
          ...prev.onboarding,
          policies: {
            ...prev.onboarding.policies,
            [field]: result.url, // Keep URL for display
            [`${field.replace("Url", "FileId")}`]: result.fileId, // Store fileId for GridFS
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
  // Authentication and authorization check
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
  }, [session, status, router]);
  useEffect(() => {
    // Prevent unnecessary re-renders when tab switching
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        session?.user &&
        ["hr_manager", "company_admin"].includes(session.user.role || "")
      ) {
        // Only reload if settings are empty (initial load)
        if (!settings.name && !settings.contactEmail) {
          loadSettings();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session, settings.name, settings.contactEmail]);

  useEffect(() => {
    if (
      session?.user &&
      ["hr_manager", "company_admin"].includes(session.user.role || "")
    ) {
      // Only load settings if they haven't been loaded yet
      if (!settings.name && !settings.contactEmail) {
        loadSettings();
      }
    }
  }, [session]);

  // Load company settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/company/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          // Ensure all values are properly initialized to avoid undefined to controlled input warnings
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
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    if (
      session?.user &&
      ["hr_manager", "company_admin"].includes(session.user.role || "")
    ) {
      loadSettings();
    }
  }, [session]);

  // Show loading state while checking authentication
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-white mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/70">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Company Setup</h1>
            <p className="text-slate-600">
              Configure your company details, onboarding process, and knowledge
              base
            </p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Company Details
            </CardTitle>
            <CardDescription>
              Basic information about your company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <Label htmlFor="domain">Company Domain</Label>
              <Input
                id="domain"
                value={settings.domain}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, domain: e.target.value }))
                }
                placeholder="yourcompany.com"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
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
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder="https://company.com"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
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
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
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
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Company address..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Welcome Message
            </CardTitle>
            <CardDescription>
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
            />
          </CardContent>
        </Card>

        {/* Company Policies */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Company Policies
            </CardTitle>
            <CardDescription>
              Upload and manage company policies and documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Standard Policies */}
            <div>
              <h4 className="font-semibold mb-3">Standard Policies</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Handbook */}
                <div>
                  <Label htmlFor="handbook">Employee Handbook (PDF)</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setStandardPolicyFiles((prev) => ({
                          ...prev,
                          handookUrl: e.target.files?.[0] || null,
                        }))
                      }
                      className="border rounded px-2 py-1"
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
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                  {settings.onboarding.policies.handookUrl ? (
                    <a
                      href={settings.onboarding.policies.handookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 underline mt-1 block"
                    >
                      ✓ View uploaded PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 mt-1 block">
                      No file uploaded yet
                    </span>
                  )}
                </div>
                {/* Code of Conduct */}
                <div>
                  <Label htmlFor="codeOfConduct">Code of Conduct (PDF)</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setStandardPolicyFiles((prev) => ({
                          ...prev,
                          codeOfConductUrl: e.target.files?.[0] || null,
                        }))
                      }
                      className="border rounded px-2 py-1"
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
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                  {settings.onboarding.policies.codeOfConductUrl ? (
                    <a
                      href={settings.onboarding.policies.codeOfConductUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 underline mt-1 block"
                    >
                      ✓ View uploaded PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 mt-1 block">
                      No file uploaded yet
                    </span>
                  )}
                </div>

                {/* Privacy Policy */}
                <div>
                  <Label htmlFor="privacyPolicy">Privacy Policy (PDF)</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setStandardPolicyFiles((prev) => ({
                          ...prev,
                          privacyPolicyUrl: e.target.files?.[0] || null,
                        }))
                      }
                      className="border rounded px-2 py-1"
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
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                  {settings.onboarding.policies.privacyPolicyUrl ? (
                    <a
                      href={settings.onboarding.policies.privacyPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 underline mt-1 block"
                    >
                      ✓ View uploaded PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 mt-1 block">
                      No file uploaded yet
                    </span>
                  )}
                </div>

                {/* Safety Policy */}
                <div>
                  <Label htmlFor="safePolicy">Safety Policy (PDF)</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setStandardPolicyFiles((prev) => ({
                          ...prev,
                          safePolicyUrl: e.target.files?.[0] || null,
                        }))
                      }
                      className="border rounded px-2 py-1"
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
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                  {settings.onboarding.policies.safePolicyUrl ? (
                    <a
                      href={settings.onboarding.policies.safePolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 underline mt-1 block"
                    >
                      ✓ View uploaded PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 mt-1 block">
                      No file uploaded yet
                    </span>
                  )}
                </div>

                {/* Benefits Information */}
                <div>
                  <Label htmlFor="benefits">Benefits Information (PDF)</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setStandardPolicyFiles((prev) => ({
                          ...prev,
                          benefitsUrl: e.target.files?.[0] || null,
                        }))
                      }
                      className="border rounded px-2 py-1"
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
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                  {settings.onboarding.policies.benefitsUrl ? (
                    <a
                      href={settings.onboarding.policies.benefitsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 underline mt-1 block"
                    >
                      ✓ View uploaded PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 mt-1 block">
                      No file uploaded yet
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Policies */}
            <div>
              <h4 className="font-semibold mb-3">Custom Policies</h4>

              {/* Add new policy form */}
              <div className="border rounded-lg p-4 mb-4 bg-slate-50">
                <h5 className="font-medium mb-3">Add New Policy</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={newPolicy.name}
                    onChange={(e) =>
                      setNewPolicy((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Policy name"
                  />
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
                    className="border rounded px-2 py-1"
                  />
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
                    />
                    <Label htmlFor="policyRequired" className="text-sm">
                      Required
                    </Label>
                    <Button onClick={addPolicy} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {policyFile && (
                  <div className="text-xs text-slate-600 mt-2">
                    Selected file: {policyFile.name}
                  </div>
                )}
              </div>

              {/* Policy list */}
              <div className="space-y-2">
                {settings.onboarding.policies.customPolicies.map(
                  (policy, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{policy.name}</span>
                          {policy.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{policy.url}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePolicy(index)}
                        className="text-red-600 hover:text-red-700"
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Onboarding Tasks
            </CardTitle>
            <CardDescription>
              Define tasks that new employees need to complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new task form */}
            <div className="border rounded-lg p-4 bg-slate-50">
              <h5 className="font-medium mb-3">Add New Task</h5>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Task title"
                  />
                  <select
                    value={newTask.category}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    className="px-3 py-2 border border-slate-300 rounded-md"
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
                    />
                    <Label htmlFor="taskRequired" className="text-sm">
                      Required
                    </Label>
                  </div>
                  <Button onClick={addTask}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </Button>
                </div>
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-2">
              {settings.onboarding.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{task.title}</span>
                      {task.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {task.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTask(task.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Knowledge base for new employees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new FAQ form */}
            <div className="border rounded-lg p-4 bg-slate-50">
              <h5 className="font-medium mb-3">Add New FAQ</h5>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={newFAQ.question}
                    onChange={(e) =>
                      setNewFAQ((prev) => ({
                        ...prev,
                        question: e.target.value,
                      }))
                    }
                    placeholder="Question"
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
                  />
                </div>
                <Textarea
                  value={newFAQ.answer}
                  onChange={(e) =>
                    setNewFAQ((prev) => ({ ...prev, answer: e.target.value }))
                  }
                  placeholder="Answer..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={addFAQ}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add FAQ
                  </Button>
                </div>
              </div>
            </div>

            {/* FAQ list */}
            <div className="space-y-2">
              {settings.onboarding.faq.map((faq, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{faq.question}</span>
                        {faq.category && (
                          <Badge variant="outline" className="text-xs">
                            {faq.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{faq.answer}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFAQ(index)}
                      className="text-red-600 hover:text-red-700"
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
    </div>
  );
}
