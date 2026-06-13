"use client";

import { CheckCircle2 } from "lucide-react";

/* Lightweight confirmation overlay shown right after a save succeeds. It gives
   instant positive feedback and covers the brief gap while the next screen
   (re)loads its data. Typically paired with a short auto-redirect. */

interface SuccessModalProps {
  open: boolean;
  title: string;
  message?: string;
}

export default function SuccessModal({ open, title, message }: SuccessModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-[1px]" />
      <div className="relative w-full max-w-xs scale-100 rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
        </div>
        <p className="text-base font-bold text-stone-900">{title}</p>
        {message && <p className="mt-1 text-sm text-stone-500">{message}</p>}
      </div>
    </div>
  );
}
