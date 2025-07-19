"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
  User,
  Calendar,
  Download,
} from "lucide-react";

interface OnboardingRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  tasks: Array<{
    taskId: string;
    title: string;
    description: string;
    required: boolean;
    status: string;
    completedAt?: string;
  }>;
  policies: Array<{
    policyId: string;
    policyName: string;
    required: boolean;
    acknowledged: boolean;
    acknowledgedAt?: string;
  }>;
  documents: Array<{
    type: string;
    fileName: string;
    filePath: string;
    uploadedAt: string;
    status: string;
    reviewedAt?: string;
    reviewedBy?: string;
    feedback?: string;
  }>;
  tasksProgress: {
    total: number;
    completed: number;
  };
  policiesProgress: {
    total: number;
    acknowledged: number;
  };
  documentsProgress: {
    total: number;
    approved: number;
    pending: number;
  };
  satisfactionScore?: number;
  feedback?: string;
}

export default function OnboardingManagement() {
  const [onboardingRecords, setOnboardingRecords] = useState<
    OnboardingRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] =
    useState<OnboardingRecord | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOnboardingRecords();
  }, []);

  const fetchOnboardingRecords = async () => {
    try {
      const response = await fetch("/api/hr/onboarding");
      const data = await response.json();

      if (data.success) {
        setOnboardingRecords(data.onboardingRecords);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch onboarding records",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching onboarding records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch onboarding records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (
    employeeId: string,
    documentType: string,
    action: "approve_document" | "reject_document",
    feedback?: string
  ) => {
    try {
      const response = await fetch("/api/hr/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          employeeId,
          documentType,
          feedback,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchOnboardingRecords(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update document",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating document:", error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    }
  };

  const handleProvideFeedback = async (
    employeeId: string,
    feedback: string
  ) => {
    try {
      const response = await fetch("/api/hr/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "provide_feedback",
          employeeId,
          feedback,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Feedback provided successfully",
        });
        setFeedbackText("");
        fetchOnboardingRecords(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to provide feedback",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error providing feedback:", error);
      toast({
        title: "Error",
        description: "Failed to provide feedback",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "not_started":
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "pending_review":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const calculateOverallProgress = (record: OnboardingRecord) => {
    const taskProgress =
      record.tasksProgress.total > 0
        ? (record.tasksProgress.completed / record.tasksProgress.total) * 100
        : 100;
    const policyProgress =
      record.policiesProgress.total > 0
        ? (record.policiesProgress.acknowledged /
            record.policiesProgress.total) *
          100
        : 100;
    const documentProgress =
      record.documentsProgress.total > 0
        ? (record.documentsProgress.approved / record.documentsProgress.total) *
          100
        : 100;

    return Math.round((taskProgress + policyProgress + documentProgress) / 3);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Employee Onboarding Management</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {onboardingRecords.map((record) => (
          <Card key={record._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{record.employeeName}</CardTitle>
                {getStatusBadge(record.status)}
              </div>
              <p className="text-sm text-gray-600">{record.employeeEmail}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Overall Progress
                    </span>
                    <span className="text-sm text-gray-600">
                      {calculateOverallProgress(record)}%
                    </span>
                  </div>
                  <Progress value={calculateOverallProgress(record)} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">
                      {record.tasksProgress.completed}/
                      {record.tasksProgress.total}
                    </div>
                    <div className="text-gray-600">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">
                      {record.policiesProgress.acknowledged}/
                      {record.policiesProgress.total}
                    </div>
                    <div className="text-gray-600">Policies</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-600">
                      {record.documentsProgress.approved}/
                      {record.documentsProgress.total}
                    </div>
                    <div className="text-gray-600">Documents</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Started: {new Date(record.startedAt).toLocaleDateString()}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedEmployee(record)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {record.employeeName} - Onboarding Details
                      </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="tasks" className="mt-4">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="policies">Policies</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="feedback">Feedback</TabsTrigger>
                      </TabsList>

                      <TabsContent value="tasks" className="mt-4">
                        <div className="space-y-3">
                          {record.tasks.map((task, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium">
                                      {task.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {task.description}
                                    </p>
                                    {task.completedAt && (
                                      <p className="text-xs text-green-600 mt-2">
                                        Completed:{" "}
                                        {new Date(
                                          task.completedAt
                                        ).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    {task.status === "completed" ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="policies" className="mt-4">
                        <div className="space-y-3">
                          {record.policies.map((policy, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">
                                      {policy.policyName}
                                    </h4>
                                    {policy.acknowledgedAt && (
                                      <p className="text-xs text-green-600 mt-1">
                                        Acknowledged:{" "}
                                        {new Date(
                                          policy.acknowledgedAt
                                        ).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                  {policy.acknowledged ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="documents" className="mt-4">
                        <div className="space-y-3">
                          {record.documents.map((document, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <h4 className="font-medium">
                                        {document.type}
                                      </h4>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {document.fileName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Uploaded:{" "}
                                      {new Date(
                                        document.uploadedAt
                                      ).toLocaleString()}
                                    </p>
                                    {document.feedback && (
                                      <p className="text-xs text-red-600 mt-1">
                                        Feedback: {document.feedback}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getDocumentStatusBadge(document.status)}
                                    <Button variant="ghost" size="sm" asChild>
                                      <a
                                        href={document.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                                {document.status === "pending_review" && (
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleDocumentAction(
                                          record.employeeId,
                                          document.type,
                                          "approve_document"
                                        )
                                      }
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleDocumentAction(
                                          record.employeeId,
                                          document.type,
                                          "reject_document",
                                          "Document requires revision"
                                        )
                                      }
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="feedback" className="mt-4">
                        <div className="space-y-4">
                          {record.feedback && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  Previous Feedback
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gray-700">
                                  {record.feedback}
                                </p>
                              </CardContent>
                            </Card>
                          )}

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Provide Feedback
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <Textarea
                                  placeholder="Enter feedback for the employee..."
                                  value={feedbackText}
                                  onChange={(e) =>
                                    setFeedbackText(e.target.value)
                                  }
                                  rows={4}
                                />
                                <Button
                                  onClick={() => {
                                    if (record && feedbackText.trim()) {
                                      handleProvideFeedback(
                                        record.employeeId,
                                        feedbackText
                                      );
                                    }
                                  }}
                                  disabled={!feedbackText.trim()}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Feedback
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          {record.satisfactionScore && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  Employee Satisfaction
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-blue-600">
                                    {record.satisfactionScore}/5
                                  </span>
                                  <span className="text-gray-600">stars</span>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {onboardingRecords.length === 0 && (
        <Card className="mt-8">
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Onboarding Records
            </h3>
            <p className="text-gray-600">
              No employees have started the onboarding process yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
