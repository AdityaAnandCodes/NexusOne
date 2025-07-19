const { MongoClient } = require("mongodb");

async function listDatabases() {
  const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://localhost:27017/nexusone"
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log(
      "Available databases:",
      databases.databases.map((db) => db.name)
    );

    // Check current database
    const db = client.db();
    console.log("Current database name:", db.databaseName);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(
      "Collections in current database:",
      collections.map((c) => c.name)
    );

    // Check if there are documents in any collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

listDatabases();
