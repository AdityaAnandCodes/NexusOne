"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Invitation {
  _id: string;
  email: string;
  phone?: string;
  skills?: string[];
  role: string;
  department?: string;
  position?: string;
  status: "pending" | "accepted" | "expired";
  invitedAt: string;
  acceptedAt?: string;
  generatedEmail?: string;
  temporaryPassword?: string;
  emailCredentialsGenerated?: boolean;
}

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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Mail,
  Users,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Upload,
  FileText,
  Brain,
} from "lucide-react";

export default function EmployeeManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [processingResume, setProcessingResume] = useState(false);
  const [resumeProcessed, setResumeProcessed] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    role: "employee",
    department: "",
    position: "",
  });

  // Authentication and authorization check
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Check if user has HR role
    if (
      session?.user &&
      !["hr_manager", "company_admin"].includes(session.user.role || "")
    ) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  // Load invitations
  const loadInvitations = async () => {
    try {
      const response = await fetch("/api/hr/employee-invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
    }
  };

  // Process resume with AI
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid resume file (PDF, DOC, DOCX, or TXT)");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setResumeFile(file);
    setProcessingResume(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("http://localhost:5000/api/process-resume", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Resume processed:", result);

        // Auto-fill the form with extracted data
        if (result.data) {
          setNewEmployee((prev) => ({
            ...prev,
            name: result.data.name || prev.name,
            email: result.data.email || prev.email,
            phone: result.data.phone || prev.phone,
            skills: Array.isArray(result.data.skills)
              ? result.data.skills.join(", ")
              : result.data.skills || prev.skills,
          }));
          setResumeProcessed(true);
        }
      } else {
        const error = await response.json();
        alert(`Resume processing failed: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Resume processing error:", error);
      alert(
        "Failed to process resume. Please check if the backend server is running."
      );
    } finally {
      setProcessingResume(false);
    }
  };

  // Reset form when closing
  const handleCloseForm = () => {
    setShowAddForm(false);
    setResumeFile(null);
    setResumeProcessed(false);
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      skills: "",
      role: "employee",
      department: "",
      position: "",
    });
  };

  // Add new employee invitation
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/hr/invite-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      });

      if (response.ok) {
        setNewEmployee({
          name: "",
          email: "",
          phone: "",
          skills: "",
          role: "employee",
          department: "",
          position: "",
        });
        handleCloseForm();
        loadInvitations();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to send invitation");
      }
    } catch (error) {
      alert("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete invitation
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return;

    try {
      const response = await fetch(
        `/api/hr/employee-invitations/${invitationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        loadInvitations();
      }
    } catch (error) {
      console.error("Error deleting invitation:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 border border-gray-200"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 border border-gray-200"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 border border-gray-200"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 border border-gray-200"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            {status}
          </Badge>
        );
    }
  };

  useEffect(() => {
    if (
      session?.user &&
      ["hr_manager", "company_admin"].includes(session.user.role || "")
    ) {
      loadInvitations();
    }
  }, [session]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-700 mx-auto mb-4 animate-pulse" />
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
          <XCircle className="h-16 w-16 text-gray-700 mx-auto mb-4" />
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
            className="opacity-80"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1
                className="text-3xl font-black tracking-tight"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Employee Management
              </h1>
              <p
                className="opacity-80"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Invite and manage your team members
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-700" />
                  <div>
                    <p
                      className="text-sm opacity-80"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Total Invited
                    </p>
                    <p
                      className="text-xl font-semibold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {invitations.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-gray-700" />
                  <div>
                    <p
                      className="text-sm opacity-80"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Accepted
                    </p>
                    <p
                      className="text-xl font-semibold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {
                        invitations.filter((i) => i.status === "accepted")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-700" />
                  <div>
                    <p
                      className="text-sm opacity-80"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Pending
                    </p>
                    <p
                      className="text-xl font-semibold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {invitations.filter((i) => i.status === "pending").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-gray-700" />
                  <div>
                    <p
                      className="text-sm opacity-80"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Expired
                    </p>
                    <p
                      className="text-xl font-semibold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {invitations.filter((i) => i.status === "expired").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Employee Form */}
        {showAddForm && (
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg mb-8">
            <CardHeader>
              <CardTitle
                className="font-semibold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Add New Employee
              </CardTitle>
              <CardDescription
                className="opacity-80"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                Upload a resume to auto-extract information or fill details
                manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Resume Upload Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Brain className="w-8 h-8 text-gray-700 mr-2" />
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      AI Resume Processing
                    </h3>
                  </div>

                  {!resumeFile ? (
                    <div>
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p
                        className="opacity-80 mb-4"
                        style={{
                          fontFamily: "Inter, system-ui, sans-serif",
                          color: "#0E0E0E",
                        }}
                      >
                        Upload a resume to automatically extract name, email,
                        phone, and skills
                      </p>
                      <label className="inline-flex items-center px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900 cursor-pointer transition-all duration-300">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Resume File
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                      </label>
                      <p
                        className="text-xs opacity-60 mt-2"
                        style={{
                          fontFamily: "Inter, system-ui, sans-serif",
                          color: "#0E0E0E",
                        }}
                      >
                        Supports PDF, DOC, DOCX, and TXT files (max 10MB)
                      </p>
                    </div>
                  ) : (
                    <div>
                      {processingResume ? (
                        <div>
                          <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-3"></div>
                          <p
                            className="font-medium"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                              color: "#0E0E0E",
                            }}
                          >
                            Processing resume with AI...
                          </p>
                          <p
                            className="text-sm opacity-80"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                              color: "#0E0E0E",
                            }}
                          >
                            Extracting name, email, phone, and skills
                          </p>
                        </div>
                      ) : (
                        <div>
                          <CheckCircle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                          <p
                            className="font-medium"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                              color: "#0E0E0E",
                            }}
                          >
                            Resume processed successfully!
                          </p>
                          <p
                            className="text-sm opacity-80 mb-3"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                              color: "#0E0E0E",
                            }}
                          >
                            File: {resumeFile.name}
                          </p>
                          {resumeProcessed && (
                            <div className="bg-gray-100 p-3 rounded-lg text-sm border border-gray-200">
                              <p
                                className="font-medium"
                                style={{
                                  fontFamily: "Inter, system-ui, sans-serif",
                                  color: "#0E0E0E",
                                }}
                              >
                                Auto-extracted information:
                              </p>
                              <div
                                className="mt-1 opacity-80"
                                style={{
                                  fontFamily: "Inter, system-ui, sans-serif",
                                  color: "#0E0E0E",
                                }}
                              >
                                {newEmployee.name && (
                                  <p>• Name: {newEmployee.name}</p>
                                )}
                                {newEmployee.email && (
                                  <p>• Email: {newEmployee.email}</p>
                                )}
                                {newEmployee.phone && (
                                  <p>• Phone: {newEmployee.phone}</p>
                                )}
                                {newEmployee.skills && (
                                  <p>• Skills: {newEmployee.skills}</p>
                                )}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setResumeFile(null);
                              setResumeProcessed(false);
                            }}
                            className="mt-3 text-gray-700 hover:text-gray-900 text-sm underline"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                            }}
                          >
                            Upload different resume
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="name"
                      className="flex items-center text-sm font-medium mb-2"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Employee Name *
                      {resumeProcessed && newEmployee.name && (
                        <span title="Auto-extracted from resume">
                          <Brain className="w-3 h-3 ml-1 text-gray-700" />
                        </span>
                      )}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={newEmployee.name}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className={`border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 ${
                        resumeProcessed && newEmployee.name
                          ? "bg-gray-50 border-gray-400"
                          : ""
                      }`}
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="email"
                      className="flex items-center text-sm font-medium mb-2"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Personal Email Address *
                      {resumeProcessed && newEmployee.email && (
                        <span title="Auto-extracted from resume">
                          <Brain className="w-3 h-3 ml-1 text-gray-700" />
                        </span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={newEmployee.email}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          email: e.target.value,
                        })
                      }
                      placeholder="john@personal.com"
                      className={`border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 ${
                        resumeProcessed && newEmployee.email
                          ? "bg-gray-50 border-gray-400"
                          : ""
                      }`}
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                    <p
                      className="text-xs opacity-60 mt-1"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      We'll create a company Gmail account and send credentials
                      here
                    </p>
                  </div>
                  <div>
                    <Label
                      htmlFor="phone"
                      className="flex items-center text-sm font-medium mb-2"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Phone Number
                      {resumeProcessed && newEmployee.phone && (
                        <span title="Auto-extracted from resume">
                          <Brain className="w-3 h-3 ml-1 text-gray-700" />
                        </span>
                      )}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newEmployee.phone}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+1234567890"
                      className={`border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 ${
                        resumeProcessed && newEmployee.phone
                          ? "bg-gray-50 border-gray-400"
                          : ""
                      }`}
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label
                      htmlFor="skills"
                      className="flex items-center text-sm font-medium mb-2"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Skills & Technologies
                      {resumeProcessed && newEmployee.skills && (
                        <span title="Auto-extracted from resume">
                          <Brain className="w-3 h-3 ml-1 text-gray-700" />
                        </span>
                      )}
                    </Label>
                    <Input
                      id="skills"
                      type="text"
                      value={newEmployee.skills}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          skills: e.target.value,
                        })
                      }
                      placeholder="JavaScript, React, Node.js, Project Management"
                      className={`border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900 ${
                        resumeProcessed && newEmployee.skills
                          ? "bg-gray-50 border-gray-400"
                          : ""
                      }`}
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                    <p
                      className="text-xs opacity-60 mt-1"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Separate multiple skills with commas
                    </p>
                  </div>
                  <div>
                    <Label
                      htmlFor="role"
                      className="text-sm font-medium mb-2 block"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Role
                    </Label>
                    <select
                      id="role"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                      value={newEmployee.role}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, role: e.target.value })
                      }
                    >
                      <option value="employee">Employee</option>
                      <option value="hr_manager">HR Manager</option>
                    </select>
                  </div>
                  <div>
                    <Label
                      htmlFor="department"
                      className="text-sm font-medium mb-2 block"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Department
                    </Label>
                    <Input
                      id="department"
                      value={newEmployee.department}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          department: e.target.value,
                        })
                      }
                      placeholder="e.g., Engineering, Marketing"
                      className="border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="position"
                      className="text-sm font-medium mb-2 block"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      Position
                    </Label>
                    <Input
                      id="position"
                      value={newEmployee.position}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          position: e.target.value,
                        })
                      }
                      placeholder="e.g., Software Engineer, Marketing Manager"
                      className="border-gray-300 rounded-xl focus:border-gray-900 focus:ring-gray-900"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={loading || processingResume}
                    className="bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {loading ? "Adding Employee..." : "Add Employee"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForm}
                    className="border-2 border-gray-300 font-semibold rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-300"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                      backgroundColor: "white",
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Invitations List */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle
              className="font-semibold"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              Employee Invitations
            </CardTitle>
            <CardDescription
              className="opacity-80"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              Manage all employee invitations and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p
                  className="opacity-80"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  No employees added yet
                </p>
                <p
                  className="text-sm opacity-60"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  Click "Add Employee" to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-all duration-300"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <p
                            className="font-medium"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                              color: "#0E0E0E",
                            }}
                          >
                            {invitation.email}
                          </p>
                          <div
                            className="flex items-center space-x-2 text-sm opacity-80"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                              color: "#0E0E0E",
                            }}
                          >
                            <span>{invitation.role.replace("_", " ")}</span>
                            {invitation.department && (
                              <span>• {invitation.department}</span>
                            )}
                            {invitation.position && (
                              <span>• {invitation.position}</span>
                            )}
                          </div>
                          {invitation.phone && (
                            <div
                              className="flex items-center space-x-2 text-sm opacity-80 mt-1"
                              style={{
                                fontFamily: "Inter, system-ui, sans-serif",
                                color: "#0E0E0E",
                              }}
                            >
                              <span>📞 {invitation.phone}</span>
                            </div>
                          )}
                          {invitation.skills &&
                            invitation.skills.length > 0 && (
                              <div
                                className="flex items-center space-x-2 text-sm opacity-80 mt-1"
                                style={{
                                  fontFamily: "Inter, system-ui, sans-serif",
                                  color: "#0E0E0E",
                                }}
                              >
                                <span>
                                  🛠️ {invitation.skills.slice(0, 3).join(", ")}
                                </span>
                                {invitation.skills.length > 3 && (
                                  <span className="opacity-60">
                                    +{invitation.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          {invitation.generatedEmail && (
                            <div
                              className="flex items-center space-x-2 text-sm opacity-80 mt-1"
                              style={{
                                fontFamily: "Inter, system-ui, sans-serif",
                                color: "#0E0E0E",
                              }}
                            >
                              <Mail className="w-3 h-3" />
                              <span>
                                Company Email: {invitation.generatedEmail}
                              </span>
                              {invitation.emailCredentialsGenerated && (
                                <CheckCircle className="w-3 h-3 text-gray-700" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(invitation.status)}
                      <div
                        className="text-sm opacity-80"
                        style={{
                          fontFamily: "Inter, system-ui, sans-serif",
                          color: "#0E0E0E",
                        }}
                      >
                        Sent{" "}
                        {new Date(invitation.invitedAt).toLocaleDateString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInvitation(invitation._id)}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
