"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Download,
  Calendar,
  ArrowLeft,
  Shield,
  Bell,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: "pending" | "verified" | "rejected";
  url?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  department?: string;
  position?: string;
}

export default function EmployeeDocuments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (!session?.user?.companyId) {
      router.push("/onboarding/company");
      return;
    }

    loadUserProfile();
  }, [session, status, router]);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.role !== "employee") {
        router.push("/dashboard");
        return;
      }
      loadEmployeeDocuments();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserProfile(data.user);
        } else {
          console.error("Failed to fetch user profile");
          router.push("/dashboard");
        }
      } else {
        console.error("Failed to fetch user profile");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeeDocuments = async () => {
    try {
      const response = await fetch("/api/employee/documents");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUploadedDocuments(data.documents);
        }
      }
    } catch (error) {
      console.error("Error loading employee documents:", error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        continue;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} is not a supported file type.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/employee/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUploadedDocuments((prev) => [...prev, data.document]);
          }
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/employee/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUploadedDocuments((prev) =>
          prev.filter((doc) => doc.id !== documentId)
        );
      } else {
        alert("Failed to delete document");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return Check;
      case "rejected":
        return X;
      default:
        return AlertCircle;
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || isLoading || !userProfile) {
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
            Loading your documents...
          </h1>
        </div>
      </div>
    );
  }

  const completedDocs = uploadedDocuments.filter(
    (doc) => doc.status === "verified"
  ).length;
  const totalRequiredDocs = 1; // Adjust based on your requirements
  const completionPercentage = (completedDocs / totalRequiredDocs) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
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
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    NexusOne
                  </h1>
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm text-gray-600"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    >
                      Welcome back, {session?.user?.name}
                      {userProfile.position && ` • ${userProfile.position}`}
                      {userProfile.department && ` • ${userProfile.department}`}
                    </p>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Employee
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSignOut}
                className="group relative px-6 py-2 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 overflow-hidden"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                <span className="relative z-10">Sign Out</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full border border-blue-200 mb-6">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span
              className="text-sm font-semibold tracking-wide text-blue-800"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              EMPLOYEE DOCUMENTS
            </span>
          </div>

          <h2
            className="text-5xl font-black tracking-tight mb-4"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Upload Your Documents
          </h2>
          <p
            className="text-xl text-gray-600 mb-6"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Submit the required onboarding documents to complete your profile
          </p>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            {completedDocs} of {totalRequiredDocs} required documents completed
            ({Math.round(completionPercentage)}%)
          </p>
        </div>

        {/* Upload Area */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-lg mb-8">
          <CardHeader>
            <CardTitle
              className="text-2xl font-bold"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              📄 Upload Documents
            </CardTitle>
            <CardDescription
              className="text-lg"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Drag and drop your files here or click to browse. Accepted
              formats: PDF, DOC, DOCX, JPG, PNG
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h4
                className="text-2xl font-bold mb-3"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                {isUploading
                  ? "Uploading your documents..."
                  : "Drop your files here"}
              </h4>
              <p
                className="text-gray-600 mb-6 text-lg"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Maximum file size: 10MB per file
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) =>
                  e.target.files && handleFileUpload(e.target.files)
                }
                disabled={isUploading}
              />
              <label htmlFor="file-upload">
                <Button
                  className="bg-black text-white hover:bg-gray-900 rounded-xl px-8 py-3 text-lg"
                  disabled={isUploading}
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  asChild
                >
                  <span className="cursor-pointer">
                    {isUploading ? "Uploading..." : "Choose Files to Upload"}
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Document Requirements */}
        <Card className="bg-blue-50 border border-blue-200 rounded-xl shadow-lg mb-8">
          <CardHeader>
            <CardTitle
              className="text-2xl font-bold text-blue-900"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              📋 Required Documents Checklist
            </CardTitle>
            <CardDescription
              className="text-blue-700 text-lg"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Please ensure you upload all the following documents for a smooth
              onboarding process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 text-blue-800"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="font-medium">
                    Any Government-issued ID (Driver's License, Passport, or
                    similar)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Documents List */}
        {uploadedDocuments.length > 0 && (
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle
                className="text-2xl font-bold"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                📂 Your Uploaded Documents
              </CardTitle>
              <CardDescription
                className="text-lg"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Track the status of your submitted documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedDocuments.map((document) => {
                  const StatusIcon = getStatusIcon(document.status);
                  return (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4
                            className="font-bold text-xl mb-1"
                            style={{
                              fontFamily: "Inter, system-ui, sans-serif",
                              color: "#0E0E0E",
                            }}
                          >
                            {document.name}
                          </h4>
                          <div className="flex items-center gap-4 text-gray-600">
                            <span className="font-medium">
                              {formatFileSize(document.size)}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="h-4 w-4" />
                              {formatDate(document.uploadedAt.toString())}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${getStatusColor(
                            document.status
                          )}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          {document.status === "pending" && "Under Review"}
                          {document.status === "verified" && "Approved"}
                          {document.status === "rejected" && "Rejected"}
                        </span>
                        {document.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            onClick={() => removeDocument(document.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {document.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg font-medium"
                            onClick={() => window.open(document.url, "_blank")}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
