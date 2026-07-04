const User = require("../models/User");
const computeSalary = require("../utils/salaryCalculator");

// GET /api/salary/:employeeId — Admin/HR only
async function getSalary(req, res, next) {
  try {
    const employee = await User.findOne({ _id: req.params.employeeId, company: req.user.company });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ salary: employee.salary });
  } catch (err) {
    next(err);
  }
}

// PUT /api/salary/:employeeId — Admin/HR only, recalculates derived amounts
async function updateSalary(req, res, next) {
  try {
    const employee = await User.findOne({ _id: req.params.employeeId, company: req.user.company });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const merged = {
      ...employee.salary.toObject(),
      ...req.body,
    };

    const computed = computeSalary(merged);
    employee.salary = computed;
    await employee.save();

    res.json({ salary: employee.salary });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSalary, updateSalary };
