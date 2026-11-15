import type { Report } from "@/lib/types";

const globalReports = globalThis as unknown as { sitalisReports?: Map<string, Report> };
const reports = globalReports.sitalisReports ?? new Map<string, Report>();
globalReports.sitalisReports = reports;

export function saveReport(report: Report) {
  reports.set(report.id, report);
  if (reports.size > 50) {
    const oldest = reports.keys().next().value;
    if (oldest) reports.delete(oldest);
  }
}

export function getReport(id: string) {
  return reports.get(id) ?? null;
}
