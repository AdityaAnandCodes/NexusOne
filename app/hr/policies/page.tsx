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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  ChevronLeft,
  FileText,
  Download,
  Calendar,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  Eye,
  Copy,
  AlertCircle,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  hasHRAccess,
  hasAdminAccess,
  canManageEmployees,
  canConfigurePolicies,
} from "@/lib/utils/roleCheck";
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  department?: string;
  position?: string;
  image?: string;
  emailVerified?: boolean;
}

interface PolicyFile {
  id: string;
  filename: string;
  uploadDate: string;
  contentType: string;
  fileSize: number;
  originalName: string;
  type: string;
  url: string;
  textFileId: string | null;
  textUrl: string | null;
  textLength: number | null;
  wordCount: number | null;
}

export default function PoliciesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [policies, setPolicies] = useState<PolicyFile[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<PolicyFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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

    loadPolicies();
  }, [session, status, router]);

  useEffect(() => {
    // Filter policies based on search term
    if (searchTerm.trim() === "") {
      setFilteredPolicies(policies);
    } else {
      const filtered = policies.filter((policy) =>
        policy.originalName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPolicies(filtered);
    }
  }, [searchTerm, policies]);

  const loadPolicies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/company/policies");
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.files);
        setFilteredPolicies(data.files);
      } else {
        console.error("Failed to fetch policies");
      }
    } catch (error) {
      console.error("Error loading policies:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeletePolicy = async (policyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this policy document? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/company/policy/${policyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the policy from local state
        setPolicies((prev) => prev.filter((p) => p.id !== policyId));
        setFilteredPolicies((prev) => prev.filter((p) => p.id !== policyId));

        // You could add a toast notification here
        alert("Policy document deleted successfully");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete policy");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        `Failed to delete policy: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/company/policy", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        console.log("Upload successful:", result);

        // Reload policies
        setTimeout(() => {
          loadPolicies();
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    event.target.value = "";
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (status === "loading" || isLoading) {
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
            Loading policies...
          </h1>
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
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
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
                  <p
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    Policy Management
                  </p>
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
      <main
        className={`max-w-7xl mx-auto px-6 lg:px-8 py-12 transform transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Header Section */}
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
              POLICY DOCUMENT MANAGEMENT
            </span>
          </div>

          <h2
            className="text-5xl font-black tracking-tight mb-4"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Policy Documents
          </h2>
          <p
            className="text-xl text-gray-600"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Manage your company's policy documents and onboarding materials
          </p>
        </div>

        {/* Stats and Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-6">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {policies.length}
                    </p>
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      Total Documents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {
                        policies.filter((p) => {
                          const uploadDate = new Date(p.uploadDate);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return uploadDate > weekAgo;
                        }).length
                      }
                    </p>
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      This Week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              />
            </div>

            {/* Only show upload button to HR+ roles */}
            {userProfile && hasHRAccess(userProfile.role) && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  className="bg-black text-white hover:bg-gray-900 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Policy"}
                </Button>
              </label>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p
                    className="font-semibold mb-2"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    Processing document...
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {uploadProgress}% complete - Extracting text and storing
                    document
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Policies List */}
        {filteredPolicies.length > 0 ? (
          <div className="space-y-6">
            {filteredPolicies.map((policy) => (
              <Card
                key={policy.id}
                className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-xl font-bold mb-2 truncate"
                          style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                            color: "#0E0E0E",
                          }}
                        >
                          {policy.originalName}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              {formatDate(policy.uploadDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">
                              {formatFileSize(policy.fileSize)}
                            </span>
                          </div>
                          {policy.wordCount && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Eye className="h-4 w-4" />
                              <span className="text-sm">
                                {policy.wordCount.toLocaleString()} words
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 rounded-lg"
                          >
                            PDF Available
                          </Badge>
                          {policy.textUrl && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 rounded-lg"
                            >
                              Text Extracted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => window.open(policy.url, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>

                      {policy.textUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => window.open(policy.textUrl!, "_blank")}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Text
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(policy.url)}
                            className="cursor-pointer"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy PDF Link
                          </DropdownMenuItem>
                          {policy.textUrl && (
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(policy.textUrl!)}
                              className="cursor-pointer"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Text Link
                            </DropdownMenuItem>
                          )}
                          {/* Only show delete option to HR+ roles */}
                          {userProfile && hasHRAccess(userProfile.role) && (
                            <DropdownMenuItem
                              onClick={() => handleDeletePolicy(policy.id)}
                              className="cursor-pointer text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Document
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
            <CardContent className="p-12 text-center">
              {searchTerm ? (
                <>
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3
                    className="text-2xl font-bold mb-2"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    No policies found
                  </h3>
                  <p
                    className="text-gray-600 mb-6"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    No policies match your search term "{searchTerm}"
                  </p>
                  <Button
                    onClick={() => setSearchTerm("")}
                    className="bg-black text-white hover:bg-gray-900 rounded-xl"
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3
                    className="text-2xl font-bold mb-2"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    No Policy Documents Yet
                  </h3>
                  <p
                    className="text-gray-600 mb-6"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    Upload your first policy document to get started with
                    automated onboarding assistance.
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <Button
                      className="bg-black text-white hover:bg-gray-900 rounded-xl"
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First Policy
                    </Button>
                  </label>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        {policies.length === 0 && !searchTerm && (
          <Card className="bg-slate-50 border border-slate-200 rounded-xl shadow-lg mt-12">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    Getting Started with Policy Documents
                  </h3>
                  <div
                    className="space-y-2 text-gray-600"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    <p>
                      • Upload PDF, DOC, or DOCX files containing your company
                      policies
                    </p>
                    <p>
                      • Our system automatically extracts text for AI-powered
                      onboarding assistance
                    </p>
                    <p>
                      • Employees can ask questions about policies during their
                      onboarding process
                    </p>
                    <p>
                      • Both original documents and extracted text are stored
                      securely
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
