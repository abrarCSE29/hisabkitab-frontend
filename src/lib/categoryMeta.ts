// Visual identity for each backend category id.
const CATEGORY_EMOJI: Record<string, string> = {
  bazaar: "🛒",
  dining: "🍛",
  transport: "🛺",
  rent: "🏠",
  utilities: "💡",
  health: "💊",
  education: "📚",
  shopping: "🛍️",
  entertainment: "🎬",
  others: "📦",
  salary: "💼",
  business: "🏪",
  gift: "🎁",
  other_income: "💰",
};

// A distinct, soft tint per category so the feed reads at a glance by colour.
// Each entry is `bg + text` Tailwind classes for the rounded avatar tile.
const CATEGORY_COLOR: Record<string, string> = {
  bazaar: "bg-emerald-100 text-emerald-700",
  dining: "bg-orange-100 text-orange-700",
  transport: "bg-amber-100 text-amber-700",
  rent: "bg-indigo-100 text-indigo-700",
  utilities: "bg-sky-100 text-sky-700",
  health: "bg-rose-100 text-rose-700",
  education: "bg-blue-100 text-blue-700",
  shopping: "bg-pink-100 text-pink-700",
  entertainment: "bg-violet-100 text-violet-700",
  others: "bg-stone-100 text-stone-600",
  salary: "bg-teal-100 text-teal-700",
  business: "bg-cyan-100 text-cyan-700",
  gift: "bg-fuchsia-100 text-fuchsia-700",
  other_income: "bg-green-100 text-green-700",
};

// Solid hex per category for SVG charts (donut), tuned to echo CATEGORY_COLOR.
const CATEGORY_HEX: Record<string, string> = {
  bazaar: "#059669",
  dining: "#ea580c",
  transport: "#d97706",
  rent: "#4f46e5",
  utilities: "#0284c7",
  health: "#e11d48",
  education: "#2563eb",
  shopping: "#db2777",
  entertainment: "#7c3aed",
  others: "#78716c",
  salary: "#0d9488",
  business: "#0891b2",
  gift: "#c026d3",
  other_income: "#16a34a",
};

export function categoryEmoji(id: string | null | undefined): string {
  return (id && CATEGORY_EMOJI[id]) || "🧾";
}

export function categoryColor(id: string | null | undefined): string {
  return (id && CATEGORY_COLOR[id]) || "bg-stone-100 text-stone-600";
}

export function categoryHex(id: string | null | undefined): string {
  return (id && CATEGORY_HEX[id]) || "#a8a29e";
}
