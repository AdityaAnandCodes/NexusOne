import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Types for the GitHub user data and repository
interface GitHubUser {
  access_token: string;
  [key: string]: any; // For other user properties
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  [key: string]: any; // For other properties from GitHub API
}

interface FormattedRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userCookie = request.cookies.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userData: GitHubUser = JSON.parse(userCookie.value);

    // Fetch user repositories
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=50",
      {
        headers: {
          Authorization: `Bearer ${userData.access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!reposResponse.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repositories: GitHubRepository[] = await reposResponse.json();

    // Filter and format repository data
    const formattedRepos: FormattedRepository[] = repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at,
    }));

    return NextResponse.json({ repositories: formattedRepos });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
