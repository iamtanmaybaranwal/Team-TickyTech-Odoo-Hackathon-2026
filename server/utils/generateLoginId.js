const User = require("../models/User");

/**
 * Format: [2-letter company code][first 2 letters of first name][first 2 letters of last name][year of joining][4-digit serial]
 * Example: CEJODO20220001
 */
async function generateLoginId({ companyCode, firstName, lastName, joiningYear }) {
  const namePart = `${(firstName || "XX").slice(0, 2)}${(lastName || "XX").slice(0, 2)}`.toUpperCase();
  const prefix = `${companyCode.toUpperCase()}${namePart}${joiningYear}`;

  const existing = await User.find({ loginId: new RegExp(`^${prefix}`) })
    .sort({ loginId: -1 })
    .limit(1);

  let serial = 1;
  if (existing.length) {
    const lastSerial = parseInt(existing[0].loginId.slice(-4), 10);
    serial = (isNaN(lastSerial) ? 0 : lastSerial) + 1;
  }
  const serialStr = String(serial).padStart(4, "0");
  return `${prefix}${serialStr}`;
}

module.exports = generateLoginId;
