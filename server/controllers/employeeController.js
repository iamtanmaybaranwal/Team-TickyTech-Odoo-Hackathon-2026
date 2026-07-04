const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateLoginId = require("../utils/generateLoginId");

function randomPassword() {
  return crypto.randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) + "1!";
}

// GET /api/employees — list all employees in the caller's company
async function listEmployees(req, res, next) {
  try {
    const employees = await User.find({ company: req.user.company }).sort({ createdAt: 1 });
    res.json({ employees });
  } catch (err) {
    next(err);
  }
}

// GET /api/employees/:id
async function getEmployee(req, res, next) {
  try {
    const employee = await User.findOne({ _id: req.params.id, company: req.user.company });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ employee });
  } catch (err) {
    next(err);
  }
}

// POST /api/employees — Admin/HR creates a new employee, system auto-generates loginId + temp password
async function createEmployee(req, res, next) {
  try {
    const { firstName, lastName, email, phone, role, designation, department, dateOfJoining } = req.body;
    if (!firstName || !email) {
      return res.status(400).json({ message: "First name and email are required" });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const company = req.user.company;
    const admin = await User.findById(req.user._id).populate("company");
    const companyCode = admin.company.code;
    const joiningDate = dateOfJoining ? new Date(dateOfJoining) : new Date();
    const joiningYear = joiningDate.getFullYear();

    const loginId = await generateLoginId({ companyCode, firstName, lastName, joiningYear });
    const tempPassword = randomPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : "";

    const employee = await User.create({
      company,
      loginId,
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase(),
      phone: phone || "",
      password: hashed,
      role: role && ["admin", "hr", "employee"].includes(role) ? role : "employee",
      mustChangePassword: true,
      profilePicture,
      designation: designation || "",
      department: department || "",
      dateOfJoining: joiningDate,
    });

    res.status(201).json({
      employee,
      tempPassword, // shown once to the admin so they can share it with the new employee
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/employees/:id — Admin can edit everything; employees can edit limited fields on their own profile
async function updateEmployee(req, res, next) {
  try {
    const target = await User.findOne({ _id: req.params.id, company: req.user.company });
    if (!target) return res.status(404).json({ message: "Employee not found" });

    const isSelf = String(target._id) === String(req.user._id);
    const isAdmin = ["admin", "hr"].includes(req.user.role);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const limitedFields = ["phone", "address", "profilePicture", "about", "whatILove", "interests", "bankName", "bankAccountNo", "ifsc", "pan", "uan", "dob", "gender", "maritalStatus", "nationality"];
    const adminOnlyFields = ["firstName", "lastName", "email", "role", "designation", "department", "dateOfJoining"];

    const fieldsAllowed = isAdmin ? [...limitedFields, ...adminOnlyFields] : limitedFields;

    for (const field of fieldsAllowed) {
      if (req.body[field] !== undefined) {
        target[field] = req.body[field];
      }
    }

    if (req.body.skills !== undefined) {
      target.skills = req.body.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (req.body.certifications !== undefined) {
      target.certifications = req.body.certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (req.file) {
      target.profilePicture = `/uploads/${req.file.filename}`;
    }

    await target.save();
    res.json({ employee: target });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee };
