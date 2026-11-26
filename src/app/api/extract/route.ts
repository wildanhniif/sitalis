import { NextResponse } from "next/server";
import { extractDocument } from "@/lib/extraction/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Pilih berkas PDF atau DOCX terlebih dahulu." }, { status: 400 });
    const result = await extractDocument(file);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Berkas tidak dapat diproses." }, { status: 400 });
  }
}
