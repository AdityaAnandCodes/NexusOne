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

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status");
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

    const clientId = "235d872b-594c-80bd-bdd4-003721b75def"; // Use your actual client ID
    const redirectUri = `${window.location.origin}/api/auth/callback`;
    const state = Math.random().toString(36).substring(7);

    sessionStorage.setItem("oauth_state", state);

    // Construct the URL with proper encoding
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      owner: "user",
      redirect_uri: redirectUri,
      state: state,
    });

    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;

    console.log("Redirecting to:", notionAuthUrl); // Debug log
    window.location.href = notionAuthUrl;
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/auth/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setIsAuthenticated(false);
        setUserInfo(null);
        setWorkspaceName("");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-12">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Notion Integration
        </h1>

        {!isAuthenticated ? (
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Connect your Notion workspace to access your pages, databases, and
              content.
            </p>

            <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                This integration will request access to:
              </h3>
              <ul className="space-y-2 text-gray-700 ml-4">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Read and write access to your Notion pages
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Access to your databases and their content
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Ability to create and modify content
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  User information and workspace details
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
        ) : (
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                ✅ Successfully Connected!
              </h2>
              {userInfo && (
                <div className="bg-green-50 p-6 rounded-lg text-left max-w-md mx-auto">
                  <p className="mb-2">
                    <span className="font-semibold text-gray-700">User:</span>{" "}
                    <span className="text-gray-900">{userInfo.name}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold text-gray-700">Email:</span>{" "}
                    <span className="text-gray-900">{userInfo.email}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">
                      Workspace:
                    </span>{" "}
                    <span className="text-gray-900">{workspaceName}</span>
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleDisconnect}
              className="px-8 py-3 text-lg font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
