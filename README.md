# NexusOne - Multi-Tenant SaaS Onboarding Platform

A modern, AI-powered employee onboarding platform with multi-tenant architecture, built with Next.js, TypeScript, and MongoDB.

## 🚀 Features

- **Multi-Tenant Architecture**: Separate databases per company with secure data isolation
- **Google OAuth 2.0 Authentication**: Secure sign-in with Google accounts
- **Role-Based Access Control**: Super admin, company admin, HR manager, and employee roles
- **Conversational Onboarding**: AI-powered chat interface for employee onboarding
- **Company Customization**: Branding, logos, and custom workflows
- **Real-time Analytics**: Track onboarding progress and completion rates
- **Document Management**: Secure document upload and verification
- **Modern UI**: Sleek, responsive design with glassmorphism effects

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth 2.0
- **Database**: MongoDB with Mongoose
- **UI Components**: Radix UI, Lucide React
- **Styling**: Tailwind CSS with custom design system

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- Google OAuth 2.0 credentials

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd NexusOne
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nexusone_main

# Tenant Database Configuration
TENANT_DB_PREFIX=nexusone_tenant_

# JWT Secret for custom tokens
JWT_SECRET=your-jwt-secret-key-change-this

# Application Configuration
APP_URL=http://localhost:3000
```

### 3. Google OAuth 2.0 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env.local`

### 4. MongoDB Setup

**Option A: Local MongoDB**

```bash
# Install MongoDB locally
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Cloud)**

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string and update `MONGODB_URI` in `.env.local`

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## 🏗️ Architecture Overview

### Multi-Tenant Database Strategy

- **Main Database**: User management, company registry, platform-wide settings
- **Tenant Databases**: Company-specific data isolation
  - Format: `nexusone_tenant_{companyId}`
  - Contains: employees, onboarding data, policies, chat messages

### Authentication Flow

1. User signs in with Google OAuth 2.0
2. System checks if user exists in main database
3. If new user → Company onboarding flow
4. If existing user → Dashboard (with company context)

### Role-Based Access

- **Super Admin**: Platform management, all companies view
- **Company Admin**: Company settings, HR management
- **HR Manager**: Employee onboarding, analytics
- **Employee**: Personal onboarding chat interface

## 📁 Project Structure

```
app/
├── auth/                   # Authentication pages
│   ├── signin/            # Google OAuth sign-in
│   └── callback/          # Auth callback handler
├── onboarding/            # Onboarding flows
│   ├── company/          # Company setup
│   └── employee/         # Employee chat interface
├── dashboard/            # Main dashboard
├── api/                  # API routes
│   ├── auth/            # NextAuth.js
│   └── companies/       # Company management
components/
├── ui/                   # Reusable UI components
└── providers/           # Context providers
lib/
├── auth.ts              # NextAuth configuration
├── mongodb.ts           # Database connections
├── models/              # Database schemas
└── utils.ts             # Utility functions
```

## 🔐 Security Features

- **Data Isolation**: Each company has separate database
- **Session Management**: Secure JWT tokens with NextAuth.js
- **RBAC**: Granular permissions per role
- **Input Validation**: Server-side validation for all inputs
- **HTTPS Only**: Production security headers

## 🚦 Getting Started (Quick Demo)

1. **Start the application**: `npm run dev`
2. **Visit**: `http://localhost:3000`
3. **Click**: "Get Started" → Sign in with Google
4. **Create**: Your company workspace
5. **Explore**: Dashboard and onboarding features

## 🔄 Development Workflow

### Adding New Features

1. **Database**: Update schemas in `lib/models/`
2. **API**: Create routes in `app/api/`
3. **UI**: Build components in `components/`
4. **Pages**: Add routes in `app/`
5. **Types**: Update TypeScript definitions

### Testing Multi-Tenancy

1. Create multiple companies with different Google accounts
2. Verify data isolation between tenants
3. Test role-based access controls
4. Validate company-specific customizations

## 🎯 Roadmap

- [ ] AI-powered chat responses (OpenAI integration)
- [ ] Advanced document processing
- [ ] Mobile app (React Native)
- [ ] Slack/Teams integrations
- [ ] Advanced analytics dashboard
- [ ] Custom workflow builder
- [ ] Multi-language support
- [ ] Video onboarding modules

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Email: support@nexusone.dev
- Documentation: [docs.nexusone.dev](https://docs.nexusone.dev)

---

**Built with ❤️ for modern HR teams**
