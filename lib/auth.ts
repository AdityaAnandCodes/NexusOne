import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB_NAME,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user ID and tenant info to session
      if (session.user) {
        session.user.id = user.id;

        // Check if user belongs to a company/tenant
        const userDoc = await client
          .db(process.env.MONGODB_DB_NAME)
          .collection("users")
          .findOne({ email: session.user.email });

        if (userDoc?.companyId) {
          session.user.companyId = userDoc.companyId;
          session.user.role = userDoc.role || "employee";
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          // Check if user already exists in our system
          const existingUser = await client
            .db(process.env.MONGODB_DB_NAME)
            .collection("users")
            .findOne({ email: user.email });

          if (existingUser) {
            // User exists but OAuth account isn't linked
            // Let's link the account manually
            const db = client.db(process.env.MONGODB_DB_NAME);

            // Check if account is already linked
            const existingAccount = await db.collection("accounts").findOne({
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            });

            if (!existingAccount) {
              // Link the OAuth account to the existing user
              await db.collection("accounts").insertOne({
                userId: existingUser._id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; // Allow sign in to continue
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
  },
});
