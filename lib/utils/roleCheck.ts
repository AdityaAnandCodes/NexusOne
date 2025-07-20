export const ROLES = {
  SUPER_ADMIN: "super_admin",
  COMPANY_ADMIN: "company_admin",
  HR_MANAGER: "hr_manager",
  EMPLOYEE: "employee",
  APPLICANT: "applicant",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const hasHRAccess = (role: string): boolean => {
  return (
    role === ROLES.HR_MANAGER ||
    role === ROLES.COMPANY_ADMIN ||
    role === ROLES.SUPER_ADMIN
  );
};

export const hasAdminAccess = (role: string): boolean => {
  return role === ROLES.COMPANY_ADMIN || role === ROLES.SUPER_ADMIN;
};

export const hasSuperAdminAccess = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN;
};

export const canManageEmployees = (role: string): boolean => {
  return hasHRAccess(role);
};

export const canConfigurePolicies = (role: string): boolean => {
  return hasHRAccess(role);
};

// New functions for applicant role
export const isApplicant = (role: string): boolean => {
  return role === ROLES.APPLICANT;
};

export const canApplyForJobs = (role: string): boolean => {
  return role === ROLES.APPLICANT;
};

export const isEmployee = (role: string): boolean => {
  return role === ROLES.EMPLOYEE;
};

export const canAccessEmployeeDashboard = (role: string): boolean => {
  return role === ROLES.EMPLOYEE;
};

// Helper function to check if user needs company association
export const requiresCompanyAssociation = (role: string): boolean => {
  return role !== ROLES.APPLICANT;
};

// Helper function to get user role display name
export const getRoleDisplayName = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    [ROLES.SUPER_ADMIN]: "Super Admin",
    [ROLES.COMPANY_ADMIN]: "Company Admin",
    [ROLES.HR_MANAGER]: "HR Manager",
    [ROLES.EMPLOYEE]: "Employee",
    [ROLES.APPLICANT]: "Job Applicant",
  };
  return roleMap[role] || role;
};

// Helper function to get role badge color
export const getRoleBadgeColor = (role: string): string => {
  const colorMap: { [key: string]: string } = {
    [ROLES.SUPER_ADMIN]: "bg-purple-100 text-purple-800",
    [ROLES.COMPANY_ADMIN]: "bg-blue-100 text-blue-800",
    [ROLES.HR_MANAGER]: "bg-green-100 text-green-800",
    [ROLES.EMPLOYEE]: "bg-gray-100 text-gray-800",
    [ROLES.APPLICANT]: "bg-orange-100 text-orange-800",
  };
  return colorMap[role] || "bg-gray-100 text-gray-800";
};
