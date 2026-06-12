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

export function categoryEmoji(id: string | null | undefined): string {
  return (id && CATEGORY_EMOJI[id]) || "🧾";
}
