"use client";

import { useState, useEffect } from "react";

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
      description: "Access your Notion workspace, pages, and databases",
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
      description: "Access your GitHub repositories, issues, and user data",
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
      description: "Connect with your Slack workspace and channels",
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
      description: "Manage your Jira projects, issues, and workflows",
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
      client_id: clientId,
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

  const getButtonColor = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: "bg-blue-600 hover:bg-blue-700",
      gray: "bg-gray-800 hover:bg-gray-900",
      green: "bg-green-600 hover:bg-green-700",
      indigo: "bg-indigo-600 hover:bg-indigo-700",
    };
    return colors[color] || "bg-gray-600 hover:bg-gray-700";
  };

  const getConnectedInfo = (integration: Integration) => {
    if (integration.name === "Notion" && notionUser) {
      return (
        <div className="bg-green-50 p-4 rounded-lg text-left mb-4">
          <p className="text-sm">
            <span className="font-semibold">User:</span> {notionUser.name}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Email:</span> {notionUser.email}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Workspace:</span> {workspaceName}
          </p>
        </div>
      );
    }

    if (integration.name === "GitHub" && githubUser) {
      return (
        <div className="bg-green-50 p-4 rounded-lg text-left mb-4">
          <div className="flex items-center gap-3 mb-2">
            <img
              src={githubUser.avatar_url}
              alt={githubUser.login}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-sm font-semibold">
                {githubUser.name || githubUser.login}
              </p>
              <p className="text-xs text-gray-600">@{githubUser.login}</p>
            </div>
          </div>
          <p className="text-sm">
            <span className="font-semibold">Email:</span>{" "}
            {githubUser.email || "Not public"}
          </p>
        </div>
      );
    }

    if (integration.name === "Jira" && jiraUser) {
    return (
      <div className="bg-green-50 p-4 rounded-lg text-left mb-4">
        <div className="flex items-center gap-3 mb-2">
          <img
            src={jiraUser.picture}
            alt={jiraUser.name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="text-sm font-semibold">{jiraUser.name}</p>
            <p className="text-xs text-gray-600">{jiraUser.email}</p>
          </div>
        </div>
        {jiraSites.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold">Sites:</p>
            {jiraSites.map((site) => (
              <p key={site.id} className="text-xs text-gray-600">
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            App Integrations
          </h1>
          <p className="text-xl text-white/80">
            Connect your favorite tools and streamline your workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="bg-white rounded-xl shadow-2xl p-8 transition-all duration-300 hover:scale-105"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{integration.icon}</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {integration.name}
                </h2>
                <p className="text-gray-600 mb-4">{integration.description}</p>

                {integration.connected && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✓ Connected
                    </span>
                  </div>
                )}
              </div>

              {integration.connected && getConnectedInfo(integration)}

              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="text-sm font-semibold mb-3 text-gray-800">
                  Permissions:
                </h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  {integration.permissions.map((permission, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-0.5">•</span>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>

              {!integration.connected ? (
                <button
                  onClick={() => handleConnect(integration.name)}
                  disabled={loading[integration.name.toLowerCase()]}
                  className={`w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-300 ${getButtonColor(
                    integration.color
                  )} ${
                    loading[integration.name.toLowerCase()]
                      ? "opacity-50 cursor-not-allowed"
                      : "transform hover:scale-105"
                  } shadow-lg`}
                >
                  {loading[integration.name.toLowerCase()]
                    ? "Connecting..."
                    : `Connect ${integration.name}`}
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleDisconnect(integration.name.toLowerCase())
                  }
                  className="w-full px-6 py-3 text-white font-semibold rounded-lg bg-red-600 hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Disconnect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
