import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return <header className="no-print sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
    <div className="page-container flex h-16 items-center justify-between gap-3">
      <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-md font-semibold tracking-tight" aria-label="CekSitasi, beranda">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><BookOpenCheck className="size-4" /></span>
        <span>CekSitasi</span>
      </Link>
      <nav className="flex items-center gap-0.5 sm:gap-2" aria-label="Navigasi utama">
        <Link className="hidden rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground min-[400px]:block sm:px-3" href="/">Periksa</Link>
        <Link className="rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3" href="/about">Tentang</Link>
        <Link className="rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3" href="/settings">Pengaturan</Link>
        <ThemeToggle />
      </nav>
    </div>
  </header>;
}
