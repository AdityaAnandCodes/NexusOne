const { MongoClient } = require("mongodb");

async function checkOtherDatabase() {
  const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://localhost:27017/nexusone"
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Check the dateinvitation database
    const dateDb = client.db("dateinvitation");
    console.log("\n=== Checking dateinvitation database ===");

    const collections = await dateDb.listCollections().toArray();
    console.log(
      "Collections:",
      collections.map((c) => c.name)
    );

    for (const collection of collections) {
      const count = await dateDb.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);

      if (count > 0) {
        const docs = await dateDb
          .collection(collection.name)
          .find({})
          .toArray();
        console.log(`Sample documents from ${collection.name}:`, docs);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkOtherDatabase();
