const User = require("../models/User");
const TimeOff = require("../models/TimeOff");
const Attendance = require("../models/Attendance");

function daysBetweenInclusive(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

function dateRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  const e = new Date(end);
  while (cur <= e) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// POST /api/timeoff — employee applies for leave
async function applyTimeOff(req, res, next) {
  try {
    const { type, startDate, endDate, remarks } = req.body;
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ message: "Type, start date and end date are required" });
    }
    if (!["paid", "sick", "unpaid"].includes(type)) {
      return res.status(400).json({ message: "Invalid time off type" });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "End date cannot be before start date" });
    }

    const allocationDays = daysBetweenInclusive(startDate, endDate);
    const user = await User.findById(req.user._id);

    if (type === "sick" && !req.file) {
      return res.status(400).json({ message: "Attachment is required for sick leave" });
    }
    if (type === "paid" && user.timeOffBalance.paid < allocationDays) {
      return res.status(400).json({ message: "Insufficient paid time off balance" });
    }
    if (type === "sick" && user.timeOffBalance.sick < allocationDays) {
      return res.status(400).json({ message: "Insufficient sick leave balance" });
    }

    const attachment = req.file ? `/uploads/${req.file.filename}` : "";

    const request = await TimeOff.create({
      employee: user._id,
      company: req.user.company,
      type,
      startDate,
      endDate,
      allocationDays,
      remarks: remarks || "",
      attachment,
      status: "pending",
    });

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
}

// GET /api/timeoff/me
async function myTimeOff(req, res, next) {
  try {
    const requests = await TimeOff.find({ employee: req.user._id }).sort({ createdAt: -1 });
    const user = await User.findById(req.user._id);
    res.json({ requests, balance: user.timeOffBalance });
  } catch (err) {
    next(err);
  }
}

// GET /api/timeoff — Admin/HR: all requests in the company
async function allTimeOff(req, res, next) {
  try {
    const requests = await TimeOff.find({ company: req.user.company })
      .populate("employee", "firstName lastName loginId profilePicture")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
}

// PUT /api/timeoff/:id/review — Admin/HR approves or rejects
async function reviewTimeOff(req, res, next) {
  try {
    const { status, comment } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const request = await TimeOff.findOne({ _id: req.params.id, company: req.user.company });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request has already been reviewed" });
    }

    request.status = status;
    request.comment = comment || "";
    request.reviewedBy = req.user._id;
    await request.save();

    if (status === "approved") {
      const employee = await User.findById(request.employee);

      if (request.type === "paid") {
        employee.timeOffBalance.paid = Math.max(employee.timeOffBalance.paid - request.allocationDays, 0);
      } else if (request.type === "sick") {
        employee.timeOffBalance.sick = Math.max(employee.timeOffBalance.sick - request.allocationDays, 0);
      }
      await employee.save();

      const dates = dateRange(request.startDate, request.endDate);
      for (const date of dates) {
        await Attendance.findOneAndUpdate(
          { employee: request.employee, date },
          { employee: request.employee, company: request.company, date, status: "leave" },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    res.json({ request });
  } catch (err) {
    next(err);
  }
}

module.exports = { applyTimeOff, myTimeOff, allTimeOff, reviewTimeOff };
