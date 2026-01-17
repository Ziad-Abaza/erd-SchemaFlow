/**
 * Request Queue - Manages concurrent AI requests with priority queuing
 * Prevents overwhelming the AI server and enables non-blocking execution
 */

import { AIJob, AIResponse } from './types';

interface QueueOptions {
  maxConcurrent?: number;
  retryDelay?: number;
  maxRetries?: number;
}

export class RequestQueue {
  private queue: AIJob[] = [];
  private processing: Set<string> = new Set();
  private maxConcurrent: number;
  private retryDelay: number;
  private maxRetries: number;

  constructor(options: QueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 1;
    this.retryDelay = options.retryDelay ?? 1000;
    this.maxRetries = options.maxRetries ?? 2;
  }

  /**
   * Enqueue a request with priority
   */
  async enqueue<T>(
    task: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const job: AIJob = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'request',
        request: {} as any, // Not used for direct tasks
        priority,
        callback: resolve as any,
        errorCallback: reject,
        createdAt: Date.now()
      };

      // Add to queue based on priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const insertIndex = this.queue.findIndex(
        j => priorityOrder[j.priority] > priorityOrder[priority]
      );

      if (insertIndex === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(insertIndex, 0, job);
      }

      // Wrap task execution
      (job as any).task = task;

      this.processQueue();
    });
  }

  /**
   * Enqueue background job
   */
  enqueueBackground(job: AIJob): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const insertIndex = this.queue.findIndex(
      j => priorityOrder[j.priority] > priorityOrder[job.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    this.processQueue();
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    // Don't process if at capacity
    if (this.processing.size >= this.maxConcurrent) {
      return;
    }

    // Get next job
    const job = this.queue.shift();
    if (!job) {
      return;
    }

    this.processing.add(job.id);

    // Process job
    this.executeJob(job).finally(() => {
      this.processing.delete(job.id);
      // Process next job
      if (this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  /**
   * Execute job with retry logic
   */
  private async executeJob(job: AIJob): Promise<void> {
    const task = (job as any).task;
    if (!task) {
      // Background job - needs to be handled by provider
      console.warn('Background job execution not implemented');
      return;
    }

    let retries = job.retries || 0;

    while (retries <= this.maxRetries) {
      try {
        const result = await task();
        if (job.callback) {
          job.callback(result);
        }
        return;
      } catch (error: any) {
        if (retries >= this.maxRetries) {
          if (job.errorCallback) {
            job.errorCallback(error);
          } else if (job.callback) {
            job.callback({ content: '', metadata: { error: error.message } } as any);
          }
          return;
        }

        retries++;
        await this.delay(this.retryDelay * retries); // Exponential backoff
      }
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

