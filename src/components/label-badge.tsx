import { BadgeCheck, CircleAlert, CircleHelp, TriangleAlert } from "lucide-react";
import { labelText } from "@/lib/pipeline/label";
import type { Label } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<Label, string> = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  partial: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  suspected: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  unverified: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
};
const icons = { valid: BadgeCheck, partial: TriangleAlert, suspected: CircleAlert, unverified: CircleHelp };
export function LabelBadge({ label, className }: { label: Label; className?: string }) {
  const Icon = icons[label];
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold", styles[label], className)}><Icon className="size-3.5" aria-hidden="true" />{labelText[label]}</span>;
}
