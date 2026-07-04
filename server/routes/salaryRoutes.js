const express = require("express");
const { protect, allowRoles } = require("../middleware/auth");
const { getSalary, updateSalary } = require("../controllers/salaryController");

const router = express.Router();

router.use(protect, allowRoles("admin", "hr"));

router.get("/:employeeId", getSalary);
router.put("/:employeeId", updateSalary);

module.exports = router;
