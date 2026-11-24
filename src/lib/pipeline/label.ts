import type { Candidate, Label, SourceType } from "@/lib/types";

export function foundLabel(candidate: Candidate): Label {
  // Perbedaan penulisan wadah (mis. singkatan nama prosiding) dianggap variasi normal,
  // bukan indikasi metadata yang berbeda; partial hanya untuk perbedaan material.
  return candidate.differences.some((difference) => difference.field !== "container") ? "partial" : "valid";
}

export function notFoundLabel(sourceType: SourceType, unregisteredDoi = false): Label {
  if (sourceType === "journal" || sourceType === "conference" || unregisteredDoi) return "suspected";
  return "unverified";
}

export const labelText: Record<Label, string> = {
  valid: "Valid",
  partial: "Sebagian valid",
  suspected: "Dugaan halusinasi",
  unverified: "Tidak terverifikasi",
};
