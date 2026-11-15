import { BadgeCheck, CircleAlert, CircleHelp, TriangleAlert } from "lucide-react";
import { labelText } from "@/lib/pipeline/label";
import type { Label } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<Label, string> = {
  valid:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 dark:bg-emerald-500/15",
  partial:
    "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300 dark:bg-amber-500/15",
  suspected:
    "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300 dark:bg-rose-500/15",
  unverified:
    "border-zinc-500/25 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 dark:bg-zinc-500/15",
};
const icons = { valid: BadgeCheck, partial: TriangleAlert, suspected: CircleAlert, unverified: CircleHelp };
export function LabelBadge({ label, className }: { label: Label; className?: string }) {
  const Icon = icons[label];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight",
        styles[label],
        className
      )}
    >
      <Icon className="size-3.2 shrink-0" aria-hidden="true" />
      {labelText[label]}
    </span>
  );
}
