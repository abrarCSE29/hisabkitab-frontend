"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound, UsersRound } from "lucide-react";
import AppBar, { BackButton } from "@/components/AppBar";
import AuthGate from "@/components/AuthGate";
import SuccessModal from "@/components/SuccessModal";
import VoucherForm from "@/components/VoucherForm";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

function Composer() {
  const router = useRouter();
  const workspace = useAppStore((s) => s.workspace);
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-dvh">
      <AppBar
        title="New entry"
        leading={<BackButton />}
        trailing={
          workspace.mode === "family" ? (
            <span className="mr-1 flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/30">
              <UsersRound className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="max-w-24 truncate">{workspace.familyName}</span>
            </span>
          ) : undefined
        }
      />

      <div className="px-4 pt-5">
        {/* Always show where this entry will be filed, so it can never land in
            the wrong workspace silently. */}
        <div
          className={`mb-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
            workspace.mode === "family"
              ? "bg-teal-50 text-teal-800"
              : "bg-stone-100 text-stone-700"
          }`}
        >
          {workspace.mode === "family" ? (
            <UsersRound className="h-4 w-4 shrink-0" strokeWidth={2} />
          ) : (
            <UserRound className="h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          <span className="min-w-0">
            Saving to{" "}
            <span className="font-bold">
              {workspace.mode === "family" ? workspace.familyName : "Personal"}
            </span>
          </span>
        </div>

        <VoucherForm
          submitLabel="Save"
          onSubmit={async (payload) => {
            await api.createVoucher({
              ...payload,
              family_id: workspace.mode === "family" ? workspace.familyId : null,
            });
            setSaved(true);
            setTimeout(() => router.push("/dashboard"), 1200);
          }}
        />
      </div>

      <SuccessModal open={saved} title="Entry added" message="Taking you to your entries…" />
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
