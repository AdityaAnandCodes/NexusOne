import mongoose from "mongoose";

// Main database schemas (for platform management)

// Company/Tenant schema
export interface ICompany {
  _id: string;
  name: string;
  domain: string;
  logo?: string;
  primaryColor?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  subscription: {
    plan: "free" | "pro" | "enterprise";
    status: "active" | "cancelled" | "suspended";
    expiresAt?: Date;
  };
  settings: {
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    customDomain?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new mongoose.Schema<ICompany>(
  {
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
    logo: String,
    primaryColor: { type: String, default: "#3b82f6" },
    contactEmail: { type: String, required: true },
    contactPhone: String,
    address: String,
    isActive: { type: Boolean, default: true },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "cancelled", "suspended"],
        default: "active",
      },
      expiresAt: Date,
    },
    settings: {
      allowSelfRegistration: { type: Boolean, default: false },
      requireEmailVerification: { type: Boolean, default: true },
      customDomain: String,
    },
  },
  { timestamps: true }
);

// User schema (main database)
export interface IUser {
  _id: string;
  email: string;
  name: string;
  image?: string;
  companyId?: string;
  role: "super_admin" | "company_admin" | "hr_manager" | "employee";
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: String,
    companyId: String,
    role: {
      type: String,
      enum: ["super_admin", "company_admin", "hr_manager", "employee"],
      default: "employee",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// Export models
export const Company =
  mongoose.models.Company || mongoose.model("Company", CompanySchema);
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
