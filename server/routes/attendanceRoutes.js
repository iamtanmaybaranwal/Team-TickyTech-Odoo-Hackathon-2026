const express = require("express");
const { protect, allowRoles } = require("../middleware/auth");
const {
  checkIn,
  checkOut,
  myStatus,
  myAttendance,
  allAttendance,
  todayStatusAll,
} = require("../controllers/attendanceController");

const router = express.Router();

router.use(protect);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/status", myStatus);
router.get("/today-status", todayStatusAll);
router.get("/me", myAttendance);
router.get("/", allowRoles("admin", "hr"), allAttendance);

module.exports = router;
