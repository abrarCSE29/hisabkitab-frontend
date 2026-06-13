"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
}

/* Centered pop-up modal with a teal gradient header, scroll-locked body,
   backdrop dismiss, and Esc-to-close. Used for short, focused tasks. */
export default function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-40 flex items-center justify-center ${
        open ? "" : "pointer-events-none"
      }`}
    >
      <div
        onClick={onClose}
        aria-hidden
        className={`absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 m-4 flex max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 ease-out ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-4 text-white">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold leading-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-white/80">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/90 active:bg-white/20"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
