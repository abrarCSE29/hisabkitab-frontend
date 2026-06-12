// Mirrors the FastAPI backend's response schemas.

export type VoucherType = "income" | "expense";

export interface Category {
  id: string;
  name_en: string;
  name_bn: string;
  type: VoucherType;
  label: string; // e.g. "Bazaar (বাজার)"
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
  category_id?: string | null;
  items: { name?: string; amount: number }[];
  image_url?: string | null;
  family_id?: string | null;
}

export type VoucherUpdatePayload = Omit<VoucherCreatePayload, "family_id">;

export interface OcrResult {
  items: VoucherItem[];
}
