export class RateQueue {
  private tail: Promise<unknown> = Promise.resolve();
  private lastStartedAt = 0;

  constructor(requestsPerSecond: number) {
    this.minimumIntervalMs = 1000 / requestsPerSecond;
  }

  private minimumIntervalMs: number;

  async run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(async () => {
      const wait = Math.max(0, this.minimumIntervalMs - (Date.now() - this.lastStartedAt));
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this.lastStartedAt = Date.now();
      return operation();
    });
    this.tail = result.catch(() => undefined);
    return result;
  }
}
