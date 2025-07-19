"use client";

import { useState, useEffect } from "react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  type: string;
}

interface AuthStatus {
  authenticated: boolean;
  user?: UserInfo;
  workspace_name?: string;
}

interface NotionPage {
  id: string;
  title: string;
  url: string;
  created_time?: string;
  last_edited_time?: string;
}

export default function NotionDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Pages state
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [pageContent, setPageContent] = useState<any>(null);

  // Create page state
  const [newPageTitle, setNewPageTitle] = useState<string>("");
  const [newPageContent, setNewPageContent] = useState<string>("");
  const [parentPageId, setParentPageId] = useState<string>("");

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPages();
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/integrations/notion/status");
      if (response.ok) {
        const data: AuthStatus = await response.json();
        setIsAuthenticated(data.authenticated);
        setUserInfo(data.user || null);
        setWorkspaceName(data.workspace_name || "");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

  const handleNotionAuth = () => {
    setLoading(true);
    const clientId = "235d872b-594c-80bd-bdd4-003721b75def";
    // Change callback URL to match settings:
    const redirectUri = `${window.location.origin}/api/integrations/notion/callback`;
    const state = Math.random().toString(36).substring(7);

    // Change from sessionStorage to cookie to match settings:
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

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/integration/notion/disconnect", {
        method: "POST",
      });
      if (response.ok) {
        setIsAuthenticated(false);
        setUserInfo(null);
        setWorkspaceName("");
        setPages([]);
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/notion/pages");
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const fetchPageContent = async (pageId: string) => {
    try {
      const response = await fetch(`/api/notion/pages/${pageId}`);
      if (response.ok) {
        const data = await response.json();
        setPageContent(data);
      }
    } catch (error) {
      console.error("Error fetching page content:", error);
    }
  };

  const createPage = async () => {
    if (!newPageTitle.trim()) return;

    try {
      const response = await fetch("/api/notion/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPageTitle,
          content: newPageContent,
          parent_page_id: parentPageId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPages([...pages, data.page]);
        setNewPageTitle("");
        setNewPageContent("");
        setParentPageId("");
        alert("Page created successfully!");
      } else {
        const error = await response.json();
        alert(`Error creating page: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating page:", error);
      alert("Error creating page");
    }
  };

  const handlePageSelect = (page: NotionPage) => {
    setSelectedPage(page);
    fetchPageContent(page.id);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8 font-sans">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-12">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Notion Integration
          </h1>
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Connect your Notion workspace to manage pages and content.
            </p>
            <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                This integration will allow you to:
              </h3>
              <ul className="space-y-2 text-gray-700 ml-4">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Create and manage Notion pages
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Fetch and display page content
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Organize pages with parent-child relationships
                </li>
              </ul>
            </div>
            <button
              onClick={handleNotionAuth}
              disabled={loading}
              className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 transform hover:scale-105"
              } text-white shadow-lg`}
            >
              {loading ? "Connecting..." : "Connect with Notion"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Notion Dashboard
              </h1>
              {userInfo && (
                <p className="text-gray-600 mt-2">
                  Welcome, {userInfo.name} • {workspaceName}
                </p>
              )}
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8">
            {["overview", "pages", "create"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "create" ? "Create Page" : tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Total Pages
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {pages.length}
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  Connected
                </h3>
                <p className="text-lg font-semibold text-purple-600">
                  ✅ Active
                </p>
              </div>
            </div>
          )}

          {activeTab === "pages" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Your Pages
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => handlePageSelect(page)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPage?.id === page.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <h3 className="font-medium text-gray-800">
                        {page.title}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {page.id}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                {selectedPage ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                      Page Details
                    </h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2 text-gray-800">
                        {selectedPage.title}
                      </h3>
                      <p className="text-sm text-gray-700 mb-2">
                        ID: {selectedPage.id}
                      </p>
                      <a
                        href={selectedPage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Open in Notion →
                      </a>
                      {pageContent && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2 text-gray-800">
                            Content Preview:
                          </h4>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-800">
                            {JSON.stringify(pageContent, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    Select a page to view details
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "create" && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Create New Page
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Title *
                  </label>
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    placeholder="Enter page title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Content
                  </label>
                  <textarea
                    value={newPageContent}
                    onChange={(e) => setNewPageContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    placeholder="Enter initial content..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Page (Optional)
                  </label>
                  <select
                    value={parentPageId}
                    onChange={(e) => setParentPageId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  >
                    <option value="">No parent (top-level page)</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={createPage}
                  disabled={!newPageTitle.trim()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    newPageTitle.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Create Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
