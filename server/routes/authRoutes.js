const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const { signup, login, getMe, changePassword } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", upload.single("logo"), signup);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

module.exports = router;
