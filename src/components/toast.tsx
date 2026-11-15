"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Button } from "./ui/button";

type Toast = { id: number; title: string; description?: string; variant?: "error" };
const ToastContext = createContext<(toast: Omit<Toast, "id">) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));
  const toast = useCallback((value: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((current) => [...current.slice(-2), { ...value, id }]);
    setTimeout(() => dismiss(id), 5000);
  }, []);
  const context = useMemo(() => toast, [toast]);
  return <ToastContext.Provider value={context}>
    {children}
    <div className="fixed bottom-5 right-5 z-50 flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2.5" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => <div key={item.id} className="card flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-float">
        {item.variant === "error" ? <CircleAlert className="mt-0.5 size-4.5 shrink-0 text-red-600 dark:text-red-400" /> : <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{item.title}</p>{item.description && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.description}</p>}</div>
        <Button variant="ghost" size="icon" className="-mr-1.5 -mt-1.5 size-7 min-h-7 rounded-md text-muted-foreground hover:text-foreground" onClick={() => dismiss(item.id)} aria-label="Tutup notifikasi"><X className="size-3.5" /></Button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);
