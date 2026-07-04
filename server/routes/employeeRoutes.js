const express = require("express");
const upload = require("../middleware/upload");
const { protect, allowRoles } = require("../middleware/auth");
const {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

router.use(protect);

router.get("/", listEmployees);
router.get("/:id", getEmployee);
router.post("/", allowRoles("admin", "hr"), upload.single("profilePicture"), createEmployee);
router.put("/:id", upload.single("profilePicture"), updateEmployee);

module.exports = router;
