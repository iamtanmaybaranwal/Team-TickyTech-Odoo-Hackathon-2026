require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const seedDatabase = require("./seedData");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const timeoffRoutes = require("./routes/timeoffRoutes");
const salaryRoutes = require("./routes/salaryRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/timeoff", timeoffRoutes);
app.use("/api/salary", salaryRoutes);

app.use(notFound);
app.use(errorHandler);

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  try {
    const result = await seedDatabase({ force: false });
    if (result.seeded) {
      console.log("Database was empty — auto-seeded demo data.");
      console.log(`  Admin login: ${result.admin.loginId} / ${result.admin.password}`);
      console.log(`  Sample employee login: ${result.sampleEmployee.loginId} / ${result.sampleEmployee.password}`);
    }
  } catch (err) {
    console.error("Auto-seed failed:", err.message);
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
