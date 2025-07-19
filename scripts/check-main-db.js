require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

async function checkMainDatabase() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    console.log("URI:", uri);
    console.log("Database name:", process.env.MONGODB_DB_NAME);

    // Check the nexusone_main database
    const db = client.db(process.env.MONGODB_DB_NAME);
    console.log("\n=== Checking", process.env.MONGODB_DB_NAME, "database ===");

    const collections = await db.listCollections().toArray();
    console.log(
      "Collections:",
      collections.map((c) => c.name)
    );

    // Check users specifically
    console.log("\n=== Checking users ===");
    const users = await db.collection("users").find({}).toArray();
    console.log("Users found:", users.length);
    users.forEach((user) => {
      console.log("- User:", {
        id: user._id,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
      });
    });

    console.log("\n=== Checking companies ===");
    const companies = await db.collection("companies").find({}).toArray();
    console.log("Companies found:", companies.length);
    companies.forEach((company) => {
      console.log("- Company:", {
        id: company._id,
        name: company.name,
      });
    });

    // If we find the problematic user, delete them
    const userEmail = "rakshabv.work@gmail.com";
    const userToDelete = await db
      .collection("users")
      .findOne({ email: userEmail });

    if (userToDelete) {
      console.log(`\n❌ Found user to delete:`, userToDelete);
      const deleteResult = await db
        .collection("users")
        .deleteOne({ email: userEmail });
      console.log(`✅ Deleted user:`, deleteResult);

      // Also delete their company if they have one
      if (userToDelete.companyId) {
        const companyDeleteResult = await db.collection("companies").deleteOne({
          _id: userToDelete.companyId,
        });
        console.log(`✅ Deleted company:`, companyDeleteResult);
      }
    } else {
      console.log(`✅ No user found with email: ${userEmail}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkMainDatabase();
