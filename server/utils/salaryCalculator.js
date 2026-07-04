function componentAmount(component, base) {
  if (!component) return 0;
  if (component.type === "fixed") return Number(component.value) || 0;
  return ((Number(component.value) || 0) / 100) * base;
}

/**
 * Recalculates all derived salary amounts from monthlyWage + component configs.
 * Basic is % of wage (or fixed). HRA is % of Basic (or fixed).
 * Standard Allowance / Performance Bonus / Leave Travel Allowance are % of wage (or fixed).
 * Fixed Allowance = wage - sum(all other components). PF = 12% of Basic.
 * Throws if configured components exceed the wage.
 */
function computeSalary(salary) {
  const wage = Number(salary.monthlyWage) || 0;

  const basicAmount = componentAmount(salary.basic, wage);
  const hraAmount = componentAmount(salary.hra, basicAmount);
  const standardAllowanceAmount = componentAmount(salary.standardAllowance, wage);
  const performanceBonusAmount = componentAmount(salary.performanceBonus, wage);
  const leaveTravelAllowanceAmount = componentAmount(salary.leaveTravelAllowance, wage);

  const totalOthers =
    basicAmount + hraAmount + standardAllowanceAmount + performanceBonusAmount + leaveTravelAllowanceAmount;

  if (totalOthers > wage) {
    const err = new Error("Total of salary components exceeds the monthly wage");
    err.statusCode = 400;
    throw err;
  }

  const fixedAllowanceAmount = Math.max(wage - totalOthers, 0);
  const pfEmployee = +(0.12 * basicAmount).toFixed(2);
  const pfEmployer = +(0.12 * basicAmount).toFixed(2);

  return {
    ...salary,
    monthlyWage: wage,
    yearlyWage: wage * 12,
    basic: { ...salary.basic, amount: +basicAmount.toFixed(2) },
    hra: { ...salary.hra, amount: +hraAmount.toFixed(2) },
    standardAllowance: { ...salary.standardAllowance, amount: +standardAllowanceAmount.toFixed(2) },
    performanceBonus: { ...salary.performanceBonus, amount: +performanceBonusAmount.toFixed(2) },
    leaveTravelAllowance: { ...salary.leaveTravelAllowance, amount: +leaveTravelAllowanceAmount.toFixed(2) },
    fixedAllowance: +fixedAllowanceAmount.toFixed(2),
    pfEmployee,
    pfEmployer,
    professionalTax: salary.professionalTax ?? 200,
  };
}

module.exports = computeSalary;
