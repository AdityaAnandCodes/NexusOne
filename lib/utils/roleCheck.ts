export const ROLES = {
  SUPER_ADMIN: "super_admin",
  COMPANY_ADMIN: "company_admin",
  HR_MANAGER: "hr_manager",
  EMPLOYEE: "employee",
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
