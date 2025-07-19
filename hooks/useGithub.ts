import { useState, useEffect } from "react";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
}

interface AuthStatusResponse {
  authenticated: boolean;
  user?: GitHubUser;
}

interface RepositoriesResponse {
  repositories: Repository[];
}

interface IssuesResponse {
  issues: Issue[];
}

interface UseGitHubReturn {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  loading: boolean;
  getRepositories: () => Promise<Repository[]>;
  getIssues: (repo: string) => Promise<Issue[]>;
  disconnect: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useGitHub(): UseGitHubReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const response = await fetch("/api/integrations/github/status");
      const data: AuthStatusResponse = await response.json();

      setIsAuthenticated(data.authenticated);
      setUser(data.user || null);
    } catch (error) {
      console.error("Error checking GitHub auth status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRepositories = async (): Promise<Repository[]> => {
    try {
      const response = await fetch("/api/integrations/github/repositories");
      if (!response.ok) throw new Error("Failed to fetch repositories");

      const data: RepositoriesResponse = await response.json();
      return data.repositories;
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw error;
    }
  };

  const getIssues = async (repo: string): Promise<Issue[]> => {
    try {
      const response = await fetch(
        `/api/integrations/github/issues?repo=${encodeURIComponent(repo)}`
      );
      if (!response.ok) throw new Error("Failed to fetch issues");

      const data: IssuesResponse = await response.json();
      return data.issues;
    } catch (error) {
      console.error("Error fetching issues:", error);
      throw error;
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      const response = await fetch("/api/integrations/github/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error disconnecting GitHub:", error);
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    getRepositories,
    getIssues,
    disconnect,
    refetch: checkAuthStatus,
  };
}
