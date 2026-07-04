const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const componentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["fixed", "percentage"], default: "percentage" },
    value: { type: Number, default: 0 }, // amount if fixed, % of wage/basic if percentage
    amount: { type: Number, default: 0 }, // computed final amount
  },
  { _id: false }
);

const salarySchema = new mongoose.Schema(
  {
    monthlyWage: { type: Number, default: 0 },
    yearlyWage: { type: Number, default: 0 },
    workingDaysPerWeek: { type: Number, default: 5 },
    breakTimeMinutes: { type: Number, default: 60 },
    basic: { type: componentSchema, default: () => ({ type: "percentage", value: 50, amount: 0 }) },
    hra: { type: componentSchema, default: () => ({ type: "percentage", value: 50, amount: 0 }) }, // % of basic
    standardAllowance: { type: componentSchema, default: () => ({ type: "fixed", value: 0, amount: 0 }) },
    performanceBonus: { type: componentSchema, default: () => ({ type: "fixed", value: 0, amount: 0 }) },
    leaveTravelAllowance: { type: componentSchema, default: () => ({ type: "fixed", value: 0, amount: 0 }) },
    fixedAllowance: { type: Number, default: 0 }, // = wage - total of all other components
    pfEmployee: { type: Number, default: 0 }, // 12% of basic
    pfEmployer: { type: Number, default: 0 }, // 12% of basic
    professionalTax: { type: Number, default: 200 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    loginId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: "", trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "hr", "employee"], default: "employee" },
    mustChangePassword: { type: Boolean, default: false },
    profilePicture: { type: String, default: "" },
    dateOfJoining: { type: Date, default: Date.now },
    designation: { type: String, default: "" },
    department: { type: String, default: "" },

    // Resume tab
    about: { type: String, default: "" },
    whatILove: { type: String, default: "" },
    interests: { type: String, default: "" },
    skills: [{ type: String }],
    certifications: [{ type: String }],

    // Private info tab
    address: { type: String, default: "" },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    maritalStatus: { type: String, enum: ["Single", "Married", "Other", ""], default: "" },
    nationality: { type: String, default: "" },
    bankName: { type: String, default: "" },
    bankAccountNo: { type: String, default: "" },
    ifsc: { type: String, default: "" },
    pan: { type: String, default: "" },
    uan: { type: String, default: "" },

    salary: { type: salarySchema, default: () => ({}) },

    timeOffBalance: {
      paid: { type: Number, default: 24 },
      sick: { type: Number, default: 7 },
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.fullName = function () {
  return `${this.firstName} ${this.lastName}`.trim();
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
