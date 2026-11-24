import { removeBenchmarkRun, rankBenchmarkRuns } from "@/lib/benchmark-store";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json({ runs: rankBenchmarkRuns(removeBenchmarkRun(id)) });
}
