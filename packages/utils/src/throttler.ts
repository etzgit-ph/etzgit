import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_TIME_WINDOW_MS } from './constants';

type QueueItem = { resolve: () => void; reject: (err: any) => void };

export class Throttler {
  private maxRequests: number;
  private windowMs: number;
  private timestamps: number[] = [];
  private queue: QueueItem[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(maxRequests = RATE_LIMIT_MAX_REQUESTS, windowMs = RATE_LIMIT_TIME_WINDOW_MS) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cleanup();
      if (this.timestamps.length < this.maxRequests) {
        this.timestamps.push(Date.now());
        resolve();
        return;
      }

      // otherwise queue the request
      this.queue.push({ resolve, reject });
      this.scheduleNext();
    });
  }

  private cleanup() {
    const cutoff = Date.now() - this.windowMs;
    while (this.timestamps.length && this.timestamps[0] <= cutoff) {
      this.timestamps.shift();
    }
  }

  private scheduleNext() {
    if (this.timer) return;
    if (!this.timestamps.length) {
      // nothing is blocking, flush queue
      this.flushQueue();
      return;
    }

    const oldest = this.timestamps[0];
    const wait = Math.max(0, oldest + this.windowMs - Date.now());
    this.timer = setTimeout(() => {
      this.timer = null;
      this.cleanup();
      this.flushQueue();
      // If still have timestamps and queue, schedule again
      if (this.queue.length && this.timestamps.length) this.scheduleNext();
    }, wait);
  }

  private flushQueue() {
    this.cleanup();
    while (this.queue.length && this.timestamps.length < this.maxRequests) {
      const item = this.queue.shift()!;
      this.timestamps.push(Date.now());
      try {
        item.resolve();
      } catch (e) {
        item.reject(e);
      }
    }
  }
}

// Default singleton throttler used by services; can be replaced in tests by constructing a new Throttler
export const defaultThrottler = new Throttler();
