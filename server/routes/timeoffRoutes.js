const express = require("express");
const upload = require("../middleware/upload");
const { protect, allowRoles } = require("../middleware/auth");
const {
  applyTimeOff,
  myTimeOff,
  allTimeOff,
  reviewTimeOff,
} = require("../controllers/timeoffController");

const router = express.Router();

router.use(protect);

router.post("/", upload.single("attachment"), applyTimeOff);
router.get("/me", myTimeOff);
router.get("/", allowRoles("admin", "hr"), allTimeOff);
router.put("/:id/review", allowRoles("admin", "hr"), reviewTimeOff);

module.exports = router;
