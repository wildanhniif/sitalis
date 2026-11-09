import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CrossrefCache } from "@/lib/crossref/cache";

describe("CrossrefCache", () => {
  it("persists values and honors expiry", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "ceksitasi-cache-"));
    const cache = new CrossrefCache(directory, 10_000);
    await cache.set("key", { value: 42 });
    cache.clearMemory();
    expect(await cache.get("key")).toEqual({ value: 42 });
    const expired = new CrossrefCache(directory, -1);
    await expired.set("expired", "old");
    expired.clearMemory();
    expect(await expired.get("expired")).toBeNull();
  });
});
