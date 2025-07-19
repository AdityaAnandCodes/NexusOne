import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Force Node.js runtime for NextAuth
export const runtime = "nodejs";
