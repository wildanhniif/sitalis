import { benchmarkRunSchema } from "@/lib/benchmark";
import { addBenchmarkRun, listBenchmarkRuns, rankBenchmarkRuns } from "@/lib/benchmark-store";

export const runtime = "nodejs";

/** Daftar run untuk leaderboard, terurut macro-F1 tertinggi. */
export async function GET() {
  return Response.json({ runs: rankBenchmarkRuns(listBenchmarkRuns()) });
}

/** Impor satu run dari isi metrics.json hasil CLI evaluasi (npm run eval). */
export async function POST(request: Request) {
  try {
    const parsed = benchmarkRunSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "metrics.json tidak valid. Pastikan file dihasilkan oleh npm run eval." }, { status: 400 });
    }
    const run = addBenchmarkRun({ ...parsed.data, isDemo: false });
    return Response.json({ run }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gagal menyimpan run." }, { status: 500 });
  }
}
