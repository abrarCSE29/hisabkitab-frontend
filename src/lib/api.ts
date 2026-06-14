import { useAppStore } from "@/store/useAppStore";
import type {
  AuthenticatedUser,
  Category,
  Family,
  OcrResult,
  CategoryCreatePayload,
  Voucher,
  VoucherCreatePayload,
  VoucherStats,
  VoucherType,
  VoucherUpdatePayload,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function extractDetail(body: unknown): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  }
  return "Request failed";
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const token = options.token ?? useAppStore.getState().accessToken;
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, extractDetail(data));
  }
  return data as T;
}

export const api = {
  me: (token?: string) => request<AuthenticatedUser>("/auth/me", { token }),

  categories: (type?: VoucherType, familyId?: string) => {
    const q = new URLSearchParams();
    if (type) q.set("type", type);
    if (familyId) q.set("family_id", familyId);
    const qs = q.toString();
    return request<Category[]>(`/categories${qs ? `?${qs}` : ""}`);
  },

  createCategory: (payload: CategoryCreatePayload, familyId?: string) =>
    request<Category>(`/categories${familyId ? `?family_id=${familyId}` : ""}`, {
      method: "POST",
      body: payload,
    }),

  updateCategory: (id: string, payload: CategoryCreatePayload) =>
    request<Category>(`/categories/${id}`, { method: "PUT", body: payload }),

  deleteCategory: (id: string) => request<null>(`/categories/${id}`, { method: "DELETE" }),

  vouchers: (familyId?: string, limit = 50) =>
    request<Voucher[]>(
      `/vouchers?limit=${limit}${familyId ? `&family_id=${familyId}` : ""}`,
    ),

  createVoucher: (payload: VoucherCreatePayload) =>
    request<{ status: string; id: string }>("/vouchers", { method: "POST", body: payload }),

  stats: (familyId?: string) =>
    request<VoucherStats>(`/vouchers/stats${familyId ? `?family_id=${familyId}` : ""}`),

  exportVouchers: (params: { familyId?: string; start?: string; end?: string }) => {
    const q = new URLSearchParams();
    if (params.familyId) q.set("family_id", params.familyId);
    if (params.start) q.set("start", params.start);
    if (params.end) q.set("end", params.end);
    const qs = q.toString();
    return request<Voucher[]>(`/vouchers/export${qs ? `?${qs}` : ""}`);
  },

  voucher: (id: string) => request<Voucher>(`/vouchers/${id}`),

  updateVoucher: (id: string, payload: VoucherUpdatePayload) =>
    request<Voucher>(`/vouchers/${id}`, { method: "PUT", body: payload }),

  deleteVoucher: (id: string) => request<null>(`/vouchers/${id}`, { method: "DELETE" }),

  ocr: (imageUrl: string) =>
    request<OcrResult>("/vouchers/ocr", { method: "POST", body: { image_url: imageUrl } }),

  ocrFeedback: (rating: "up" | "down", imageUrl: string | null, itemCount: number) =>
    request<null>("/vouchers/ocr/feedback", {
      method: "POST",
      body: { rating, image_url: imageUrl, item_count: itemCount },
    }),

  families: () => request<Family[]>("/family"),

  createFamily: (name: string) =>
    request<{ family_id: string; name: string }>("/family", {
      method: "POST",
      body: { name },
    }),

  inviteMember: (email: string, familyId?: string) =>
    request<{ status: string }>("/family/invite", {
      method: "POST",
      body: { email, ...(familyId && { family_id: familyId }) },
    }),

  joinFamily: (code: string) =>
    request<{ family_id: string; name: string }>("/family/join", {
      method: "POST",
      body: { code },
    }),

  familyShareCode: (familyId: string) =>
    request<{ code: string }>(`/family/${familyId}/share-code`),

  rotateFamilyShareCode: (familyId: string) =>
    request<{ code: string }>(`/family/${familyId}/share-code`, { method: "POST" }),
};
