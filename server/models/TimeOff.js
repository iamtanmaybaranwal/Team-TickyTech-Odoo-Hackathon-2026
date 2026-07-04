const mongoose = require("mongoose");

const timeOffSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    type: { type: String, enum: ["paid", "sick", "unpaid"], required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true }, // YYYY-MM-DD
    allocationDays: { type: Number, required: true },
    remarks: { type: String, default: "" },
    attachment: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimeOff", timeOffSchema);
