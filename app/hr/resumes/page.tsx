"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Mail,
  Phone,
  MapPin,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";
import { hasHRAccess } from "@/lib/utils/roleCheck";

interface Resume {
  id: string;
  filename: string;
  uploadDate: string;
  fileSize: number;
  applicantName: string;
  applicantEmail: string;
  position: string;
  phone: string;
  coverLetter: string;
  status: "pending" | "reviewed" | "shortlisted" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  notes: string;
}

export default function ResumesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    loadResumes();
  }, [status, router]);

  const loadResumes = async () => {
    try {
      const response = await fetch("/api/resumes/list");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResumes(data.resumes);
        }
      }
    } catch (error) {
      console.error("Error loading resumes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateResumeStatus = async (
    resumeId: string,
    status: string,
    notes: string = ""
  ) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/resumes/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId,
          status,
          notes,
        }),
      });

      if (response.ok) {
        await loadResumes(); // Refresh the list
        setSelectedResume(null);
      }
    } catch (error) {
      console.error("Error updating resume:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadResume = (resumeId: string, filename: string) => {
    window.open(`/api/resumes/${resumeId}`, "_blank");
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "Pending",
      },
      reviewed: {
        color: "bg-blue-100 text-blue-800",
        icon: Eye,
        label: "Reviewed",
      },
      shortlisted: {
        color: "bg-green-100 text-green-800",
        icon: Star,
        label: "Shortlisted",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Rejected",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredResumes = resumes.filter(
    (resume) => filterStatus === "all" || resume.status === filterStatus
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Loading resumes...</h1>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Resume Management
              </h1>
              <p className="text-gray-600">
                Review and manage job applications
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{resumes.length}</div>
              <p className="text-gray-600">Total Applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {resumes.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-gray-600">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {resumes.filter((r) => r.status === "shortlisted").length}
              </div>
              <p className="text-gray-600">Shortlisted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">
                {resumes.filter((r) => r.status === "reviewed").length}
              </div>
              <p className="text-gray-600">Reviewed</p>
            </CardContent>
          </Card>
        </div>

        {/* Resume List */}
        {filteredResumes.length > 0 ? (
          <div className="space-y-4">
            {filteredResumes.map((resume) => (
              <Card
                key={resume.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold">
                          {resume.applicantName}
                        </h3>
                        {getStatusBadge(resume.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {resume.applicantEmail}
                        </div>
                        {resume.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {resume.phone}
                          </div>
                        )}
                        {resume.position && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {resume.position}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(resume.uploadDate)}
                        </div>
                      </div>

                      {resume.coverLetter && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {resume.coverLetter}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FileText className="h-4 w-4" />
                        <span>{resume.filename}</span>
                        <span>•</span>
                        <span>{formatFileSize(resume.fileSize)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadResume(resume.id, resume.filename)
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setSelectedResume(resume)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Review Application - {resume.applicantName}
                            </DialogTitle>
                          </DialogHeader>

                          {selectedResume && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Contact Information
                                  </h4>
                                  <p>
                                    <strong>Name:</strong>{" "}
                                    {selectedResume.applicantName}
                                  </p>
                                  <p>
                                    <strong>Email:</strong>{" "}
                                    {selectedResume.applicantEmail}
                                  </p>
                                  {selectedResume.phone && (
                                    <p>
                                      <strong>Phone:</strong>{" "}
                                      {selectedResume.phone}
                                    </p>
                                  )}
                                  {selectedResume.position && (
                                    <p>
                                      <strong>Position:</strong>{" "}
                                      {selectedResume.position}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Application Details
                                  </h4>
                                  <p>
                                    <strong>Applied:</strong>{" "}
                                    {formatDate(selectedResume.uploadDate)}
                                  </p>
                                  <p>
                                    <strong>Status:</strong>{" "}
                                    {getStatusBadge(selectedResume.status)}
                                  </p>
                                  {selectedResume.reviewedBy && (
                                    <p>
                                      <strong>Reviewed by:</strong>{" "}
                                      {selectedResume.reviewedBy}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {selectedResume.coverLetter && (
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Cover Letter
                                  </h4>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm">
                                      {selectedResume.coverLetter}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold mb-2">
                                  Review Notes
                                </h4>
                                <Textarea
                                  placeholder="Add your review notes here..."
                                  defaultValue={selectedResume.notes}
                                  id="review-notes"
                                  rows={3}
                                />
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      downloadResume(
                                        selectedResume.id,
                                        selectedResume.filename
                                      )
                                    }
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download Resume
                                  </Button>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      const notes =
                                        (
                                          document.getElementById(
                                            "review-notes"
                                          ) as HTMLTextAreaElement
                                        )?.value || "";
                                      updateResumeStatus(
                                        selectedResume.id,
                                        "rejected",
                                        notes
                                      );
                                    }}
                                    disabled={isUpdating}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      const notes =
                                        (
                                          document.getElementById(
                                            "review-notes"
                                          ) as HTMLTextAreaElement
                                        )?.value || "";
                                      updateResumeStatus(
                                        selectedResume.id,
                                        "shortlisted",
                                        notes
                                      );
                                    }}
                                    disabled={isUpdating}
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Shortlist
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Applications Found
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === "all"
                  ? "No job applications have been submitted yet."
                  : `No applications with status "${filterStatus}" found.`}
              </p>
              <Button onClick={() => setFilterStatus("all")} variant="outline">
                View All Applications
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
