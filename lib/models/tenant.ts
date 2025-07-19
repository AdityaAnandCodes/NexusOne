import mongoose from "mongoose";

// Tenant-specific schemas (for each company's isolated data)

// Employee schema (tenant database)
export interface IEmployee {
  _id: string;
  userId: string; // Reference to main database user
  employeeId: string;
  department: string;
  position: string;
  startDate: Date;
  manager?: string;
  personalInfo: {
    phone?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  onboardingStatus: {
    isCompleted: boolean;
    currentStep: number;
    completedTasks: string[];
    pendingTasks: string[];
    documentsUploaded: string[];
    lastActivityAt: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new mongoose.Schema<IEmployee>(
  {
    userId: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: Date, required: true },
    manager: String,
    personalInfo: {
      phone: String,
      address: String,
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
    },
    onboardingStatus: {
      isCompleted: { type: Boolean, default: false },
      currentStep: { type: Number, default: 0 },
      completedTasks: [String],
      pendingTasks: [String],
      documentsUploaded: [String],
      lastActivityAt: { type: Date, default: Date.now },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Onboarding Checklist schema
export interface IOnboardingChecklist {
  _id: string;
  name: string;
  description?: string;
  tasks: {
    id: string;
    title: string;
    description: string;
    type:
      | "document_upload"
      | "form_fill"
      | "acknowledgment"
      | "training"
      | "meeting";
    isRequired: boolean;
    order: number;
    estimatedMinutes?: number;
    documentTypes?: string[];
    formFields?: any[];
  }[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingChecklistSchema = new mongoose.Schema<IOnboardingChecklist>(
  {
    name: { type: String, required: true },
    description: String,
    tasks: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: {
          type: String,
          enum: [
            "document_upload",
            "form_fill",
            "acknowledgment",
            "training",
            "meeting",
          ],
          required: true,
        },
        isRequired: { type: Boolean, default: true },
        order: { type: Number, required: true },
        estimatedMinutes: Number,
        documentTypes: [String],
        formFields: [mongoose.Schema.Types.Mixed],
      },
    ],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// HR Policies schema
export interface IHRPolicy {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  version: string;
  isActive: boolean;
  documentUrl?: string;
  acknowledgmentRequired: boolean;
  effectiveDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const HRPolicySchema = new mongoose.Schema<IHRPolicy>(
  {
    title: { type: String, required: true },
    description: String,
    content: { type: String, required: true },
    category: { type: String, required: true },
    version: { type: String, default: "1.0" },
    isActive: { type: Boolean, default: true },
    documentUrl: String,
    acknowledgmentRequired: { type: Boolean, default: false },
    effectiveDate: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// FAQ schema
export interface IFAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  isActive: boolean;
  order: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new mongoose.Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true },
    tags: [String],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Chat Messages schema
export interface IChatMessage {
  _id: string;
  employeeId: string;
  message: string;
  sender: "employee" | "bot" | "hr";
  type: "text" | "quick_reply" | "file_upload" | "task_completion";
  metadata?: any;
  isRead: boolean;
  createdAt: Date;
}

const ChatMessageSchema = new mongoose.Schema<IChatMessage>(
  {
    employeeId: { type: String, required: true },
    message: { type: String, required: true },
    sender: { type: String, enum: ["employee", "bot", "hr"], required: true },
    type: {
      type: String,
      enum: ["text", "quick_reply", "file_upload", "task_completion"],
      default: "text",
    },
    metadata: mongoose.Schema.Types.Mixed,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Document schema
export interface IDocument {
  _id: string;
  employeeId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  documentType: string;
  uploadedAt: Date;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
}

const DocumentSchema = new mongoose.Schema<IDocument>({
  employeeId: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  documentType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  verifiedBy: String,
  verifiedAt: Date,
  notes: String,
});

// Function to create tenant models
export function createTenantModels(connection: mongoose.Connection) {
  return {
    Employee: connection.model<IEmployee>("Employee", EmployeeSchema),
    OnboardingChecklist: connection.model<IOnboardingChecklist>(
      "OnboardingChecklist",
      OnboardingChecklistSchema
    ),
    HRPolicy: connection.model<IHRPolicy>("HRPolicy", HRPolicySchema),
    FAQ: connection.model<IFAQ>("FAQ", FAQSchema),
    ChatMessage: connection.model<IChatMessage>(
      "ChatMessage",
      ChatMessageSchema
    ),
    Document: connection.model<IDocument>("Document", DocumentSchema),
  };
}
