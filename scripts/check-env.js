require("dotenv").config({ path: ".env.local" });

console.log("Environment variables:");
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("MONGODB_DB_NAME:", process.env.MONGODB_DB_NAME);

// Parse the URI to extract database name
if (process.env.MONGODB_URI) {
  const uriParts = process.env.MONGODB_URI.split("/");
  const dbFromUri = uriParts[uriParts.length - 1].split("?")[0];
  console.log("Database name from URI:", dbFromUri);
}
