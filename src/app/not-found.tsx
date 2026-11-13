import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="page-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/80 bg-surface-subtle text-foreground shadow-subtle">
          <FileQuestion className="size-6 text-muted-foreground" />
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">404 — Not Found</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          Tautan yang Anda tuju mungkin sudah dipindahkan atau laporan telah dihapus dari peramban.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Kembali ke beranda</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/result/demo">Buka laporan demo</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
