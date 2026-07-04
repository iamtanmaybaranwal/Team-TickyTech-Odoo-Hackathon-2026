const User = require("../models/User");
const Attendance = require("../models/Attendance");

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// POST /api/attendance/check-in
async function checkIn(req, res, next) {
  try {
    const date = todayStr();
    let record = await Attendance.findOne({ employee: req.user._id, date });
    if (record && record.checkIn) {
      return res.status(400).json({ message: "Already checked in today" });
    }
    if (!record) {
      record = new Attendance({ employee: req.user._id, company: req.user.company, date });
    }
    record.checkIn = new Date();
    record.status = "present";
    await record.save();
    res.json({ attendance: record });
  } catch (err) {
    next(err);
  }
}

// POST /api/attendance/check-out
async function checkOut(req, res, next) {
  try {
    const date = todayStr();
    const record = await Attendance.findOne({ employee: req.user._id, date });
    if (!record || !record.checkIn) {
      return res.status(400).json({ message: "You must check in before checking out" });
    }
    if (record.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }
    record.checkOut = new Date();
    const hours = (record.checkOut - record.checkIn) / (1000 * 60 * 60);
    record.workHours = +hours.toFixed(2);
    record.extraHours = +Math.max(hours - 8, 0).toFixed(2);
    await record.save();
    res.json({ attendance: record });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/status — today's dot status for the logged in user
async function myStatus(req, res, next) {
  try {
    const date = todayStr();
    const record = await Attendance.findOne({ employee: req.user._id, date });
    let status = "absent";
    if (record) status = record.status;
    res.json({ status, checkedIn: !!record?.checkIn, checkedOut: !!record?.checkOut });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/me?month=&year= — own attendance history + summary
async function myAttendance(req, res, next) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const prefix = `${year}-${String(month).padStart(2, "0")}`;

    const records = await Attendance.find({
      employee: req.user._id,
      date: { $regex: `^${prefix}` },
    }).sort({ date: 1 });

    const daysPresent = records.filter((r) => r.status === "present" || r.status === "half-day").length;
    const leaveCount = records.filter((r) => r.status === "leave").length;
    const totalWorkingDays = records.length;

    res.json({ records, summary: { daysPresent, leaveCount, totalWorkingDays } });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/today-status — lightweight presence dots for all employees (any role)
async function todayStatusAll(req, res, next) {
  try {
    const date = todayStr();
    const records = await Attendance.find({ company: req.user.company, date }).select("employee status");
    const map = {};
    records.forEach((r) => {
      map[String(r.employee)] = r.status;
    });
    res.json({ date, statuses: map });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance?date=YYYY-MM-DD — Admin/HR: all employees for a given date
async function allAttendance(req, res, next) {
  try {
    const date = req.query.date || todayStr();
    const employees = await User.find({ company: req.user.company }).select(
      "firstName lastName loginId profilePicture role"
    );
    const records = await Attendance.find({ company: req.user.company, date });
    const byEmployee = new Map(records.map((r) => [String(r.employee), r]));

    const rows = employees.map((emp) => {
      const rec = byEmployee.get(String(emp._id));
      return {
        employee: emp,
        date,
        checkIn: rec?.checkIn || null,
        checkOut: rec?.checkOut || null,
        status: rec?.status || "absent",
        workHours: rec?.workHours || 0,
        extraHours: rec?.extraHours || 0,
      };
    });

    const presentCount = rows.filter((r) => r.status === "present" || r.status === "half-day").length;
    res.json({ date, rows, presentCount, totalCount: rows.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkIn, checkOut, myStatus, myAttendance, allAttendance, todayStatusAll };
