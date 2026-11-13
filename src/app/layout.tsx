import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { ToastProvider } from "@/components/toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
export const metadata: Metadata = { title: { default: "Sitalis — Periksa keberadaan referensi", template: "%s · Sitalis" }, description: "Deteksi referensi yang mencurigakan dan cocokkan metadata dengan Crossref." };
const themeScript = `try{if(localStorage.getItem('sitalis:theme')==='dark'||(!localStorage.getItem('sitalis:theme')&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body className={`${geist.variable} font-sans antialiased text-foreground bg-background selection:bg-primary/10 selection:text-primary`}>
      <ToastProvider>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <div className="flex-1">{children}</div>
          <footer className="no-print mt-20 border-t border-border/70 bg-surface-subtle/50 py-8 text-xs text-muted-foreground">
            <div className="page-container flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Sitalis</span>
                <span>·</span>
                <span>Bukti objektif Crossref untuk validitas karya ilmiah.</span>
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                Data referensi diproses secara aman. Naskah lengkap tidak dikirim ke LLM.
              </p>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </body>
  </html>;
}
