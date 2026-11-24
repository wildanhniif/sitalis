import { z } from "zod";

export const skillRoles = ["parser", "comparator", "summarizer"] as const;
export type SkillRole = (typeof skillRoles)[number];

export type SkillDefinition = { editable: string; locked: string };
export type SkillProfile = Record<SkillRole, SkillDefinition>;

/** Profil skill default. Bagian bebas + bagian terkunci dirangkai persis seperti prompt hardcoded sebelumnya. */
export const DEFAULT_SKILL: SkillProfile = {
  parser: {
    editable: "You extract bibliography metadata.",
    locked: "Return JSON only with keys authors (array of full names as written), year, title, container, volume, issue, pages, doi, url, source_type. Allowed source_type: journal, conference, book, thesis, report, regulation, preprint, web, other. Use null when a value is not stated. Never guess, correct, complete, or use memory.",
  },
  comparator: {
    editable: "Compare the supplied reference entry and Crossref record. Decide whether they describe the same work from the supplied data, and whether the citation refers to a real work you specifically recognize. You may use general knowledge of well-known works for plausibility only.",
    locked: "Return JSON only: same_work (boolean), plausibly_real (boolean: true ONLY if you specifically recognize the cited work as a real, existing publication, e.g. a famous paper; false when you cannot recognize it, when it merely sounds plausible, or when the journal or title looks fabricated), differing_fields (string array), reason (brief string).",
  },
  summarizer: {
    editable: "Summarize the supplied Crossref abstract in Indonesian. Use only facts stated in the supplied title and abstract. Do not infer methods, results, quality, or relevance that are not stated. Write one or two concise sentences for a student who wants to know what the work is about. Never claim that the cited manuscript supports the work.",
    locked: "Return JSON only with the key summary (string).",
  },
};

export const skillSchema = z.object({
  parser: z.object({ editable: z.string().max(5000) }),
  comparator: z.object({ editable: z.string().max(5000) }),
  summarizer: z.object({ editable: z.string().max(5000) }),
});

export type StoredSkill = z.infer<typeof skillSchema>;
export const skillStorageKey = "sitalis:llm-skill";

/** Prompt final = bagian bebas + bagian terkunci. Bagian terkunci selalu ditempel sistem, tidak pernah dari pengguna. */
export function buildSkillPrompt(role: SkillRole, skill?: StoredSkill | null): string {
  const editable = skill?.[role]?.editable?.trim() || DEFAULT_SKILL[role].editable;
  return `${editable} ${DEFAULT_SKILL[role].locked}`;
}

export function buildSkillProfile(skill?: StoredSkill | null): SkillProfile {
  return Object.fromEntries(skillRoles.map((role) => [role, { editable: skill?.[role]?.editable ?? DEFAULT_SKILL[role].editable, locked: DEFAULT_SKILL[role].locked }])) as SkillProfile;
}

export function parseStoredSkill(value: string | null): StoredSkill | null {
  if (!value) return null;
  try {
    const parsed = skillSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

export function getStoredSkill(): StoredSkill | null {
  if (typeof window === "undefined") return null;
  try { return parseStoredSkill(localStorage.getItem(skillStorageKey)); } catch { return null; }
}

export function saveStoredSkill(skill: StoredSkill): boolean {
  if (typeof window === "undefined") return false;
  try { localStorage.setItem(skillStorageKey, JSON.stringify(skill)); return true; } catch { return false; }
}

export function clearStoredSkill(): boolean {
  if (typeof window === "undefined") return false;
  try { localStorage.removeItem(skillStorageKey); return true; } catch { return false; }
}
