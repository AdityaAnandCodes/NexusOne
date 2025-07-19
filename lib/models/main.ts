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
  industry?: string;
  description?: string;
  website?: string;
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
  onboarding: {
    welcomeMessage?: string;
    policies: {
      handookUrl?: string;
      handookFileId?: string; // ADD THIS
      codeOfConductUrl?: string;
      codeOfConductFileId?: string; // ADD THIS
      privacyPolicyUrl?: string;
      privacyPolicyFileId?: string; // ADD THIS
      safePolicyUrl?: string;
      safePolicyFileId?: string; // ADD THIS
      benefitsUrl?: string;
      benefitsFileId?: string; // ADD THIS
      customPolicies: Array<{
        name: string;
        url: string;
        fileId?: string; // ADD THIS
        required: boolean;
        uploadedAt: Date;
      }>;
    };
    tasks?: Array<{
      id: string;
      title: string;
      description: string;
      required: boolean;
      order: number;
      category: "documentation" | "setup" | "training" | "compliance";
    }>;
    faq?: Array<{
      question: string;
      answer: string;
      category: string;
    }>;
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
    industry: String,
    description: String,
    website: String,
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
    onboarding: {
      welcomeMessage: {
        type: String,
        default: "Welcome to our team! We're excited to have you on board.",
      },
      policies: {
        // Standard policies with URL, FileID, and extracted text
        handookUrl: String,
        handookFileId: String,
        handookText: String, // ADD THIS for extracted text

        codeOfConductUrl: String,
        codeOfConductFileId: String,
        codeOfConductText: String, // ADD THIS

        privacyPolicyUrl: String,
        privacyPolicyFileId: String,
        privacyPolicyText: String, // ADD THIS

        safePolicyUrl: String,
        safePolicyFileId: String,
        safePolicyText: String, // ADD THIS

        benefitsUrl: String,
        benefitsFileId: String,
        benefitsText: String, // ADD THIS

        customPolicies: [
          {
            name: String,
            url: String,
            fileId: String,
            extractedText: String, // ADD THIS for custom policies
            required: { type: Boolean, default: false },
            uploadedAt: { type: Date, default: Date.now },
          },
        ],
      },
      tasks: [
        {
          id: String,
          title: String,
          description: String,
          required: { type: Boolean, default: false },
          order: { type: Number, default: 0 },
          category: {
            type: String,
            enum: ["documentation", "setup", "training", "compliance"],
            default: "documentation",
          },
        },
      ],
      faq: [
        {
          question: String,
          answer: String,
          category: String,
        },
      ],
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

// Employee Onboarding Progress schema
export interface IEmployeeOnboarding {
  _id: string;
  employeeId: string;
  companyId: string;
  status: "not_started" | "in_progress" | "completed";
  startedAt?: Date;
  completedAt?: Date;
  tasks: Array<{
    taskId: string;
    title: string;
    status: "pending" | "in_progress" | "completed" | "skipped";
    completedAt?: Date;
    notes?: string;
  }>;
  policies: Array<{
    policyName: string;
    policyUrl: string;
    acknowledged: boolean;
    acknowledgedAt?: Date;
    required: boolean;
  }>;
  documents: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
    verified: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;
  }>;
  chatSessions: Array<{
    sessionId: string;
    startedAt: Date;
    endedAt?: Date;
    messageCount: number;
    lastActivity: Date;
  }>;
  satisfactionScore?: number;
  feedback?: string;
}

const EmployeeOnboardingSchema = new mongoose.Schema<IEmployeeOnboarding>(
  {
    employeeId: { type: String, required: true },
    companyId: { type: String, required: true },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    startedAt: Date,
    completedAt: Date,
    tasks: [
      {
        taskId: String,
        title: String,
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "skipped"],
          default: "pending",
        },
        completedAt: Date,
        notes: String,
      },
    ],
    policies: [
      {
        policyName: String,
        policyUrl: String,
        acknowledged: { type: Boolean, default: false },
        acknowledgedAt: Date,
        required: { type: Boolean, default: false },
      },
    ],
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        verifiedBy: String,
      },
    ],
    chatSessions: [
      {
        sessionId: String,
        startedAt: { type: Date, default: Date.now },
        endedAt: Date,
        messageCount: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now },
      },
    ],
    satisfactionScore: { type: Number, min: 1, max: 5 },
    feedback: String,
  },
  { timestamps: true }
);

// Employee invitation schema (for HR to pre-register employees)
export interface IEmployeeInvitation {
  _id: string;
  email: string;
  phone?: string;
  skills?: string[];
  companyId: string;
  role: "hr_manager" | "employee";
  department?: string;
  position?: string;
  invitedBy: string; // User ID of the HR who invited
  status: "pending" | "accepted" | "expired";
  invitedAt: Date;
  acceptedAt?: Date;
  expiresAt: Date;
  // Generated email credentials for the employee
  generatedEmail?: string;
  temporaryPassword?: string;
  emailCredentialsGenerated?: boolean;
}

const EmployeeInvitationSchema = new mongoose.Schema<IEmployeeInvitation>(
  {
    email: { type: String, required: true },
    phone: String,
    skills: [String],
    companyId: { type: String, required: true },
    role: {
      type: String,
      enum: ["hr_manager", "employee"],
      default: "employee",
    },
    department: String,
    position: String,
    invitedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    // Generated email credentials
    generatedEmail: String,
    temporaryPassword: String,
    emailCredentialsGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create compound index for unique email per company
EmployeeInvitationSchema.index({ email: 1, companyId: 1 }, { unique: true });

// Create indexes for onboarding
EmployeeOnboardingSchema.index(
  { employeeId: 1, companyId: 1 },
  { unique: true }
);

// Export models
export const Company =
  mongoose.models.Company || mongoose.model("Company", CompanySchema);
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const EmployeeInvitation =
  mongoose.models.EmployeeInvitation ||
  mongoose.model("EmployeeInvitation", EmployeeInvitationSchema);
export const EmployeeOnboarding =
  mongoose.models.EmployeeOnboarding ||
  mongoose.model("EmployeeOnboarding", EmployeeOnboardingSchema);
