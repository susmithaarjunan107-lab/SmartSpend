export const DEFAULT_CATEGORIES = [
  { id: 'exp_food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#C42333', isCustom: false },
  { id: 'exp_groceries', name: 'Groceries', type: 'expense', icon: 'ShoppingCart', color: '#0F7A56', isCustom: false },
  { id: 'exp_transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#1D6FBF', isCustom: false },
  { id: 'exp_housing', name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#3D4C8A', isCustom: false },
  { id: 'exp_utilities', name: 'Utilities', type: 'expense', icon: 'Zap', color: '#B86E00', isCustom: false },
  { id: 'exp_health', name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#C43E78', isCustom: false },
  { id: 'exp_shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#6D4AFF', isCustom: false },
  { id: 'exp_entertainment', name: 'Entertainment', type: 'expense', icon: 'Clapperboard', color: '#0E8A8A', isCustom: false },
  { id: 'exp_education', name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#185FA5', isCustom: false },
  { id: 'exp_travel', name: 'Travel', type: 'expense', icon: 'Plane', color: '#8A5A2A', isCustom: false },
  { id: 'exp_care', name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#A33B68', isCustom: false },
  { id: 'exp_subscriptions', name: 'Subscriptions', type: 'expense', icon: 'Repeat', color: '#5B45C6', isCustom: false },
  { id: 'exp_emi', name: 'EMI & Loans', type: 'expense', icon: 'Landmark', color: '#2C4C7C', isCustom: false },
  { id: 'exp_other', name: 'Other', type: 'expense', icon: 'Tag', color: '#5C6B7A', isCustom: false },
  { id: 'inc_salary', name: 'Salary', type: 'income', icon: 'Wallet', color: '#0F7A56', isCustom: false },
  { id: 'inc_freelance', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#1D6FBF', isCustom: false },
  { id: 'inc_business', name: 'Business', type: 'income', icon: 'Briefcase', color: '#0E8A8A', isCustom: false },
  { id: 'inc_investments', name: 'Investments', type: 'income', icon: 'TrendingUp', color: '#0F7A56', isCustom: false },
  { id: 'inc_gifts', name: 'Gifts', type: 'income', icon: 'Gift', color: '#B86E00', isCustom: false },
  { id: 'inc_other', name: 'Other Income', type: 'income', icon: 'PiggyBank', color: '#3D4C8A', isCustom: false },
];

export function getAllCategories(customCategories = []) {
  return [...DEFAULT_CATEGORIES, ...customCategories];
}

export function findCategory(categories, id) {
  return categories.find((category) => category.id === id) || null;
}

export function categoryName(categories, id) {
  return findCategory(categories, id)?.name || 'Unknown category';
}

export function categoriesForType(categories, type) {
  return categories.filter((category) => category.type === type);
}

export function categoryNameTaken(name, type, categories, exceptId) {
  const needle = String(name || '').trim().toLowerCase();
  return categories.some(
    (category) =>
      category.id !== exceptId &&
      category.type === type &&
      category.name.trim().toLowerCase() === needle,
  );
}
