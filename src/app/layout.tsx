import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { ToastProvider } from "@/components/toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
export const metadata: Metadata = { title: { default: "CekSitasi — Periksa keberadaan referensi", template: "%s · CekSitasi" }, description: "Deteksi referensi yang mencurigakan dan cocokkan metadata dengan Crossref." };
const themeScript = `try{if(localStorage.getItem('ceksitasi:theme')==='dark'||(!localStorage.getItem('ceksitasi:theme')&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body className={`${geist.variable} font-sans antialiased`}>
      <ToastProvider><AppHeader />{children}<footer className="no-print mt-16 border-t"><div className="page-container flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>CekSitasi · Bukti dari Crossref, keputusan tetap milik Anda.</p><p>Naskah lengkap tidak dikirim ke LLM.</p></div></footer></ToastProvider>
    </body>
  </html>;
}
