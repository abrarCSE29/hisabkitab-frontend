/* Placeholder rows shown while the entries feed loads. Mirrors the real
   VoucherFeed row layout (avatar · text · amount) so the list doesn't jump
   when data arrives, with a gentle pulse to signal activity. */

export default function VoucherFeedSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-3 w-16 animate-pulse rounded bg-stone-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3"
        >
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-stone-200" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="h-3.5 w-2/5 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-stone-100" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="h-3.5 w-14 animate-pulse rounded bg-stone-200" />
            <div className="h-2.5 w-10 animate-pulse rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
