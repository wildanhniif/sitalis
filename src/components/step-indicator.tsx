import { Check, FileScan, ListChecks, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckStage = "input" | "ready" | "checking" | "done";
export function StepIndicator({ stage }: { stage: CheckStage }) {
  const active = stage === "input" ? 0 : stage === "ready" ? 0 : stage === "checking" ? 1 : 2;
  const steps = [{ label: "Ekstraksi", icon: FileScan }, { label: "Pemeriksaan", icon: ScanSearch }, { label: "Laporan", icon: ListChecks }];
  return <ol className="flex items-center" aria-label="Tahap pemeriksaan">
    {steps.map((step, index) => { const Icon = step.icon; const complete = index < active; return <li key={step.label} className={cn("flex items-center", index < 2 && "flex-1")}>
      <div className="flex items-center gap-2"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors", complete && "border-emerald-600 bg-emerald-600 text-white", index === active && "border-primary bg-primary text-primary-foreground", index > active && "bg-background text-muted-foreground")} aria-current={index === active ? "step" : undefined}>{complete ? <Check className="size-4" /> : <Icon className="size-3.5" />}</span><span className={cn("hidden text-xs font-medium sm:block", index <= active ? "text-foreground" : "text-muted-foreground")}>{step.label}</span></div>
      {index < 2 && <span className={cn("mx-2 h-px flex-1 sm:mx-3", index < active ? "bg-emerald-600" : "bg-border")} />}
    </li>; })}
  </ol>;
}
