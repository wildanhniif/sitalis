import { matchingConfig } from "@/lib/config";
import type { Candidate, CrossrefWork, Difference, ParsedReference } from "@/lib/types";
import { jaroWinklerSimilarity, surname, titleSimilarity } from "./similarity";

function yearOf(work: CrossrefWork) {
  return work.issued?.["date-parts"]?.[0]?.[0] ?? null;
}

function authorScore(entry: ParsedReference, work: CrossrefWork) {
  const expected = entry.authors.map(surname).filter(Boolean);
  const actual = work.author.map((author) => surname(author.family ?? "")).filter(Boolean);
  if (!expected.length || !actual.length) return expected.length ? 0 : 0.5;
  const first = expected[0] === actual[0] ? 1 : jaroWinklerSimilarity(expected[0], actual[0]);
  const intersection = expected.filter((name) => actual.some((candidate) => jaroWinklerSimilarity(name, candidate) >= 0.88)).length;
  return first * 0.65 + (intersection / expected.length) * 0.35;
}

function makeDifference(field: Difference["field"], entry: string | null, crossref: string | null): Difference {
  return { field, entry, crossref };
}

export function matchCandidate(entry: ParsedReference, work: CrossrefWork): Candidate {
  const workTitle = work.title[0] ?? null;
  const workContainer = work["container-title"][0] ?? null;
  const workYear = yearOf(work);
  const titleScore = titleSimilarity(entry.title, workTitle);
  const authorsScore = authorScore(entry, work);
  const yearScore = entry.year == null || workYear == null ? 0.5 : Math.abs(entry.year - workYear) <= 1 ? 1 : 0;
  const containerScore = !entry.container || !workContainer
    ? entry.container ? 0 : 0.5
    : jaroWinklerSimilarity(entry.container, workContainer);
  const { weights, thresholds } = matchingConfig;
  let score = titleScore * weights.title + authorsScore * weights.author + yearScore * weights.year + containerScore * weights.container;
  if (entry.doi && entry.doi.toLowerCase() === work.DOI.toLowerCase() && (!entry.title || titleScore >= 0.65)) score = Math.max(score, 0.95);

  const differences: Difference[] = [];
  if (entry.title && titleScore < thresholds.validTitle) differences.push(makeDifference("title", entry.title, workTitle));
  if (entry.authors[0] && authorsScore < thresholds.validAuthor) {
    differences.push(makeDifference("first_author", entry.authors[0], work.author[0] ? [work.author[0].given, work.author[0].family].filter(Boolean).join(" ") : null));
  }
  if (entry.year != null && workYear !== entry.year) differences.push(makeDifference("year", String(entry.year), workYear == null ? null : String(workYear)));
  if (entry.container && containerScore < thresholds.validContainer) differences.push(makeDifference("container", entry.container, workContainer));
  if (entry.doi && entry.doi.toLowerCase() !== work.DOI.toLowerCase()) differences.push(makeDifference("doi", entry.doi, work.DOI));

  return { work, score, titleScore, authorScore: authorsScore, yearScore, containerScore, differences };
}

export function rankCandidates(entry: ParsedReference, works: CrossrefWork[]) {
  return works.map((work) => matchCandidate(entry, work)).sort((a, b) => b.score - a.score);
}

export function isWrongDoi(candidate: Candidate, entry: ParsedReference) {
  if (entry.title) return candidate.titleScore < 0.65;
  const authorContradiction = Boolean(entry.authors[0] && candidate.authorScore < 0.5);
  const yearContradiction = entry.year != null && candidate.yearScore === 0;
  const containerContradiction = Boolean(entry.container && candidate.containerScore < 0.5);
  return authorContradiction || yearContradiction || containerContradiction;
}
