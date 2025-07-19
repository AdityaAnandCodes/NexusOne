import { NextRequest, NextResponse } from "next/server";

interface GitHubUserInfo {
  id: string;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  access_token: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");

    console.log("Issues API called with repo:", repo);

    const userCookie = request.cookies.get("github_user");

    if (!userCookie) {
      console.error("No GitHub user cookie found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!repo) {
      return NextResponse.json(
        { error: "Repository parameter required" },
        { status: 400 }
      );
    }

    // Validate repository format (should be "owner/repo")
    if (!repo.includes("/") || repo.split("/").length !== 2) {
      return NextResponse.json(
        { error: "Invalid repository format. Use 'owner/repo'" },
        { status: 400 }
      );
    }

    const userData: GitHubUserInfo = JSON.parse(userCookie.value);
    console.log("User data found:", {
      login: userData.login,
      hasToken: !!userData.access_token,
    });

    // First, verify the token and repository access
    const repoCheckResponse = await fetch(
      `https://api.github.com/repos/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${userData.access_token}`,
          Accept: "application/json",
          "User-Agent": "YourApp/1.0",
        },
      }
    );

    console.log("Repository check response:", {
      status: repoCheckResponse.status,
      statusText: repoCheckResponse.statusText,
    });

    if (!repoCheckResponse.ok) {
      const errorText = await repoCheckResponse.text();
      console.error("Repository check failed:", errorText);

      if (repoCheckResponse.status === 401) {
        return NextResponse.json(
          { error: "GitHub token is invalid or expired" },
          { status: 401 }
        );
      }
      if (repoCheckResponse.status === 404) {
        return NextResponse.json(
          { error: "Repository not found or you don't have access to it" },
          { status: 404 }
        );
      }
      if (repoCheckResponse.status === 403) {
        return NextResponse.json(
          {
            error:
              "Access forbidden. Check your token permissions or rate limits",
          },
          { status: 403 }
        );
      }

      throw new Error(
        `Repository check failed: ${repoCheckResponse.status} ${repoCheckResponse.statusText}`
      );
    }

    // Fetch repository issues
    const issuesResponse = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=all&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${userData.access_token}`,
          Accept: "application/json",
          "User-Agent": "YourApp/1.0",
        },
      }
    );

    console.log("Issues fetch response:", {
      status: issuesResponse.status,
      statusText: issuesResponse.statusText,
    });

    if (!issuesResponse.ok) {
      const errorText = await issuesResponse.text();
      console.error("Issues fetch failed:", errorText);

      throw new Error(
        `Failed to fetch issues: ${issuesResponse.status} ${issuesResponse.statusText}`
      );
    }

    const issues = await issuesResponse.json();

    // Handle case where issues is not an array
    if (!Array.isArray(issues)) {
      console.error("Unexpected issues response:", issues);
      return NextResponse.json(
        { error: "Invalid response from GitHub API" },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched ${issues.length} issues`);

    // Format issue data with null checks
    const formattedIssues = issues.map((issue: any) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title || "No title",
      body: issue.body || "",
      state: issue.state,
      html_url: issue.html_url,
      user: {
        login: issue.user?.login || "unknown",
        avatar_url: issue.user?.avatar_url || "",
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      labels: (issue.labels || []).map((label: any) => ({
        name: label.name || "",
        color: label.color || "000000",
      })),
    }));

    return NextResponse.json({ issues: formattedIssues });
  } catch (error) {
    console.error("Error fetching issues:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch issues",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
