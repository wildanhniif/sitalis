"use client";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";

export function ReferenceEditor({ references, onChange, disabled = false }: { references: string[]; onChange: (references: string[]) => void; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      {references.map((reference, index) => (
        <div
          key={index}
          className="group relative rounded-xl border border-border/80 bg-background/50 p-3.5 transition-all focus-within:border-foreground/40 focus-within:bg-background focus-within:shadow-subtle hover:border-border"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded bg-surface-subtle text-[10px] font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <label htmlFor={`reference-${index}`} className="text-xs font-medium text-muted-foreground">
                Entri Referensi
              </label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 min-h-7 rounded-md text-muted-foreground opacity-60 hover:opacity-100 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              disabled={disabled || references.length === 1}
              onClick={() => onChange(references.filter((_, itemIndex) => itemIndex !== index))}
              aria-label={`Hapus referensi ${index + 1}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <Textarea
            id={`reference-${index}`}
            rows={3}
            value={reference}
            disabled={disabled}
            onChange={(event) =>
              onChange(references.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
            }
            placeholder="Tuliskan format sitasi lengkap (Penulis, Tahun, Judul, Jurnal/Penerbit, DOI)..."
            className="resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs sm:text-sm font-sans"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...references, ""])}
        className="text-xs"
      >
        <Plus className="size-3.5" />
        Tambah referensi manual
      </Button>
    </div>
  );
}
