const bcrypt = require("bcryptjs");
const Company = require("./models/Company");
const User = require("./models/User");
const Attendance = require("./models/Attendance");
const TimeOff = require("./models/TimeOff");
const generateLoginId = require("./utils/generateLoginId");
const computeSalary = require("./utils/salaryCalculator");

function todayStr(d) {
  return d.toISOString().slice(0, 10);
}

const DEMO_EMPLOYEES = [
  { firstName: "Rahul", lastName: "Sharma", designation: "Software Engineer", department: "Engineering", wage: 80000 },
  { firstName: "Priya", lastName: "Verma", designation: "HR Executive", department: "Human Resources", role: "hr", wage: 65000 },
  { firstName: "Aman", lastName: "Khan", designation: "Product Designer", department: "Design", wage: 72000 },
  { firstName: "Sneha", lastName: "Iyer", designation: "QA Engineer", department: "Engineering", wage: 60000 },
  { firstName: "Vikram", lastName: "Rao", designation: "Sales Manager", department: "Sales", wage: 90000 },
];

/**
 * Seeds a demo company, admin, employees, attendance, and time-off requests.
 * With `force: false` (default) it skips seeding if a company already exists —
 * used for auto-seed-on-boot against the in-memory fallback DB and real Atlas alike.
 * With `force: true` it wipes and reseeds unconditionally — used by the `npm run seed` CLI.
 */
async function seedDatabase({ force = false } = {}) {
  if (!force) {
    const existing = await Company.countDocuments();
    if (existing > 0) {
      return { seeded: false };
    }
  } else {
    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
      Attendance.deleteMany({}),
      TimeOff.deleteMany({}),
    ]);
  }

  const company = await Company.create({ name: "Odoo India", code: "OD" });

  const joiningYear = new Date().getFullYear() - 2;
  const adminLoginId = await generateLoginId({
    companyCode: company.code,
    firstName: "Ananya",
    lastName: "Joshi",
    joiningYear,
  });
  const adminPassword = "Admin@123";
  const admin = await User.create({
    company: company._id,
    loginId: adminLoginId,
    firstName: "Ananya",
    lastName: "Joshi",
    email: "admin@odooindia.com",
    phone: "9876500000",
    password: await bcrypt.hash(adminPassword, 10),
    role: "admin",
    mustChangePassword: false,
    designation: "HR Admin",
    department: "Human Resources",
    dateOfJoining: new Date(new Date().getFullYear() - 2, 0, 10),
    about: "HR Admin overseeing people operations at Odoo India.",
    salary: computeSalary({
      monthlyWage: 120000,
      basic: { type: "percentage", value: 50 },
      hra: { type: "percentage", value: 50 },
      standardAllowance: { type: "fixed", value: 5000 },
      performanceBonus: { type: "fixed", value: 5000 },
      leaveTravelAllowance: { type: "fixed", value: 3000 },
      workingDaysPerWeek: 5,
      breakTimeMinutes: 60,
    }),
  });

  const createdEmployees = [];
  let firstEmployeeCreds = null;

  for (const demo of DEMO_EMPLOYEES) {
    const empJoiningYear = new Date().getFullYear() - Math.floor(Math.random() * 3);
    const loginId = await generateLoginId({
      companyCode: company.code,
      firstName: demo.firstName,
      lastName: demo.lastName,
      joiningYear: empJoiningYear,
    });
    const tempPassword = "Welcome@123";
    const salary = computeSalary({
      monthlyWage: demo.wage,
      basic: { type: "percentage", value: 50 },
      hra: { type: "percentage", value: 50 },
      standardAllowance: { type: "fixed", value: 3000 },
      performanceBonus: { type: "fixed", value: 2000 },
      leaveTravelAllowance: { type: "fixed", value: 2000 },
      workingDaysPerWeek: 5,
      breakTimeMinutes: 60,
    });

    const employee = await User.create({
      company: company._id,
      loginId,
      firstName: demo.firstName,
      lastName: demo.lastName,
      email: `${demo.firstName.toLowerCase()}.${demo.lastName.toLowerCase()}@odooindia.com`,
      phone: `98765${Math.floor(10000 + Math.random() * 89999)}`,
      password: await bcrypt.hash(tempPassword, 10),
      role: demo.role || "employee",
      mustChangePassword: true,
      designation: demo.designation,
      department: demo.department,
      dateOfJoining: new Date(empJoiningYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 27) + 1),
      about: `${demo.firstName} works as a ${demo.designation} at Odoo India.`,
      whatILove: "Solving real problems with a great team.",
      interests: "Reading, cricket, traveling",
      skills: ["Communication", "Teamwork", "Problem Solving"],
      salary,
    });

    createdEmployees.push(employee);
    if (!firstEmployeeCreds) {
      firstEmployeeCreds = { loginId: employee.loginId, password: tempPassword };
    }
  }

  const allUsers = [admin, ...createdEmployees];
  const today = new Date();

  for (const user of allUsers) {
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const day = d.getDay();
      const date = todayStr(d);

      if (day === 0 || day === 6) continue; // skip weekends

      const roll = Math.random();
      if (roll < 0.85) {
        const checkIn = new Date(d);
        checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
        const checkOut = new Date(d);
        const isToday = i === 0;
        if (!isToday || Math.random() < 0.5) {
          checkOut.setHours(18, Math.floor(Math.random() * 30), 0, 0);
          const hours = (checkOut - checkIn) / (1000 * 60 * 60);
          await Attendance.create({
            employee: user._id,
            company: company._id,
            date,
            checkIn,
            checkOut,
            status: "present",
            workHours: +hours.toFixed(2),
            extraHours: +Math.max(hours - 8, 0).toFixed(2),
          });
        } else {
          await Attendance.create({
            employee: user._id,
            company: company._id,
            date,
            checkIn,
            status: "present",
          });
        }
      } else if (roll < 0.93) {
        const ci = new Date(d);
        ci.setHours(9, 15, 0, 0);
        await Attendance.create({
          employee: user._id,
          company: company._id,
          date,
          status: "half-day",
          checkIn: ci,
          workHours: 4,
        });
      } else {
        await Attendance.create({
          employee: user._id,
          company: company._id,
          date,
          status: "absent",
        });
      }
    }
  }

  const fmt = (d) => d.toISOString().slice(0, 10);
  const addDays = (base, n) => {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d;
  };

  const emp0Start = addDays(today, -10);
  const emp0End = addDays(today, -9);
  await TimeOff.create({
    employee: createdEmployees[0]._id,
    company: company._id,
    type: "paid",
    startDate: fmt(emp0Start),
    endDate: fmt(emp0End),
    allocationDays: 2,
    remarks: "Family function",
    status: "approved",
    reviewedBy: admin._id,
    comment: "Approved, enjoy!",
  });
  createdEmployees[0].timeOffBalance.paid -= 2;
  await createdEmployees[0].save();
  await Attendance.findOneAndUpdate(
    { employee: createdEmployees[0]._id, date: fmt(emp0Start) },
    { employee: createdEmployees[0]._id, company: company._id, date: fmt(emp0Start), status: "leave" },
    { upsert: true }
  );
  await Attendance.findOneAndUpdate(
    { employee: createdEmployees[0]._id, date: fmt(emp0End) },
    { employee: createdEmployees[0]._id, company: company._id, date: fmt(emp0End), status: "leave" },
    { upsert: true }
  );

  await TimeOff.create({
    employee: createdEmployees[1]._id,
    company: company._id,
    type: "sick",
    startDate: fmt(addDays(today, 1)),
    endDate: fmt(addDays(today, 2)),
    allocationDays: 2,
    remarks: "Fever and cold",
    attachment: "",
    status: "pending",
  });

  await TimeOff.create({
    employee: createdEmployees[2]._id,
    company: company._id,
    type: "paid",
    startDate: fmt(addDays(today, 5)),
    endDate: fmt(addDays(today, 5)),
    allocationDays: 1,
    remarks: "Personal work",
    status: "pending",
  });

  await TimeOff.create({
    employee: createdEmployees[3]._id,
    company: company._id,
    type: "unpaid",
    startDate: fmt(addDays(today, -5)),
    endDate: fmt(addDays(today, -5)),
    allocationDays: 1,
    remarks: "Personal trip",
    status: "rejected",
    reviewedBy: admin._id,
    comment: "Please plan leaves in advance next time.",
  });

  return {
    seeded: true,
    company,
    admin: { loginId: admin.loginId, password: adminPassword },
    sampleEmployee: firstEmployeeCreds,
  };
}

module.exports = seedDatabase;
