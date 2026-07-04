const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Company = require("../models/Company");
const User = require("../models/User");
const generateLoginId = require("../utils/generateLoginId");
const generateToken = require("../utils/generateToken");

function makeCompanyCode(name) {
  const letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 2) || "CO").padEnd(2, "X");
}

function randomPassword() {
  return crypto.randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) + "1!";
}

// POST /api/auth/signup — creates a new company + its first Admin user
async function signup(req, res, next) {
  try {
    const { companyName, firstName, lastName, email, phone, password, confirmPassword } = req.body;

    if (!companyName || !firstName || !email || !password) {
      return res.status(400).json({ message: "Company name, name, email and password are required" });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const code = makeCompanyCode(companyName);
    const logoUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const company = await Company.create({ name: companyName, code, logoUrl });

    const joiningYear = new Date().getFullYear();
    const loginId = await generateLoginId({ companyCode: code, firstName, lastName, joiningYear });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      company: company._id,
      loginId,
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase(),
      phone: phone || "",
      password: hashed,
      role: "admin",
      mustChangePassword: false,
      dateOfJoining: new Date(),
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: await User.findById(user._id).populate("company"),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ message: "Login ID/Email and password are required" });
    }

    const identifier = loginId.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ loginId: loginId.trim() }, { email: identifier }],
    }).populate("company");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate("company");
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/change-password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await User.findById(req.user._id);
    if (currentPassword) {
      const match = await user.comparePassword(currentPassword);
      if (!match) return res.status(401).json({ message: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, getMe, changePassword, randomPassword, makeCompanyCode };
