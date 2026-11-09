import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { CrossrefCache } from "@/lib/crossref/cache";
import { CrossrefClient } from "@/lib/crossref/client";

const work = {
  DOI: "10.1234/example",
  title: ["A valid title"],
  author: [{ family: "Santoso" }],
  issued: { "date-parts": [[2023]] },
  "container-title": ["Journal of Testing"],
  type: "journal-article",
};

function response(body: unknown, status = 200, headers = new Headers()) {
  return new Response(JSON.stringify(body), { status, headers });
}

async function setup(fetcher: typeof fetch) {
  const cache = new CrossrefCache(await mkdtemp(path.join(tmpdir(), "ceksitasi-")));
  return new CrossrefClient({ email: "test@example.com", fetcher, cache, sleep: vi.fn() });
}

describe("CrossrefClient", () => {
  it("sends polite-pool headers, encoded DOI, and caches successful lookups", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ message: work }));
    const client = await setup(fetcher);
    expect(await client.getByDoi("10.1234/a/b")).toEqual(work);
    expect(await client.getByDoi("10.1234/a/b")).toEqual(work);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toContain("10.1234%2Fa%2Fb?mailto=test%40example.com");
    expect(init.headers["User-Agent"]).toContain("test@example.com");
  });

  it("uses the full bibliographic query and selects five candidates", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ message: { items: [work] } }));
    const client = await setup(fetcher);
    await client.search("Santoso, A valid title, 2023");
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get("query.bibliographic")).toBe("Santoso, A valid title, 2023");
    expect(url.searchParams.get("rows")).toBe("5");
    expect(url.searchParams.get("mailto")).toBe("test@example.com");
  });

  it("returns null for a missing DOI and reads another agency", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({ message: { agency: { id: "datacite", label: "DataCite" } } }));
    const client = await setup(fetcher);
    expect(await client.getByDoi("10.5555/missing")).toBeNull();
    expect((await client.getAgency("10.5555/missing"))?.id).toBe("datacite");
  });

  it("retries HTTP 429 with exponential backoff", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response({ message: work }));
    const sleep = vi.fn();
    const cache = new CrossrefCache(await mkdtemp(path.join(tmpdir(), "ceksitasi-")));
    const client = new CrossrefClient({ email: "test@example.com", fetcher, cache, sleep });
    expect(await client.getByDoi("10.1234/example")).toEqual(work);
    expect(sleep).toHaveBeenCalledWith(500);
  });
});
