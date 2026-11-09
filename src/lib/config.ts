export const matchingConfig = {
  weights: {
    title: 0.55,
    author: 0.2,
    year: 0.15,
    container: 0.1,
  },
  thresholds: {
    high: 0.82,
    low: 0.55,
    validTitle: 0.9,
    validAuthor: 0.85,
    validContainer: 0.8,
  },
} as const;

export const appConfig = {
  maxFileBytes: 10 * 1024 * 1024,
  crossrefCacheDays: 30,
  crossrefTimeoutMs: 15_000,
  crossrefRetries: 3,
} as const;
