"use client";
import type { Report } from "./types";

const key = "ceksitasi:reports";
export function getBrowserReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const reports = JSON.parse(localStorage.getItem(key) ?? "[]") as Report[];
    return Array.isArray(reports) ? reports : [];
  } catch { return []; }
}
export function getBrowserReport(id: string) {
  return getBrowserReports().find((report) => report.id === id) ?? null;
}
export function saveBrowserReport(report: Report) {
  const reports = [report, ...getBrowserReports().filter((item) => item.id !== report.id)].slice(0, 10);
  try { localStorage.setItem(key, JSON.stringify(reports)); return true; } catch { return false; }
}
