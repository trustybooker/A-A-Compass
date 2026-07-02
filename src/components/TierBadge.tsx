import { TIERS, type TierId } from "@/lib/tiers";

const STYLES: Record<TierId, string> = {
  free: "bg-stone-200 text-stone-700",
  plus: "bg-amber-100 text-amber-800 border border-amber-300",
  pro: "bg-emerald-100 text-emerald-800 border border-emerald-300",
};

export function TierBadge({ tier }: { tier: TierId }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[tier]}`}>
      {TIERS[tier].label}
    </span>
  );
}
