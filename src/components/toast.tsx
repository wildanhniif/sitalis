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
    <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => <div key={item.id} className="card flex items-start gap-3 p-4 shadow-lg">
        {item.variant === "error" ? <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-700 dark:text-red-400" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />}
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p>{item.description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>}</div>
        <Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-8 min-h-8" onClick={() => dismiss(item.id)} aria-label="Tutup notifikasi"><X /></Button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);
