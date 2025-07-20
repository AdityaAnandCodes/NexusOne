"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  CheckCircle,
  Zap,
  Shield,
  Users,
  Clock,
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  type: string;
}

interface GitHubUserInfo {
  id: string;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface AuthStatus {
  authenticated: boolean;
  user?: UserInfo;
  workspace_name?: string;
}

interface GitHubAuthStatus {
  authenticated: boolean;
  user?: GitHubUserInfo;
}

interface Integration {
  name: string;
  connected: boolean;
  icon: string;
  description: string;
  permissions: string[];
  color: string;
}

interface JiraUserInfo {
  account_id: string;
  name: string;
  email: string;
  picture: string;
}

interface JiraAuthStatus {
  authenticated: boolean;
  user?: JiraUserInfo;
  sites?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

export default function Settings() {
  const [isVisible, setIsVisible] = useState(false);
  const [notionAuth, setNotionAuth] = useState<boolean>(false);
  const [githubAuth, setGithubAuth] = useState<boolean>(false);
  const [notionUser, setNotionUser] = useState<UserInfo | null>(null);
  const [githubUser, setGithubUser] = useState<GitHubUserInfo | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [jiraAuth, setJiraAuth] = useState<boolean>(false);
  const [jiraUser, setJiraUser] = useState<JiraUserInfo | null>(null);
  const [jiraSites, setJiraSites] = useState<
    Array<{ id: string; name: string; url: string }>
  >([]);

  const integrations: Integration[] = [
    {
      name: "Notion",
      connected: notionAuth,
      icon: "📝",
      description:
        "Access your Notion workspace, pages, and databases for seamless content management",
      permissions: [
        "Read and write access to pages",
        "Access to databases and content",
        "Create and modify content",
        "User information and workspace details",
      ],
      color: "blue",
    },
    {
      name: "GitHub",
      connected: githubAuth,
      icon: "🐙",
      description:
        "Connect with your GitHub repositories, issues, and development workflow",
      permissions: [
        "Read access to repositories",
        "Fetch issues from repositories",
        "User profile information",
        "Grant access based on email",
      ],
      color: "gray",
    },
    {
      name: "Slack",
      connected: false,
      icon: "💬",
      description:
        "Integrate with your Slack workspace for enhanced team communication",
      permissions: [
        "Send and read messages",
        "Access channel information",
        "User and workspace details",
        "File sharing capabilities",
      ],
      color: "green",
    },
    {
      name: "Jira",
      connected: jiraAuth,
      icon: "📋",
      description:
        "Streamline project management with Jira integration and workflow automation",
      permissions: [
        "Read and create issues",
        "Access project information",
        "Manage workflow states",
        "User and project permissions",
      ],
      color: "indigo",
    },
  ];

  useEffect(() => {
    setIsVisible(true);
    checkAllAuthStatus();
  }, []);

  const checkAllAuthStatus = async () => {
    await Promise.all([
      checkNotionAuthStatus(),
      checkGitHubAuthStatus(),
      checkJiraAuthStatus(),
    ]);
  };

  const checkNotionAuthStatus = async () => {
    try {
      const response = await fetch("/api/integrations/notion/status");
      if (response.ok) {
        const data: AuthStatus = await response.json();
        setNotionAuth(data.authenticated);
        setNotionUser(data.user || null);
        setWorkspaceName(data.workspace_name || "");
      }
    } catch (error) {
      console.error("Error checking Notion auth status:", error);
    }
  };

  const checkJiraAuthStatus = async () => {
    try {
      const response = await fetch("/api/integrations/jira/status");
      if (response.ok) {
        const data: JiraAuthStatus = await response.json();
        setJiraAuth(data.authenticated);
        setJiraUser(data.user || null);
        setJiraSites(data.sites || []);
      }
    } catch (error) {
      console.error("Error checking Jira auth status:", error);
    }
  };

  const checkGitHubAuthStatus = async () => {
    try {
      const response = await fetch("/api/integrations/github/status");
      if (response.ok) {
        const data: GitHubAuthStatus = await response.json();
        setGithubAuth(data.authenticated);
        setGithubUser(data.user || null);
      }
    } catch (error) {
      console.error("Error checking GitHub auth status:", error);
    }
  };

  const handleNotionAuth = () => {
    setLoading({ ...loading, notion: true });

    const clientId = "235d872b-594c-80bd-bdd4-003721b75def";
    const redirectUri = `${window.location.origin}/api/integrations/notion/callback`;
    const state = Math.random().toString(36).substring(7);

    document.cookie = `notion_oauth_state=${state}; path=/; max-age=600`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      owner: "user",
      redirect_uri: redirectUri,
      state: state,
    });

    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
    window.location.href = notionAuthUrl;
  };

  const handleGitHubAuth = () => {
    setLoading({ ...loading, github: true });

    const clientId =
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "your-github-client-id";
    const redirectUri = `${window.location.origin}/api/integrations/github/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "repo read:user user:email",
    });

    const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    window.location.href = githubAuthUrl;
  };

  const handleJiraAuth = () => {
    setLoading({ ...loading, jira: true });

    const clientId = process.env.NEXT_PUBLIC_ATLASSIAN_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/integrations/jira/callback`;
    const state = Math.random().toString(36).substring(7);

    document.cookie = `jira_oauth_state=${state}; path=/; max-age=600`;

    const params = new URLSearchParams({
      client_id: `${clientId}`,
      response_type: "code",
      redirect_uri: redirectUri,
      state: state,
      scope:
        "read:jira-work write:jira-work read:jira-user offline_access read:me",
      audience: "api.atlassian.com",
    });

    const jiraAuthUrl = `https://auth.atlassian.com/authorize?${params.toString()}`;
    window.location.href = jiraAuthUrl;
  };

  const handleDisconnect = async (service: string) => {
    try {
      const response = await fetch(`/api/integrations/${service}/disconnect`, {
        method: "POST",
      });

      if (response.ok) {
        if (service === "notion") {
          setNotionAuth(false);
          setNotionUser(null);
          setWorkspaceName("");
        } else if (service === "github") {
          setGithubAuth(false);
          setGithubUser(null);
        } else if (service === "jira") {
          setJiraAuth(false);
          setJiraUser(null);
          setJiraSites([]);
        }
      }
    } catch (error) {
      console.error(`Error disconnecting ${service}:`, error);
    }
  };

  const handleConnect = (integrationName: string) => {
    switch (integrationName.toLowerCase()) {
      case "notion":
        handleNotionAuth();
        break;
      case "github":
        handleGitHubAuth();
        break;
      case "slack":
        // Placeholder for Slack integration
        alert("Slack integration coming soon!");
        break;
      case "jira":
        handleJiraAuth();
        break;
      default:
        console.log(`Integration ${integrationName} not implemented yet`);
    }
  };

  const getConnectedInfo = (integration: Integration) => {
    if (integration.name === "Notion" && notionUser) {
      return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">N</span>
            </div>
            <div>
              <p
                className="font-semibold text-gray-900"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {notionUser.name}
              </p>
              <p className="text-sm text-gray-600">{notionUser.email}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Workspace:</span> {workspaceName}
          </p>
        </div>
      );
    }

    if (integration.name === "GitHub" && githubUser) {
      return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left mb-6">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={githubUser.avatar_url}
              alt={githubUser.login}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p
                className="font-semibold text-gray-900"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {githubUser.name || githubUser.login}
              </p>
              <p className="text-sm text-gray-600">@{githubUser.login}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Email:</span>{" "}
            {githubUser.email || "Not public"}
          </p>
        </div>
      );
    }

    if (integration.name === "Jira" && jiraUser) {
      return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left mb-6">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={jiraUser.picture}
              alt={jiraUser.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p
                className="font-semibold text-gray-900"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {jiraUser.name}
              </p>
              <p className="text-sm text-gray-600">{jiraUser.email}</p>
            </div>
          </div>
          {jiraSites.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Sites:</p>
              {jiraSites.map((site) => (
                <p key={site.id} className="text-sm text-gray-600">
                  {site.name}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const stats = [
    { value: "4+", label: "Integrations", icon: Zap },
    { value: "Enterprise", label: "Security", icon: Shield },
    { value: "24/7", label: "Support", icon: Clock },
  ];

  return (
    <section className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200 mb-8">
              <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
              <span
                className="text-sm font-semibold tracking-wide"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#0E0E0E",
                }}
              >
                NEXUS INTEGRATIONS
              </span>
            </div>

            <h1
              className="text-6xl font-black tracking-tight mb-6"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              Connect Your
              <br />
              <span className="text-gray-800">Workspace</span>
            </h1>

            <p
              className="text-xl leading-relaxed opacity-80 max-w-3xl mx-auto mb-12"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              Streamline your workflow by connecting Nexus with your favorite
              tools. Set up integrations in seconds and unlock the full
              potential of your workspace.
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-gray-700" />
                    <span
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#0E0E0E",
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-8 transform transition-all duration-1000 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {integrations.map((integration, index) => (
            <div
              key={integration.name}
              className="group bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{integration.icon}</div>
                  <div>
                    <h3
                      className="text-2xl font-bold text-gray-900"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {integration.name}
                    </h3>
                    {integration.connected && (
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span
                          className="text-sm font-medium text-green-600"
                          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        >
                          Connected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>

              {/* Description */}
              <p
                className="text-gray-600 mb-6 leading-relaxed"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {integration.description}
              </p>

              {/* Connected User Info */}
              {integration.connected && getConnectedInfo(integration)}

              {/* Permissions */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8">
                <h4
                  className="text-sm font-semibold mb-3 text-gray-900"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Permissions Required:
                </h4>
                <ul className="space-y-2">
                  {integration.permissions.map((permission, permIndex) => (
                    <li key={permIndex} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span
                        className="text-sm text-gray-700"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        {permission}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              {!integration.connected ? (
                <button
                  onClick={() => handleConnect(integration.name)}
                  disabled={loading[integration.name.toLowerCase()]}
                  className="group w-full px-6 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading[integration.name.toLowerCase()]
                      ? "Connecting..."
                      : `Connect ${integration.name}`}
                    {!loading[integration.name.toLowerCase()] && (
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    )}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleDisconnect(integration.name.toLowerCase())
                  }
                  className="group w-full px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Disconnect
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div
          className={`flex items-center justify-center gap-8 mt-16 pt-8 border-t border-gray-200 transform transition-all duration-1000 delay-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Enterprise Ready
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              SOC 2 Compliant
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              GDPR Ready
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
