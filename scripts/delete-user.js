const { MongoClient } = require("mongodb");

async function deleteUser() {
  const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://localhost:27017/nexusone"
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const usersCollection = db.collection("users");

    const email = "rakshabv.work@gmail.com";

    // Delete the user
    const result = await usersCollection.deleteOne({ email });

    if (result.deletedCount > 0) {
      console.log(`✅ Successfully deleted user with email: ${email}`);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

deleteUser();
