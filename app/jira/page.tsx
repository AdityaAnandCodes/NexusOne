"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Users,
  FolderOpen,
  Bug,
  CheckSquare,
  Clock,
  User,
  Settings,
  Filter,
  Download,
} from "lucide-react";


export default function JiraManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<JiraUser | null>(null);
  const [sites, setSites] = useState<JiraSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [users, setUsers] = useState<JiraUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [createIssueForm, setCreateIssueForm] = useState<CreateIssueData>({
    projectKey: "",
    summary: "",
    description: "",
    issueType: "Task",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchProjects();
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedSite) {
      fetchIssues();
    }
  }, [selectedSite, selectedProject]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/integrations/jira/status");
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          setSites(data.sites || []);
          if (data.sites && data.sites.length > 0) {
            setSelectedSite(data.sites[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error checking Jira auth status:", error);
    }
  };

  const fetchProjects = async () => {
    if (!selectedSite) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/integrations/jira/projects?siteId=${selectedSite}`
      );
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    if (!selectedSite) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        siteId: selectedSite,
        maxResults: "100",
      });

      if (selectedProject) {
        params.append("projectKey", selectedProject);
      }

      const response = await fetch(`/api/integrations/jira/issues?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!selectedSite) return;
    try {
      const response = await fetch(
        `/api/integrations/jira/users?siteId=${selectedSite}&maxResults=100`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!selectedSite || !query) return;
    try {
      const response = await fetch(
        `/api/integrations/jira/users?query=${query}&siteId=${selectedSite}`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const assignUserToIssue = async (issueKey: string, accountId: string) => {
    try {
      await fetch("/api/integrations/jira/assign-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: selectedSite, issueKey, accountId }),
      });
      fetchIssues(); // Refresh issues
    } catch (error) {
      console.error("Error assigning user:", error);
    }
  };

  const createIssue = async () => {
    if (!createIssueForm.projectKey || !createIssueForm.summary) return;

    setLoading(true);
    try {
      const response = await fetch("/api/integrations/jira/create-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...createIssueForm,
          siteId: selectedSite,
        }),
      });

      if (response.ok) {
        setCreateIssueForm({
          projectKey: "",
          summary: "",
          description: "",
          issueType: "Task",
        });
        setShowCreateForm(false);
        fetchIssues();
      }
    } catch (error) {
      console.error("Error creating issue:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      "To Do": "bg-gray-100 text-gray-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Done: "bg-green-100 text-green-800",
      Blocked: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType.toLowerCase()) {
      case "bug":
        return <Bug className="w-4 h-4 text-red-500" />;
      case "task":
        return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case "story":
        return <FolderOpen className="w-4 h-4 text-green-500" />;
      default:
        return <CheckSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredIssues = issues.filter(
    (issue) =>
      issue.fields.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Jira Integration Required
          </h1>
          <p className="text-gray-600">
            Please connect your Jira account first to use this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-indigo-600">
                📋 Jira Dashboard
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-2">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: <Eye className="w-4 h-4" />,
              },
              {
                id: "projects",
                label: "Projects",
                icon: <FolderOpen className="w-4 h-4" />,
              },
              {
                id: "issues",
                label: "Issues",
                icon: <Bug className="w-4 h-4" />,
              },
              {
                id: "users",
                label: "Users",
                icon: <Users className="w-4 h-4" />,
              },
              {
                id: "settings",
                label: "Settings",
                icon: <Settings className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-4 border-b-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <FolderOpen className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">
                      {projects.length}
                    </p>
                    <p className="text-gray-500">Projects</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Bug className="w-8 h-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">
                      {issues.length}
                    </p>
                    <p className="text-gray-500">Total Issues</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">
                      {
                        issues.filter(
                          (issue) => issue.fields.status.name === "In Progress"
                        ).length
                      }
                    </p>
                    <p className="text-gray-500">In Progress</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <CheckSquare className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">
                      {
                        issues.filter(
                          (issue) => issue.fields.status.name === "Done"
                        ).length
                      }
                    </p>
                    <p className="text-gray-500">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  Recent Issues
                </h2>
              </div>
              <div className="p-6">
                {issues.slice(0, 5).map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      {getIssueTypeIcon(issue.fields.issuetype.name)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {issue.key}
                        </p>
                        <p className="text-sm text-gray-500">
                          {issue.fields.summary}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        issue.fields.status.name
                      )}`}
                    >
                      {issue.fields.status.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {project.key}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {project.lead?.displayName || "No lead"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 uppercase">
                        {project.projectTypeKey}
                      </span>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => setSelectedProject(project.key)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Issues
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                        Settings
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Users & Permissions
            </h1>

            {/* Search Users */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    if (e.target.value) searchUsers(e.target.value);
                    else fetchUsers();
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 text-black lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div
                  key={user.account_id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === "issues" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Issues</h1>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Issue</span>
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.key} value={project.key}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </button>

                <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Issues List */}
            <div className="bg-white shadow rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Issue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Assignee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {issue.key}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {issue.fields.summary}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getIssueTypeIcon(issue.fields.issuetype.name)}
                            <span className="text-sm text-gray-900">
                              {issue.fields.issuetype.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              issue.fields.status.name
                            )}`}
                          >
                            {issue.fields.status.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {issue.fields.assignee?.displayName || "Unassigned"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {new Date(
                              issue.fields.created
                            ).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-800">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                /* Show assign modal with user dropdown */
                              }}
                              className="text-green-400 hover:text-green-600"
                              title="Assign User"
                            >
                              <User className="w-4 h-4" />
                            </button>
                            <button className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Users & Permissions
            </h1>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">
                User management features will be available in a future update.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Integration Settings
            </h1>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Connected Account
              </h3>
              <div className="flex items-center space-x-4">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  Connected Sites
                </h4>
                <div className="space-y-2">
                  {sites.map((site) => (
                    <div key={site.id} className="p-3 border rounded-md">
                      <p className="font-medium">{site.name}</p>
                      <p className="text-sm text-gray-500">{site.url}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Issue Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create New Issue
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  value={createIssueForm.projectKey}
                  onChange={(e) =>
                    setCreateIssueForm({
                      ...createIssueForm,
                      projectKey: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.key} value={project.key}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Type
                </label>
                <select
                  value={createIssueForm.issueType}
                  onChange={(e) =>
                    setCreateIssueForm({
                      ...createIssueForm,
                      issueType: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Story">Story</option>
                  <option value="Epic">Epic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary
                </label>
                <input
                  type="text"
                  value={createIssueForm.summary}
                  onChange={(e) =>
                    setCreateIssueForm({
                      ...createIssueForm,
                      summary: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createIssueForm.description}
                  onChange={(e) =>
                    setCreateIssueForm({
                      ...createIssueForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  placeholder="Detailed description (optional)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createIssue}
                disabled={
                  loading ||
                  !createIssueForm.projectKey ||
                  !createIssueForm.summary
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
