import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EMPTY_FILTERS, type VoucherFilters } from "@/lib/filters";
import type { AuthenticatedUser, Category, Family, Voucher } from "@/lib/types";

export type Workspace =
  | { mode: "solo" }
  | { mode: "family"; familyId: string; familyName: string };

interface AppState {
  // Session
  accessToken: string | null;
  user: AuthenticatedUser | null;
  authReady: boolean;
  setSession: (token: string, user: AuthenticatedUser) => void;
  clearSession: () => void;
  markAuthReady: () => void;
  setWalkthroughSeen: (seen: boolean) => void;
  setFamilyCoachmarkSeen: (seen: boolean) => void;

  // Workspace (solo vs family) — persisted across visits
  workspace: Workspace;
  setWorkspace: (workspace: Workspace) => void;

  // True once persisted state has been read back from localStorage. Pages must
  // wait for this before acting on `workspace`, otherwise the first paint shows
  // the default (solo) and an entry can be filed against the wrong workspace.
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // Caches to avoid redundant round-trips while navigating
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  families: Family[];
  setFamilies: (families: Family[]) => void;
  vouchers: Voucher[];
  setVouchers: (vouchers: Voucher[]) => void;

  // Feed filters (session-only)
  filters: VoucherFilters;
  setFilters: (patch: Partial<VoucherFilters>) => void;
  resetFilters: () => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      authReady: false,
      setSession: (accessToken, user) => set({ accessToken, user, authReady: true }),
      clearSession: () =>
        set({ accessToken: null, user: null, workspace: { mode: "solo" }, vouchers: [] }),
      markAuthReady: () => set({ authReady: true }),
      setWalkthroughSeen: (seen) =>
        set((state) => ({
          user: state.user ? { ...state.user, walkthrough_seen: seen } : state.user,
        })),
      setFamilyCoachmarkSeen: (seen) =>
        set((state) => ({
          user: state.user ? { ...state.user, family_coachmark_seen: seen } : state.user,
        })),

      workspace: { mode: "solo" },
      // Member filters don't carry meaning across workspaces — reset on switch.
      setWorkspace: (workspace) => set({ workspace, vouchers: [], filters: EMPTY_FILTERS }),

      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      categories: [],
      setCategories: (categories) => set({ categories }),
      families: [],
      setFamilies: (families) => set({ families }),
      vouchers: [],
      setVouchers: (vouchers) => set({ vouchers }),

      filters: EMPTY_FILTERS,
      setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
      resetFilters: () => set({ filters: EMPTY_FILTERS }),
      filterOpen: false,
      setFilterOpen: (filterOpen) => set({ filterOpen }),
    }),
    {
      name: "hisabkitab-workspace",
      partialize: (state) => ({ workspace: state.workspace }),
      onRehydrateStorage: () => (state) => {
        // Fires after localStorage has been read back (or attempted).
        state?.setHasHydrated(true);
      },
    },
  ),
);
