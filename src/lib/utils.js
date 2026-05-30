// Utility function to get current week's start date (Monday)
export const getWeekStartDate = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust when day is Sunday (getDay() returns 0)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Generates a unique list of category names based on defaults, existing expenses, and active budgets.
 * Always returns lowercase IDs.
 */
export function getUniqueCategoryNames(expenses = [], weeklyBudget = null, defaultCategories = []) {
  const catSet = new Set();
  
  // 1. Defaults
  defaultCategories.forEach(cat => catSet.add(cat.id.toLowerCase()));
  
  // 2. Budget Limits
  if (weeklyBudget && weeklyBudget.category_limits) {
    Object.keys(weeklyBudget.category_limits).forEach(cat => catSet.add(cat.toLowerCase()));
  }
  
  if (typeof window !== 'undefined') {
    try {
      const monthlyLimits = JSON.parse(localStorage.getItem('savan_monthly_category_limits') || '{}');
      Object.keys(monthlyLimits).forEach(cat => catSet.add(cat.toLowerCase()));
    } catch(e) {}
  }
  
  // 3. Past Expenses
  if (expenses && expenses.length > 0) {
    expenses.forEach(e => {
      if (e.category) catSet.add(e.category.toLowerCase());
    });
  }
  
  return Array.from(catSet).sort();
}
