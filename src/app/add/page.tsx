"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import VoucherForm from "@/components/VoucherForm";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

function Composer() {
  const router = useRouter();
  const workspace = useAppStore((s) => s.workspace);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-stone-200"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold">New entry</h1>
        {workspace.mode === "family" && (
          <span className="ml-auto rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            👪 {workspace.familyName}
          </span>
        )}
      </header>

      <VoucherForm
        submitLabel="Save"
        onSubmit={async (payload) => {
          await api.createVoucher({
            ...payload,
            family_id: workspace.mode === "family" ? workspace.familyId : null,
          });
          router.push("/dashboard");
        }}
      />
    </div>
  );
}

export default function AddPage() {
  return (
    <AuthGate>
      <Composer />
    </AuthGate>
  );
}
