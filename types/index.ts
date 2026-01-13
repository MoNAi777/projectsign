// Project Status
export type ProjectStatus =
  | 'draft'
  | 'quote_sent'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'cancelled';

// Form Types
export type FormType = 'quote' | 'work_approval' | 'completion' | 'payment';

// Payment Methods
export type PaymentMethod = 'cash' | 'check' | 'transfer' | 'credit' | 'bit';

// Database Types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  project_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: string;
  project_id: string;
  type: FormType;
  data: QuoteData | WorkApprovalData | CompletionData | PaymentData;
  signature_url?: string;
  signature_hash?: string;
  signed_at?: string;
  signed_by?: string;
  signer_ip?: string;
  signer_user_agent?: string;
  pdf_url?: string;
  sent_at?: string;
  sent_via?: 'email' | 'sms' | 'whatsapp';
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  project_id: string;
  form_id?: string;
  url: string;
  storage_path: string;
  caption?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface SigningToken {
  id: string;
  form_id: string;
  token: string;
  expires_at: string;
  used_at?: string;
  used_ip?: string;
  used_user_agent?: string;
  is_used: boolean;
  created_at: string;
}

// Form Data Types
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface QuoteData {
  items: QuoteItem[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  valid_until: string;
  notes?: string;
  payment_terms?: string;
  warranty_terms?: string;
}

export interface WorkApprovalData {
  quote_id: string;
  approved_amount: number;
  start_date: string;
  estimated_end_date: string;
  terms_accepted: boolean;
  special_conditions?: string;
  deposit_required: boolean;
  deposit_amount: number;
  deposit_paid: boolean;
  deposit_paid_at?: string;
}

export interface CompletionData {
  work_approval_id: string;
  actual_completion_date: string;
  work_summary: string;
  deviations_from_quote?: string;
  additional_charges: number;
  additional_charges_reason?: string;
  final_amount: number;
  image_ids?: string[];
  client_notes?: string;
  warranty_start_date: string;
}

export interface PaymentData {
  completion_id: string;
  amount_due: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  paid_at: string;
  receipt_number?: string;
  remaining_balance: number;
  notes?: string;
}

// Extended Types with Relations
export interface ProjectWithContact extends Project {
  contact?: Contact;
}

export interface ProjectWithForms extends Project {
  contact?: Contact;
  forms?: Form[];
}

export interface FormWithProject extends Form {
  project?: Project;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_projects: number;
  draft_projects: number;
  active_projects: number;
  completed_projects: number;
  pending_signatures: number;
  total_revenue: number;
}

// Hebrew Labels
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'טיוטה',
  quote_sent: 'הצעה נשלחה',
  approved: 'אושר',
  in_progress: 'בביצוע',
  completed: 'הושלם',
  paid: 'שולם',
  cancelled: 'בוטל',
};

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  quote: 'הצעת מחיר',
  work_approval: 'אישור עבודה',
  completion: 'אישור סיום',
  payment: 'אישור תשלום',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'מזומן',
  check: 'צ\'ק',
  transfer: 'העברה בנקאית',
  credit: 'כרטיס אשראי',
  bit: 'ביט',
};

export const UNIT_LABELS: Record<string, string> = {
  unit: 'יחידה',
  hour: 'שעה',
  day: 'יום',
  meter: 'מטר',
  sqm: 'מ"ר',
  kg: 'ק"ג',
  piece: 'פריט',
};
