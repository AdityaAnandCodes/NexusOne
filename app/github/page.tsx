"use client";

import { useGitHub } from "@/hooks/useGithub";
import { useState, useEffect } from "react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
}

interface User {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export default function GitHubIntegration(): JSX.Element {
  const {
    isAuthenticated,
    user,
    loading,
    getRepositories,
    getIssues,
    disconnect,
  } = useGitHub();

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingRepos, setLoadingRepos] = useState<boolean>(false);
  const [loadingIssues, setLoadingIssues] = useState<boolean>(false);

  const handleConnect = (): void => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

    if (!clientId) {
      console.error("GitHub client ID is not configured");
      return;
    }

    const redirectUri = `${window.location.origin}/api/integrations/github/callback`;
    const state = Math.random().toString(36).substring(7);

    // Store state in session storage for verification
    sessionStorage.setItem("github_oauth_state", state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "repo read:user user:email",
      state: state,
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  const fetchRepositories = async (): Promise<void> => {
    setLoadingRepos(true);
    try {
      const repos = await getRepositories();
      setRepositories(repos);
    } catch (error) {
      console.error("Error fetching repositories:", error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchIssues = async (repo: string): Promise<void> => {
    if (!repo) return;

    setLoadingIssues(true);
    try {
      const repoIssues = await getIssues(repo);
      setIssues(repoIssues);
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleRepoSelection = (repoName: string): void => {
    setSelectedRepo(repoName);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRepositories();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedRepo) {
      fetchIssues(selectedRepo);
    }
  }, [selectedRepo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">GitHub Integration</h1>

      {!isAuthenticated ? (
        <div className="text-center">
          <p className="text-lg mb-6">
            Connect your GitHub account to access your repositories and issues.
          </p>
          <button
            onClick={handleConnect}
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Connect with GitHub
          </button>
        </div>
      ) : (
        <div>
          {/* User Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Connected Successfully!
            </h2>
            <div className="flex items-center space-x-4">
              {user?.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.name || user.login || "User avatar"}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{user?.name || user?.login}</p>
                <p className="text-sm text-gray-600">@{user?.login}</p>
                {user?.email && (
                  <p className="text-sm text-gray-600">{user.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={disconnect}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>

          {/* Repositories */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Repositories</h2>
              <button
                onClick={fetchRepositories}
                disabled={loadingRepos}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loadingRepos ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedRepo === repo.full_name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleRepoSelection(repo.full_name)}
                >
                  <h3 className="font-semibold text-lg mb-2">{repo.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {repo.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{repo.language || "Unknown"}</span>
                    <div className="flex space-x-2">
                      <span>⭐ {repo.stargazers_count}</span>
                      {repo.private && (
                        <span className="text-red-500">🔒 Private</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {selectedRepo && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">
                  Issues for {selectedRepo}
                </h2>
                <button
                  onClick={() => fetchIssues(selectedRepo)}
                  disabled={loadingIssues}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {loadingIssues ? "Loading..." : "Refresh Issues"}
                </button>
              </div>

              <div className="space-y-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          <a
                            href={issue.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            #{issue.number}: {issue.title}
                          </a>
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.state === "open"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {issue.state}
                          </span>
                          <span>
                            Created:{" "}
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {issues.length === 0 && !loadingIssues && (
                  <p className="text-gray-500 text-center py-8">
                    No issues found for this repository.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
