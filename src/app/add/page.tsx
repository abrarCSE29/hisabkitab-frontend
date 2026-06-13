"use client";

import { useRouter } from "next/navigation";
import { UsersRound } from "lucide-react";
import AppBar, { BackButton } from "@/components/AppBar";
import AuthGate from "@/components/AuthGate";
import VoucherForm from "@/components/VoucherForm";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

function Composer() {
  const router = useRouter();
  const workspace = useAppStore((s) => s.workspace);

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
