"use client";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";

export function ReferenceEditor({ references, onChange, disabled = false }: { references: string[]; onChange: (references: string[]) => void; disabled?: boolean }) {
  return <div className="space-y-3">
    {references.map((reference, index) => <div key={index} className="group relative rounded-xl border bg-background p-3 transition-colors focus-within:border-primary sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2"><label htmlFor={`reference-${index}`} className="text-xs font-semibold text-muted-foreground">Referensi {index + 1}</label><Button type="button" variant="ghost" size="icon" className="size-8 min-h-8 text-muted-foreground hover:text-red-700" disabled={disabled || references.length === 1} onClick={() => onChange(references.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Hapus referensi ${index + 1}`}><Trash2 /></Button></div>
      <Textarea id={`reference-${index}`} rows={3} value={reference} disabled={disabled} onChange={(event) => onChange(references.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
    </div>)}
    <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => onChange([...references, ""])}><Plus />Tambah referensi</Button>
  </div>;
}
