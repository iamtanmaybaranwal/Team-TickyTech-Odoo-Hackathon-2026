require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const seedDatabase = require("./seedData");

async function run() {
  await connectDB();
  console.log("Seeding database (force reseed)...");
  const result = await seedDatabase({ force: true });

  console.log("\n=== SEED COMPLETE ===");
  console.log(`Company: ${result.company.name} (code: ${result.company.code})`);
  console.log(`Admin login: ${result.admin.loginId}  password: ${result.admin.password}`);
  console.log(`Sample employee login: ${result.sampleEmployee.loginId}  password: ${result.sampleEmployee.password}`);
  console.log("======================\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
