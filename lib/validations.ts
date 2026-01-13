import { z } from 'zod';

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

// Work Approval Schema
export const workApprovalDataSchema = z.object({
  quote_id: z.string(),
  approved_amount: z.number().positive('סכום חייב להיות חיובי'),
  start_date: z.string(),
  estimated_end_date: z.string(),
  terms_accepted: z.boolean(),
  special_conditions: z.string().optional(),
  deposit_required: z.boolean(),
  deposit_amount: z.number().min(0),
  deposit_paid: z.boolean(),
  deposit_paid_at: z.string().optional(),
});

// Completion Schema
export const completionDataSchema = z.object({
  work_approval_id: z.string(),
  actual_completion_date: z.string(),
  work_summary: z.string().min(1, 'סיכום העבודה נדרש'),
  deviations_from_quote: z.string().optional(),
  additional_charges: z.number(),
  additional_charges_reason: z.string().optional(),
  final_amount: z.number().positive('סכום סופי חייב להיות חיובי'),
  image_ids: z.array(z.string()).optional(),
  client_notes: z.string().optional(),
  warranty_start_date: z.string(),
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
