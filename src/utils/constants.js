export const STORAGE_KEY = 'smartspend.data';
export const STORAGE_BACKUP_KEY = 'smartspend.data.invalid';
export const SCHEMA_VERSION = 1;
export const APP_NAME = 'SmartSpend';

export const PAGE_SIZE = 8;

export const CURRENCIES = [
  { code: 'INR', locale: 'en-IN', label: 'Indian Rupee (₹)' },
  { code: 'USD', locale: 'en-US', label: 'US Dollar ($)' },
  { code: 'EUR', locale: 'de-DE', label: 'Euro (€)' },
  { code: 'GBP', locale: 'en-GB', label: 'British Pound (£)' },
];

export const DATE_FORMATS = [
  { id: 'dd MMM yyyy', label: '22 Oct 2026' },
  { id: 'dd/MM/yyyy', label: '22/10/2026' },
  { id: 'MM/dd/yyyy', label: '10/22/2026' },
  { id: 'yyyy-MM-dd', label: '2026-10-22' },
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Bank Transfer',
  'Wallet',
  'Cheque',
  'Other',
];

export const FREQUENCIES = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export const CATEGORY_COLORS = [
  '#0F7A56',
  '#1D6FBF',
  '#C42333',
  '#B86E00',
  '#6D4AFF',
  '#0E8A8A',
  '#C43E78',
  '#3E6B4F',
  '#8A5A2A',
  '#3D4C8A',
  '#0F6E8C',
  '#7A4E2D',
];

export const CATEGORY_ICONS = [
  'Utensils',
  'ShoppingCart',
  'Car',
  'Home',
  'Zap',
  'HeartPulse',
  'ShoppingBag',
  'Clapperboard',
  'GraduationCap',
  'Plane',
  'Sparkles',
  'Repeat',
  'Landmark',
  'Tag',
  'Wallet',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'Gift',
  'PawPrint',
  'Coffee',
  'Dumbbell',
  'BookOpen',
  'Music',
  'Wifi',
  'Smartphone',
  'Fuel',
  'Shirt',
  'PiggyBank',
  'Bus',
];

export const PREFERENCE_DEFAULTS = {
  currency: 'INR',
  dateFormat: 'dd MMM yyyy',
  dashboardMonth: 'current',
  theme: 'light',
  displayName: 'My finances',
};

export const EMPTY_META = {
  demoPromptSeen: false,
  demoLoaded: false,
  lastViewedMonth: null,
};
