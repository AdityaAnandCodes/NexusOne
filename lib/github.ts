import { NextRequest } from "next/server";

interface GitHubUserEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: string | null;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  [key: string]: any;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  [key: string]: any;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface SearchRepositoriesResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

interface RepositoryOptions {
  sort?: "created" | "updated" | "pushed" | "full_name";
  perPage?: number;
  type?: "all" | "owner" | "public" | "private" | "member";
}

interface IssueOptions {
  state?: "open" | "closed" | "all";
  perPage?: number;
}

interface SearchOptions {
  sort?: "stars" | "forks" | "help-wanted-issues" | "updated";
  perPage?: number;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface UserCookieData {
  access_token: string;
  [key: string]: any;
}

// GitHub API utility functions
export class GitHubAPI {
  private accessToken: string;
  private baseURL: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.baseURL = "https://api.github.com";
  }

  async makeRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  async getUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>("/user");
  }

  async getUserEmails(): Promise<GitHubUserEmail[]> {
    return this.makeRequest<GitHubUserEmail[]>("/user/emails");
  }

  async getUserRepositories(
    options: RepositoryOptions = {}
  ): Promise<GitHubRepository[]> {
    const params = new URLSearchParams({
      sort: options.sort || "updated",
      per_page: (options.perPage || 50).toString(),
      type: options.type || "all",
    });

    return this.makeRequest<GitHubRepository[]>(`/user/repos?${params}`);
  }

  async getRepositoryIssues(
    owner: string,
    repo: string,
    options: IssueOptions = {}
  ): Promise<GitHubIssue[]> {
    const params = new URLSearchParams({
      state: options.state || "all",
      per_page: (options.perPage || 50).toString(),
    });

    return this.makeRequest<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?${params}`
    );
  }

  async searchRepositories(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchRepositoriesResponse> {
    const params = new URLSearchParams({
      q: query,
      sort: options.sort || "updated",
      per_page: (options.perPage || 50).toString(),
    });

    return this.makeRequest<SearchRepositoriesResponse>(
      `/search/repositories?${params}`
    );
  }

  // Check if user has access to a repository
  async hasRepositoryAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.makeRequest(`/repos/${owner}/${repo}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Grant access based on email (check if user's email matches allowed emails)
  async checkEmailAccess(allowedEmails: string[]): Promise<boolean> {
    try {
      const emails = await this.getUserEmails();
      const userEmails = emails.map((email) => email.email);

      return allowedEmails.some((email) => userEmails.includes(email));
    } catch (error) {
      console.error("Error checking email access:", error);
      return false;
    }
  }
}

// Helper function to get GitHub API instance from request
export function getGitHubAPIFromRequest(request: NextRequest): GitHubAPI {
  const userCookie = request.cookies.get("github_user");

  if (!userCookie) {
    throw new Error("Not authenticated");
  }

  const userData: UserCookieData = JSON.parse(userCookie.value);
  return new GitHubAPI(userData.access_token);
}
