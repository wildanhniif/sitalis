import { randomUUID } from "node:crypto";
import type { CrossrefClient } from "@/lib/crossref/client";
import { LlmResponseError, type LlmClient } from "@/lib/llm/client";
import { compareWorks, parseReference } from "@/lib/llm/parser";
import { isWrongDoi, rankCandidates } from "@/lib/matching/matcher";
import { matchingConfig } from "@/lib/config";
import type { Candidate, CheckResult, CrossrefWork } from "@/lib/types";
import { foundLabel, notFoundLabel } from "./label";

type Dependencies = { crossref: CrossrefClient; llm: LlmClient };

export async function checkReference(referenceText: string, dependencies: Dependencies, id: string = randomUUID()): Promise<CheckResult> {
  const started = Date.now();
  let tokens = 0;
  const base = { id, referenceText, candidates: [], comparatorUsed: false, elapsedMs: 0, tokens: 0 };
  const finish = (result: Omit<CheckResult, "elapsedMs" | "tokens">): CheckResult => ({ ...result, elapsedMs: Date.now() - started, tokens });
  const parsedOutcome = await parseReference(referenceText, dependencies.llm);
  tokens += parsedOutcome.tokens;
  if (!parsedOutcome.parsed) {
    return finish({ ...base, parsed: null, parseError: parsedOutcome.error, label: "unverified", reason: "Referensi gagal diubah menjadi metadata terstruktur.", evidence: parsedOutcome.error ?? "Respons LLM tidak valid.", bestCandidate: null });
  }
  const entry = parsedOutcome.parsed;
  let candidates: Candidate[] = [];
  let best: Candidate | null = null;
  let evidence = "";
  let unregisteredDoi = false;

  if (entry.doi) {
    const directWork = await dependencies.crossref.getByDoi(entry.doi);
    if (directWork) {
      const [direct] = rankCandidates(entry, [directWork]);
      if (!isWrongDoi(direct, entry)) {
        const label = foundLabel(direct);
        return finish({ ...base, parsed: entry, label, reason: label === "valid" ? "DOI terdaftar dan metadata yang tersedia cocok." : "Karya ditemukan melalui DOI, tetapi ada metadata yang berbeda.", evidence: `DOI ${directWork.DOI} ditemukan di Crossref. Skor ${direct.score.toFixed(2)}.`, candidates: [direct], bestCandidate: direct });
      }
      evidence = `DOI ${entry.doi} terdaftar untuk karya lain (${directWork.DOI}); pencarian berdasarkan teks dilanjutkan. `;
    } else {
      const agency = await dependencies.crossref.getAgency(entry.doi);
      if (agency && agency.id.toLowerCase() !== "crossref") {
        return finish({ ...base, parsed: entry, label: "unverified", reason: `DOI terdaftar di ${agency.label}, di luar cakupan pemeriksaan Crossref.`, evidence: `Agency DOI: ${agency.label} (${agency.id}).`, candidates: [], bestCandidate: null });
      }
      unregisteredDoi = true;
      evidence = `DOI ${entry.doi} tidak ditemukan di Crossref maupun agency DOI. `;
    }
  }

  const works: CrossrefWork[] = await dependencies.crossref.search(referenceText);
  candidates = rankCandidates(entry, [...candidates.map((candidate) => candidate.work), ...works].filter((work, index, all) => all.findIndex((item) => item.DOI === work.DOI) === index));
  best = candidates[0] ?? null;
  let found = Boolean(best && best.score >= matchingConfig.thresholds.high);
  const ambiguous = Boolean(best && best.score >= matchingConfig.thresholds.low && !found);

  if (ambiguous && best) {
    try {
      const comparison = await compareWorks(entry, best.work, dependencies.llm);
      tokens += comparison.tokens;
      found = comparison.same_work;
      evidence += `Pembanding LLM: ${comparison.reason} `;
    } catch (error) {
      if (error instanceof LlmResponseError) tokens += error.tokens;
      return finish({ ...base, parsed: entry, label: "unverified", reason: "Kandidat ambigu dan pembanding LLM tidak tersedia; perlu pemeriksaan manual.", evidence: `${evidence}Skor kandidat terbaik ${best.score.toFixed(2)}.`, candidates, bestCandidate: best, comparatorUsed: true });
    }
  }

  if (found && best) {
    const label = foundLabel(best);
    return finish({ ...base, parsed: entry, label, reason: label === "valid" ? "Karya ditemukan dan metadata yang tersedia cocok." : "Karya ditemukan, tetapi satu atau lebih metadata berbeda.", evidence: `${evidence}Kandidat Crossref ${best.work.DOI} dengan skor ${best.score.toFixed(2)}.`, candidates, bestCandidate: best, comparatorUsed: ambiguous });
  }

  const label = notFoundLabel(entry.source_type, unregisteredDoi);
  return finish({ ...base, parsed: entry, label, reason: label === "suspected" ? "Tidak ditemukan karya yang cukup cocok di Crossref. Ini dugaan, bukan bukti halusinasi." : "Tidak ditemukan di Crossref; jenis sumber ini memang tidak selalu terindeks.", evidence: `${evidence}${best ? `Skor kandidat terbaik ${best.score.toFixed(2)}.` : "Crossref tidak mengembalikan kandidat."}`, candidates, bestCandidate: best, comparatorUsed: ambiguous });
}
