import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

type CacheEnvelope<T> = { expiresAt: number; value: T };

export class CrossrefCache {
  private memory = new Map<string, CacheEnvelope<unknown>>();

  constructor(
    private directory = path.join(process.cwd(), ".cache", "crossref"),
    private ttlMs = 30 * 24 * 60 * 60 * 1000,
  ) {}

  private filePath(key: string) {
    return path.join(this.directory, `${createHash("sha256").update(key).digest("hex")}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    const memory = this.memory.get(key) as CacheEnvelope<T> | undefined;
    if (memory && memory.expiresAt > now) return memory.value;
    if (memory) this.memory.delete(key);

    try {
      const cached = JSON.parse(await readFile(this.filePath(key), "utf8")) as CacheEnvelope<T>;
      if (cached.expiresAt <= now) return null;
      this.memory.set(key, cached);
      return cached.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const envelope = { value, expiresAt: Date.now() + this.ttlMs };
    this.memory.set(key, envelope);
    try {
      await mkdir(this.directory, { recursive: true });
      const target = this.filePath(key);
      const temporary = `${target}.${process.pid}.tmp`;
      await writeFile(temporary, JSON.stringify(envelope), "utf8");
      await rename(temporary, target);
    } catch {
      // Memory cache remains usable when the filesystem is read-only.
    }
  }

  clearMemory() {
    this.memory.clear();
  }
}
