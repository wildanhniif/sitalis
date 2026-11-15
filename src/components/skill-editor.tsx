"use client";
import { Lock, RotateCcw, Save, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  clearStoredSkill,
  DEFAULT_SKILL,
  getStoredSkill,
  saveStoredSkill,
  skillRoles,
  skillSchema,
  type SkillRole,
  type StoredSkill,
} from "@/lib/llm/skill";
import { Button } from "@/components/ui/button";

const roleTitles: Record<SkillRole, string> = {
  parser: "Parser Referensi",
  comparator: "Pembanding Karya",
  summarizer: "Penulis Ringkasan Abstrak",
};

const emptySkill: StoredSkill = { parser: { editable: "" }, comparator: { editable: "" }, summarizer: { editable: "" } };

export function SkillEditor() {
  const [values, setValues] = useState<StoredSkill>(emptySkill);
  const [status, setStatus] = useState<"default" | "custom" | "loading">("loading");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(() => {
    const stored = getStoredSkill();
    if (stored) {
      setValues(stored);
      setStatus("custom");
    } else {
      setValues(emptySkill);
      setStatus("default");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const setRole = (role: SkillRole, editable: string) => {
    setValues((current) => ({ ...current, [role]: { editable } }));
    setFeedback("");
  };

  const handleSave = () => {
    const result = skillSchema.safeParse(values);
    if (!result.success) {
      setFeedback("Teks skill melebihi batas 5000 karakter per peran.");
      return;
    }
    if (saveStoredSkill(result.data)) {
      setStatus("custom");
      setFeedback("Skill tersimpan di browser dan berlaku untuk pemeriksaan berikutnya.");
    } else {
      setFeedback("Skill tidak dapat disimpan di browser ini.");
    }
  };

  const handleReset = () => {
    clearStoredSkill();
    setValues(emptySkill);
    setStatus("default");
    setFeedback("Skill dikembalikan ke default.");
  };

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Skill Agen</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kustomisasi instruksi perilaku LLM untuk parser, pembanding, dan ringkasan abstrak.
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            status === "custom"
              ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
              : "border-border bg-surface-subtle text-muted-foreground"
          }`}
        >
          {status === "custom" ? "Skill: Kustom" : status === "default" ? "Skill: Default" : "Memuat…"}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Bagian bebas hanya mengubah gaya dan penekanan instruksi. Format keluaran JSON, nama key, dan aturan skema tetap
          dikunci sistem demi keamanan pipeline; bagian terkunci selalu disisipkan otomatis.
        </span>
      </div>

      <div className="mt-5 space-y-5">
        {skillRoles.map((role) => (
          <div key={role}>
            <label htmlFor={`skill-${role}`} className="mb-1.5 block text-xs font-semibold text-foreground">
              {roleTitles[role]}
            </label>
            <textarea
              id={`skill-${role}`}
              value={values[role].editable}
              onChange={(event) => setRole(role, event.target.value)}
              placeholder={DEFAULT_SKILL[role].editable}
              rows={4}
              className="w-full rounded-lg border border-border/80 bg-background p-3 text-xs leading-relaxed text-foreground outline-none transition-colors focus:border-sky-500/60 dark:bg-surface"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Kosongkan untuk memakai instruksi default. Karakter tersisa: {5000 - values[role].editable.length}.
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={handleSave}>
          <Save className="size-3.5" /> Simpan Skill
        </Button>
        <Button variant="secondary" size="sm" onClick={handleReset} disabled={status !== "custom"}>
          <RotateCcw className="size-3.5" /> Kembalikan ke Default
        </Button>
        {feedback && <p className="text-xs font-medium text-foreground">{feedback}</p>}
      </div>
    </section>
  );
}
