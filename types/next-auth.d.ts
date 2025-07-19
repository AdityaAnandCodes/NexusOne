import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      companyId?: string;
      role?: "super_admin" | "company_admin" | "hr_manager" | "employee";
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    companyId?: string;
    role?: "super_admin" | "company_admin" | "hr_manager" | "employee";
  }
}
