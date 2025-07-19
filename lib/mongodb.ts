import mongoose from "mongoose";

// Main database connection (for user management and tenant mapping)
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToMainDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB_NAME,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Tenant-specific database connection
export async function connectToTenantDB(companyId: string) {
  const tenantDbName = `${process.env.TENANT_DB_PREFIX}${companyId}`;
  const connection = mongoose.createConnection(MONGODB_URI, {
    dbName: tenantDbName,
    bufferCommands: false,
  });

  return connection;
}
