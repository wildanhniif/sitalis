import { ResultWorkspace } from "@/components/result-workspace";
export const metadata = { title: "Laporan pemeriksaan" };
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  return <ResultWorkspace id={(await params).id} />;
}
