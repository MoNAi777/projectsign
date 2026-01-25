import { z } from 'zod';

// Israeli phone number regex (supports formats: 0501234567, 050-1234567, 050-123-4567)
const israeliPhoneRegex = /^0(5[0-9]|[2-4]|[8-9]|7[0-9])-?\d{3}-?\d{4}$/;

// Quote Item Schema
export const quoteItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'תיאור הפריט נדרש'),
  quantity: z.number().positive('כמות חייבת להיות חיובית'),
  unit: z.string(),
  unit_price: z.number().min(0, 'מחיר לא יכול להיות שלילי'),
  total: z.number(),
});

// Quote Data Schema
export const quoteDataSchema = z.object({
  items: z.array(quoteItemSchema).min(1, 'נדרש לפחות פריט אחד'),
  subtotal: z.number(),
  vat_rate: z.number(),
  vat_amount: z.number(),
  total: z.number(),
  valid_until: z.string(),
  notes: z.string().optional(),
  payment_terms: z.string().optional(),
  warranty_terms: z.string().optional(),
});

// Work Approval Schema (הזמנת עבודה / אישור ביצוע)
export const workApprovalDataSchema = z.object({
  site_name: z.string().min(1, 'שם האתר / כתובת נדרש'),
  quote_reference: z.string().optional(),
  start_date: z.string().min(1, 'תאריך תחילת ביצוע נדרש'),
  work_details: z.string().min(1, 'פירוט העבודה נדרש'),
  notes: z.string().optional(),
  additions: z.string().optional(),
  contact_name: z.string().min(1, 'שם איש קשר נדרש'),
  contact_phone: z.string().min(1, 'טלפון נדרש').regex(israeliPhoneRegex, 'מספר טלפון לא תקין'),
  infrastructure_declaration: z.boolean().refine(val => val === true, {
    message: 'יש לאשר את ההצהרה לגבי תשתיות',
  }),
});

// Completion Schema (טופס הגשת עבודה ושביעות רצון לקוח)
export const completionDataSchema = z.object({
  site_name: z.string().min(1, 'שם האתר / כתובת נדרש'),
  order_number: z.string().optional(),
  work_date: z.string().min(1, 'תאריך ביצוע העבודה נדרש'),
  // Satisfaction ratings (1-5)
  satisfaction_overall: z.number().min(1).max(5),
  satisfaction_site_conduct: z.number().min(1).max(5),
  satisfaction_work_quality: z.number().min(1).max(5),
  satisfaction_appearance: z.number().min(1).max(5),
  satisfaction_worker_behavior: z.number().min(1).max(5),
  feedback_notes: z.string().optional(),
  legal_disclaimer_accepted: z.boolean().refine(val => val === true, {
    message: 'יש לאשר את סעיף ההגנה והיעדר טענות עתידיות',
  }),
});

// Payment Schema
export const paymentDataSchema = z.object({
  completion_id: z.string(),
  amount_due: z.number().positive('סכום לתשלום חייב להיות חיובי'),
  amount_paid: z.number().positive('סכום ששולם חייב להיות חיובי'),
  payment_method: z.enum(['cash', 'check', 'transfer', 'credit', 'bit']),
  reference_number: z.string().optional(),
  paid_at: z.string(),
  receipt_number: z.string().optional(),
  remaining_balance: z.number().min(0),
  notes: z.string().optional(),
});

// Contact Schema
export const contactSchema = z.object({
  name: z.string().min(1, 'שם נדרש'),
  phone: z.string().optional(),
  email: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

// Project Schema
export const projectSchema = z.object({
  name: z.string().min(1, 'שם הפרויקט נדרש'),
  description: z.string().optional(),
});

// Create Project with Contact
export const createProjectSchema = z.object({
  project: projectSchema,
  contact: contactSchema.optional(),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
});

// Register Schema
export const registerSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'שם מלא נדרש'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'הסיסמאות אינן תואמות',
  path: ['confirmPassword'],
});

// Type exports
export type QuoteItemForm = z.infer<typeof quoteItemSchema>;
export type QuoteDataForm = z.infer<typeof quoteDataSchema>;
export type WorkApprovalDataForm = z.infer<typeof workApprovalDataSchema>;
export type CompletionDataForm = z.infer<typeof completionDataSchema>;
export type PaymentDataForm = z.infer<typeof paymentDataSchema>;
export type ContactForm = z.infer<typeof contactSchema>;
export type ProjectForm = z.infer<typeof projectSchema>;
export type CreateProjectForm = z.infer<typeof createProjectSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
