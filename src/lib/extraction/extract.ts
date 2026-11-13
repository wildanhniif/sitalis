import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { appConfig } from "@/lib/config";
import { extractBibliography, splitReferences } from "./segment";

export async function extractDocument(file: File) {
  if (file.size > appConfig.maxFileBytes) throw new Error("Ukuran berkas melebihi 10 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;

  if (extension === "pdf" || file.type === "application/pdf") {
    const document = await getDocumentProxy(new Uint8Array(buffer), { maxImageSize: 16_777_216 });
    if (document.numPages > 500) throw new Error("PDF melebihi batas 500 halaman.");
    const extracted = await Promise.race([
      extractText(document, { mergePages: true }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Ekstraksi PDF melewati batas 30 detik.")), 30_000)),
    ]);
    text = extracted.text as string;
    if (text.replace(/\s/g, "").length < Math.min(100, document.numPages * 10)) {
      throw new Error("PDF tidak memiliki lapisan teks yang memadai. OCR tidak tersedia; tempel daftar pustaka secara manual.");
    }
  } else if (extension === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else {
    throw new Error("Format tidak didukung. Gunakan PDF atau DOCX.");
  }

  const section = extractBibliography(text, true);
  const references = splitReferences(section);
  if (!references.length) throw new Error("Tidak ada referensi yang dapat dikenali. Tempel dan sunting daftar pustaka secara manual.");
  return { references, bibliography: section };
}
