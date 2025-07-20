"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Suspense } from "react";

interface InvitationDetails {
  _id: string;
  email: string;
  companyName: string;
  role: string;
  department?: string;
  position?: string;
  inviterName: string;
  generatedEmail?: string;
  temporaryPassword?: string;
  status: string;
}

function InvitationAcceptanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  const invitationId = searchParams.get("invitation");

  useEffect(() => {
    if (!invitationId) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    fetchInvitationDetails();
  }, [invitationId]);

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(
        `/api/hr/employee-invitations/${invitationId}`
      );

      if (response.ok) {
        const data = await response.json();
        setInvitation(data.invitation);
      } else {
        setError("Invitation not found or expired");
      }
    } catch (error) {
      setError("Failed to load invitation details");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (status !== "authenticated") {
      // Redirect to sign in first
      signIn("google", {
        callbackUrl: `/onboarding/invitation?invitation=${invitationId}`,
      });
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch(
        `/api/hr/employee-invitations/${invitationId}/accept`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        router.push("/dashboard");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to accept invitation");
      }
    } catch (error) {
      setError("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
            <h1 className="text-3xl font-bold">
              🎉 Welcome to {invitation?.companyName}!
            </h1>
            <p className="mt-2 text-blue-100">
              You've been invited to join the team
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Invitation Details
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <strong>Role:</strong> {invitation?.role}
                </div>
                {invitation?.department && (
                  <div>
                    <strong>Department:</strong> {invitation.department}
                  </div>
                )}
                {invitation?.position && (
                  <div>
                    <strong>Position:</strong> {invitation.position}
                  </div>
                )}
                <div>
                  <strong>Invited by:</strong> {invitation?.inviterName}
                </div>
              </div>
            </div>

            {/* Email Credentials Section */}
            {invitation?.generatedEmail && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  🔐 Your Company Email Credentials
                </h3>
                <p className="text-green-700 mb-3">
                  A company email account has been created for you!
                </p>
                <div className="bg-white p-3 rounded border space-y-2 font-mono text-sm">
                  <div>
                    <strong>Email:</strong> {invitation.generatedEmail}
                  </div>
                  <div>
                    <strong>Password:</strong>{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {invitation.temporaryPassword}
                    </code>
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-2">
                  ⚠️ <strong>Important:</strong> Please change your password
                  after first login for security.
                </p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> These are currently test credentials.
                    In production, this would integrate with your company's
                    email system (Gmail Workspace, Office 365, etc.)
                  </p>
                </div>
              </div>
            )}

            {/* Authentication Status */}
            {status === "loading" ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Checking authentication...</p>
              </div>
            ) : status === "unauthenticated" ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Please sign in to accept this invitation
                </p>
                <button
                  onClick={() =>
                    signIn("google", {
                      callbackUrl: `/onboarding/invitation?invitation=${invitationId}`,
                    })
                  }
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign In with Google
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Signed in as: <strong>{session?.user?.email}</strong>
                </p>
                {session?.user?.email === invitation?.email ? (
                  <button
                    onClick={handleAcceptInvitation}
                    disabled={accepting}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                  >
                    {accepting
                      ? "Accepting..."
                      : "Accept Invitation & Join Team"}
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-amber-600 mb-4">
                      ⚠️ You're signed in with a different email than the
                      invitation was sent to.
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Invitation sent to: <strong>{invitation?.email}</strong>
                    </p>
                    <button
                      onClick={() =>
                        signIn("google", {
                          callbackUrl: `/onboarding/invitation?invitation=${invitationId}`,
                        })
                      }
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Sign In with Correct Account
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function InvitationLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
            <h1 className="text-3xl font-bold">Loading Invitation...</h1>
            <p className="mt-2 text-blue-100">
              Please wait while we prepare your invitation
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invitation details...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvitationAcceptance() {
  return (
    <Suspense fallback={<InvitationLoadingFallback />}>
      <InvitationAcceptanceContent />
    </Suspense>
  );
}
