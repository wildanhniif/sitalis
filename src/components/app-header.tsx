import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="page-container flex h-14 items-center justify-between gap-4 sm:h-16">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 font-medium tracking-tight text-foreground transition-opacity hover:opacity-90"
            aria-label="Sitalis, beranda"
          >
            <span className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-surface-subtle text-foreground shadow-subtle sm:size-8">
              <BookOpenCheck className="size-3.5 text-foreground sm:size-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm sm:text-base">Sitalis</span>
              <span className="hidden rounded-full border border-border/70 bg-surface-subtle px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground sm:inline-block">
                beta
              </span>
            </div>
          </Link>

          <span className="hidden h-4 w-px bg-border/70 md:block" />

          <p className="hidden text-xs text-muted-foreground lg:block">
            Verifikasi integritas sitasi & metadata Crossref
          </p>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navigasi utama">
          <Link
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3 sm:py-2 sm:text-sm"
            href="/"
          >
            Periksa
          </Link>
          <Link
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3 sm:py-2 sm:text-sm"
            href="/about"
          >
            Tentang
          </Link>
          <Link
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3 sm:py-2 sm:text-sm"
            href="/benchmark"
          >
            Benchmark
          </Link>
          <Link
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3 sm:py-2 sm:text-sm"
            href="/settings"
          >
            Pengaturan
          </Link>
          <div className="ml-1 pl-1 border-l border-border/60">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
