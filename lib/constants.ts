// VAT Rate (Israel)
export const VAT_RATE = 0.17;

// Token Expiry
export const SIGNING_TOKEN_EXPIRY_HOURS = 48;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;

// Status Colors
export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  quote_sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-purple-100 text-purple-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

// Form Type Colors
export const FORM_TYPE_COLORS = {
  quote: 'bg-blue-100 text-blue-800',
  work_approval: 'bg-green-100 text-green-800',
  completion: 'bg-purple-100 text-purple-800',
  payment: 'bg-emerald-100 text-emerald-800',
} as const;

// Navigation Items
export const NAV_ITEMS = [
  {
    href: '/',
    label: 'לוח בקרה',
    icon: 'LayoutDashboard',
  },
  {
    href: '/projects',
    label: 'פרויקטים',
    icon: 'FolderKanban',
  },
  {
    href: '/settings',
    label: 'הגדרות',
    icon: 'Settings',
  },
] as const;

// Unit Options
export const UNIT_OPTIONS = [
  { value: 'unit', label: 'יחידה' },
  { value: 'hour', label: 'שעה' },
  { value: 'day', label: 'יום' },
  { value: 'meter', label: 'מטר' },
  { value: 'sqm', label: 'מ"ר' },
  { value: 'kg', label: 'ק"ג' },
  { value: 'piece', label: 'פריט' },
] as const;

// Payment Method Options
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'מזומן' },
  { value: 'check', label: 'צ\'ק' },
  { value: 'transfer', label: 'העברה בנקאית' },
  { value: 'credit', label: 'כרטיס אשראי' },
  { value: 'bit', label: 'ביט' },
] as const;

// Status Flow - which statuses can transition to which
export const STATUS_TRANSITIONS = {
  draft: ['quote_sent', 'cancelled'],
  quote_sent: ['approved', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['paid'],
  paid: [],
  cancelled: ['draft'],
} as const;
