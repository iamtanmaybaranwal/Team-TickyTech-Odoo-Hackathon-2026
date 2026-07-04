const mongoose = require("mongoose");

// Tries the configured Atlas URI first (for real deployments/demo networks).
// If that network blocks/fails the connection (common on restrictive campus
// or corporate networks that block MongoDB's TLS port), falls back to a local
// in-memory MongoDB so development is never blocked.
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("MongoDB connected (Atlas)");
    return;
  } catch (err) {
    console.warn("Atlas MongoDB connection failed:", err.message);
    console.warn("Falling back to a local in-memory MongoDB instance for this session...");
  }

  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mem = await MongoMemoryServer.create();
    const memUri = mem.getUri("hrms");
    await mongoose.connect(memUri);
    console.log("MongoDB connected (in-memory fallback)");
    process.on("exit", () => mem.stop());
  } catch (err) {
    console.error("Failed to start fallback MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
