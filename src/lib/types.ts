import { z } from "zod";

export const sourceTypes = [
  "journal",
  "conference",
  "book",
  "thesis",
  "report",
  "regulation",
  "web",
  "other",
] as const;

export const parsedReferenceSchema = z.object({
  authors: z.array(z.string()).default([]),
  year: z.coerce.number().int().min(1000).max(2100).nullable().default(null),
  title: z.string().nullable().default(null),
  container: z.string().nullable().default(null),
  volume: z.string().nullable().default(null),
  issue: z.string().nullable().default(null),
  pages: z.string().nullable().default(null),
  doi: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  source_type: z.enum(sourceTypes).default("other"),
});

export const crossrefWorkSchema = z.object({
  DOI: z.string(),
  title: z.array(z.string()).default([]),
  author: z
    .array(z.object({ family: z.string().optional(), given: z.string().optional() }))
    .default([]),
  issued: z.object({ "date-parts": z.array(z.array(z.number())).default([]) }).optional(),
  "container-title": z.array(z.string()).default([]),
  type: z.string().default("other"),
  volume: z.string().optional(),
  issue: z.string().optional(),
  page: z.string().optional(),
});

export const labels = ["valid", "partial", "suspected", "unverified"] as const;
export type SourceType = (typeof sourceTypes)[number];
export type ParsedReference = z.infer<typeof parsedReferenceSchema>;
export type CrossrefWork = z.infer<typeof crossrefWorkSchema>;
export type Label = (typeof labels)[number];

export type Difference = {
  field: "title" | "first_author" | "year" | "container" | "doi";
  entry: string | null;
  crossref: string | null;
};

export type Candidate = {
  work: CrossrefWork;
  score: number;
  titleScore: number;
  authorScore: number;
  yearScore: number;
  containerScore: number;
  differences: Difference[];
};

export type CheckResult = {
  id: string;
  referenceText: string;
  parsed: ParsedReference | null;
  parseError?: string;
  label: Label;
  reason: string;
  evidence: string;
  candidates: Candidate[];
  bestCandidate: Candidate | null;
  comparatorUsed: boolean;
  manualLabel?: Label;
  confirmed?: boolean;
  elapsedMs: number;
  tokens: number;
};

export type Report = {
  id: string;
  title: string;
  createdAt: string;
  source: "upload" | "paste" | "demo";
  results: CheckResult[];
  demo?: boolean;
};
