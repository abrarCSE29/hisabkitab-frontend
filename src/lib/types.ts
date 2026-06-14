// Mirrors the FastAPI backend's response schemas.

export type VoucherType = "income" | "expense";

export interface Category {
  id: string;
  name_en: string;
  name_bn: string;
  type: VoucherType;
  label: string; // e.g. "Bazaar (বাজার)"
  emoji: string;
  color: string; // hex
  custom: boolean;
}

export interface CategoryCreatePayload {
  name: string;
  type: VoucherType;
  emoji: string;
  color: string; // "#rrggbb"
}

export interface VoucherItem {
  name: string;
  amount: number;
}

export interface Voucher {
  _id: string;
  family_id: string | null;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  type: VoucherType;
  heading: string | null;
  category_id: string | null;
  items: VoucherItem[];
  voucher_total: number;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FamilyMember {
  user_id: string;
  role: "admin" | "member";
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

export interface Family {
  _id: string;
  name: string;
  created_by: string;
  members: FamilyMember[];
  created_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string | null;
  name: string | null;
  avatar_url: string | null;
}

export interface VoucherCreatePayload {
  type: VoucherType;
  heading?: string | null;
  entry_date?: string | null; // "YYYY-MM-DD"; omitted/null => today
  category_id?: string | null;
  items: { name?: string; amount: number }[];
  image_url?: string | null;
  family_id?: string | null;
}

export type VoucherUpdatePayload = Omit<VoucherCreatePayload, "family_id">;

export interface OcrResult {
  items: VoucherItem[];
}

export interface MonthTotals {
  spent: number;
  earned: number;
  net: number;
}

export interface TrendPoint {
  month: string; // "2026-06"
  label: string; // "Jun"
  income: number;
  expense: number;
}

export interface CategoryTotal {
  category_id: string | null;
  total: number;
}

export interface TopExpense {
  id: string;
  heading: string | null;
  category_id: string | null;
  total: number;
  created_at: string;
}

export interface WeekdayTotal {
  weekday: number; // Mon=0 .. Sun=6
  label: string;
  total: number;
}

export interface DayTotal {
  day: number;
  total: number;
}

export interface MemberTotal {
  user_id: string;
  user_name: string | null;
  total: number;
}

export interface VoucherStats {
  month_label: string;
  days_in_month: number;
  today: number;
  month: MonthTotals;
  prev_month: MonthTotals;
  trend: TrendPoint[];
  by_category: CategoryTotal[];
  top_expenses: TopExpense[];
  by_weekday: WeekdayTotal[];
  by_day: DayTotal[];
  by_member: MemberTotal[];
}
