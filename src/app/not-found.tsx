import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return <main className="page-container flex min-h-[65vh] items-center justify-center py-16"><div className="max-w-md text-center"><FileQuestion className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-5 text-2xl font-semibold">Halaman tidak ditemukan</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Tautan mungkin tidak lengkap atau laporan sudah tidak tersedia.</p><Button asChild className="mt-6"><Link href="/">Kembali ke pemeriksaan</Link></Button></div></main>;
}
