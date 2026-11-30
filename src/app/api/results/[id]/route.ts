import { NextResponse } from "next/server";
import { getReport } from "@/lib/server/reports";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const report = getReport((await params).id);
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan atau sesi server telah berakhir." }, { status: 404 });
  return NextResponse.json(report);
}
