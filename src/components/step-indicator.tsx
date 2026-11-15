import { Check, FileScan, ListChecks, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckStage = "input" | "ready" | "checking" | "done";
export function StepIndicator({ stage }: { stage: CheckStage }) {
  const active = stage === "input" ? 0 : stage === "ready" ? 0 : stage === "checking" ? 1 : 2;
  const steps = [
    { label: "Sumber Referensi", icon: FileScan, desc: "Pilih file naskah / teks" },
    { label: "Pencocokan Bukti", icon: ScanSearch, desc: "Crossref & LLM parsing" },
    { label: "Laporan Evaluasi", icon: ListChecks, desc: "Hasil & verifikasi manual" },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Tahap pemeriksaan">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const complete = index < active;
        const isCurrent = index === active;
        return (
          <li
            key={step.label}
            className={cn(
              "relative flex flex-col gap-1 rounded-xl border p-3 transition-all sm:p-3.5",
              isCurrent
                ? "border-foreground/30 bg-card shadow-subtle"
                : complete
                ? "border-border/60 bg-surface-subtle/50 opacity-85"
                : "border-border/40 bg-surface-subtle/20 opacity-50"
            )}
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-md text-[11px] font-semibold transition-colors",
                  complete
                    ? "bg-emerald-600 text-white dark:bg-emerald-500"
                    : isCurrent
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {complete ? <Check className="size-3.5 stroke-[2.5]" /> : index + 1}
              </span>
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isCurrent ? "text-foreground" : "text-muted-foreground/60"
                )}
              />
            </div>
            <div className="mt-1">
              <p className={cn("text-xs font-semibold tracking-tight", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </p>
              <p className="hidden text-[11px] text-muted-foreground/80 sm:block">
                {step.desc}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
