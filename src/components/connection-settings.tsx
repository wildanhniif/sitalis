"use client";
import { CheckCircle2, CircleAlert, Loader2, PlugZap } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

type Status = { state: "idle" | "loading" | "success" | "error"; message?: string };
function ConnectionButton({ target, label }: { target: "llm" | "crossref"; label: string }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const test = async () => {
    setStatus({ state: "loading" });
    try {
      const response = await fetch("/api/test-connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus({ state: "success", message: data.message });
    } catch (error) { setStatus({ state: "error", message: error instanceof Error ? error.message : "Koneksi gagal." }); }
  };
  return <div><Button variant="secondary" onClick={() => void test()} disabled={status.state === "loading"}>{status.state === "loading" ? <Loader2 className="animate-spin" /> : <PlugZap />}Uji koneksi {label}</Button><div className="mt-3 min-h-5 text-xs leading-5" aria-live="polite">{status.state === "success" && <p className="flex gap-2 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-4 shrink-0" />{status.message}</p>}{status.state === "error" && <p className="flex gap-2 text-red-700 dark:text-red-400"><CircleAlert className="size-4 shrink-0" />{status.message}</p>}</div></div>;
}
export function ConnectionSettings() {
  return <div className="grid gap-5 sm:grid-cols-2"><ConnectionButton target="llm" label="LLM" /><ConnectionButton target="crossref" label="Crossref" /></div>;
}
