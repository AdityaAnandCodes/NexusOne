"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Invitation {
  _id: string
  email: string
  role: string
  department?: string
  position?: string
  status: 'pending' | 'accepted' | 'expired'
  invitedAt: string
  acceptedAt?: string
  generatedEmail?: string
  temporaryPassword?: string
  emailCredentialsGenerated?: boolean
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, Users, Trash2, CheckCircle, Clock, XCircle, Building2 } from "lucide-react"

interface Invitation {
  _id: string
  email: string
  role: string
  department?: string
  position?: string
  status: "pending" | "accepted" | "expired"
  invitedAt: string
  acceptedAt?: string
}

export default function EmployeeManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "employee",
    department: "",
    position: ""
  })

  // Authentication and authorization check
  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    // Check if user has HR role
    if (session?.user && !["hr_manager", "company_admin"].includes(session.user.role || "")) {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  // Load invitations
  const loadInvitations = async () => {
    try {
      const response = await fetch("/api/hr/employee-invitations")
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error("Error loading invitations:", error)
    }
  }

  // Add new employee invitation
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/hr/invite-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      })

      if (response.ok) {
        setNewEmployee({ name: "", email: "", role: "employee", department: "", position: "" })
        setShowAddForm(false)
        loadInvitations()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to send invitation")
      }
    } catch (error) {
      alert("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Delete invitation
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return

    try {
      const response = await fetch(`/api/hr/employee-invitations/${invitationId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        loadInvitations()
      }
    } catch (error) {
      console.error("Error deleting invitation:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "accepted":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
      case "expired":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  useEffect(() => {
    if (session?.user && ["hr_manager", "company_admin"].includes(session.user.role || "")) {
      loadInvitations()
    }
  }, [session])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-white mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
        </div>
      </div>
    )
  }

  // Show access denied if not authorized
  if (!session?.user || !["hr_manager", "company_admin"].includes(session.user.role || "")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/70">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Employee Management</h1>
            <p className="text-slate-600">Invite and manage your team members</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Invite Employee
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Total Invited</p>
                  <p className="text-xl font-semibold">{invitations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Accepted</p>
                  <p className="text-xl font-semibold">{invitations.filter(i => i.status === 'accepted').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="text-xl font-semibold">{invitations.filter(i => i.status === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-slate-600">Expired</p>
                  <p className="text-xl font-semibold">{invitations.filter(i => i.status === 'expired').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite New Employee</CardTitle>
            <CardDescription>
              Send an invitation to a new team member to join your company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Employee Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Personal Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="john@personal.com"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    We'll create a company Gmail account and send credentials here
                  </p>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr_manager">HR Manager</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    placeholder="e.g., Engineering, Marketing"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    placeholder="e.g., Software Engineer, Marketing Manager"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Invitations</CardTitle>
          <CardDescription>
            Manage all employee invitations and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No invitations sent yet</p>
              <p className="text-sm text-slate-400">Click "Invite Employee" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <span>{invitation.role.replace('_', ' ')}</span>
                          {invitation.department && <span>• {invitation.department}</span>}
                          {invitation.position && <span>• {invitation.position}</span>}
                        </div>
                        {invitation.generatedEmail && (
                          <div className="flex items-center space-x-2 text-sm text-emerald-600 mt-1">
                            <Mail className="w-3 h-3" />
                            <span>Company Email: {invitation.generatedEmail}</span>
                            {invitation.emailCredentialsGenerated && (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(invitation.status)}
                    <div className="text-sm text-slate-500">
                      Sent {new Date(invitation.invitedAt).toLocaleDateString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvitation(invitation._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
