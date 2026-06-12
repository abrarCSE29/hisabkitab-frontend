import { parseIso } from "@/lib/format";
import type { Voucher } from "@/lib/types";

export type VoucherSort = "newest" | "amount_desc" | "amount_asc";

export interface VoucherFilters {
  memberIds: string[]; // creator user_ids (family workspace)
  categoryIds: string[];
  sort: VoucherSort;
  dateFrom: string | null; // yyyy-mm-dd
  dateTo: string | null;
}

export const EMPTY_FILTERS: VoucherFilters = {
  memberIds: [],
  categoryIds: [],
  sort: "newest",
  dateFrom: null,
  dateTo: null,
};

export function countActiveFilters(filters: VoucherFilters): number {
  return (
    (filters.memberIds.length > 0 ? 1 : 0) +
    (filters.categoryIds.length > 0 ? 1 : 0) +
    (filters.sort !== "newest" ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0)
  );
}

export function applyVoucherFilters(vouchers: Voucher[], filters: VoucherFilters): Voucher[] {
  let result = vouchers;

  if (filters.memberIds.length > 0) {
    result = result.filter((v) => filters.memberIds.includes(v.user_id));
  }
  if (filters.categoryIds.length > 0) {
    result = result.filter(
      (v) => v.category_id !== null && filters.categoryIds.includes(v.category_id),
    );
  }
  if (filters.dateFrom) {
    const from = new Date(`${filters.dateFrom}T00:00:00`);
    result = result.filter((v) => parseIso(v.created_at) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(`${filters.dateTo}T23:59:59.999`);
    result = result.filter((v) => parseIso(v.created_at) <= to);
  }

  if (filters.sort === "amount_desc") {
    result = [...result].sort((a, b) => b.voucher_total - a.voucher_total);
  } else if (filters.sort === "amount_asc") {
    result = [...result].sort((a, b) => a.voucher_total - b.voucher_total);
  }
  return result;
}
