import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { prepareJavaSource } from './java-source';

/** Judge0 language ids for the languages we accept. */
export const LANGUAGE_IDS: Record<string, number> = {
  java: 62,
  python: 71,
  javascript: 63,
  c: 50,
  cpp: 54,
};

/** Judge0 status ids: 1 in queue, 2 processing, 3 accepted (ran fine), 5 time limit, 6 compile error, 7–12 runtime errors. */
export const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  TIME_LIMIT: 5,
  COMPILE_ERROR: 6,
} as const;

export interface ExecutionResult {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time?: string | null;
  memory?: number | null;
}

/** Limits sent with every run (override with env vars). Judge0's own maximums still apply. */
const num = (v: string | undefined, d: number) =>
  v && Number.isFinite(Number(v)) ? Number(v) : d;
export const LIMITS = {
  cpuTimeSeconds: num(process.env.JUDGE0_CPU_TIME_LIMIT, 5),
  wallTimeSeconds: num(process.env.JUDGE0_WALL_TIME_LIMIT, 10),
  memoryKb: num(process.env.JUDGE0_MEMORY_LIMIT_KB, 256_000),
};

/** Judge0 accepts at most 20 submissions per batch by default. */
const BATCH_SIZE = 20;
const POLL_MS = 1000;
const MAX_POLLS = 40;
const FIELDS = 'token,status,stdout,stderr,compile_output,message,time,memory';

const b64 = (s: string) => Buffer.from(s ?? '', 'utf8').toString('base64');
const unb64 = (s: string | null | undefined) =>
  s ? Buffer.from(s, 'base64').toString('utf8') : null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class Judge0Service {
  private readonly http: AxiosInstance = axios.create({
    baseURL: process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com',
    timeout: 30_000,
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY ?? '',
      'X-RapidAPI-Host':
        process.env.RAPIDAPI_HOST ?? 'judge0-ce.p.rapidapi.com',
    },
  });

  /** Code as Judge0 should compile it (Java gets a `Main` entry point). */
  prepareSource(sourceCode: string, languageId: number): string {
    return languageId === LANGUAGE_IDS.java
      ? prepareJavaSource(sourceCode)
      : sourceCode;
  }

  /**
   * Run one program against many inputs. Uses Judge0's batch API, so a question
   * with 10 test cases costs one create request plus a few status checks,
   * instead of one create + one check per second for every case.
   * Results come back in the same order as `inputs`.
   */
  async runBatch(
    sourceCode: string,
    languageId: number,
    inputs: string[],
  ): Promise<ExecutionResult[]> {
    if (!inputs.length) return [];
    const source = b64(this.prepareSource(sourceCode, languageId));
    const results: ExecutionResult[] = [];

    for (let start = 0; start < inputs.length; start += BATCH_SIZE) {
      const chunk = inputs.slice(start, start + BATCH_SIZE);
      const tokens = await this.createBatch(source, languageId, chunk);
      results.push(...(await this.waitForBatch(tokens)));
    }
    return results;
  }

  private async createBatch(
    source: string,
    languageId: number,
    inputs: string[],
  ): Promise<string[]> {
    try {
      const { data } = await this.http.post(
        '/submissions/batch?base64_encoded=true',
        {
          submissions: inputs.map((stdin) => ({
            source_code: source,
            language_id: languageId,
            stdin: b64(stdin),
            cpu_time_limit: LIMITS.cpuTimeSeconds,
            wall_time_limit: LIMITS.wallTimeSeconds,
            memory_limit: LIMITS.memoryKb,
          })),
        },
      );
      const tokens = (Array.isArray(data) ? data : []).map(
        (d: { token?: string }) => d?.token,
      );
      if (tokens.length !== inputs.length || tokens.some((t) => !t)) {
        throw new Error(
          `Judge0 rejected the batch: ${JSON.stringify(data).slice(0, 300)}`,
        );
      }
      return tokens as string[];
    } catch (err) {
      throw this.unavailable(err);
    }
  }

  private async waitForBatch(tokens: string[]): Promise<ExecutionResult[]> {
    const done = new Map<string, ExecutionResult>();
    for (let poll = 0; poll < MAX_POLLS && done.size < tokens.length; poll++) {
      await sleep(poll === 0 ? 800 : POLL_MS);
      const pending = tokens.filter((t) => !done.has(t));
      let rows: any[];
      try {
        const { data } = await this.http.get('/submissions/batch', {
          params: {
            tokens: pending.join(','),
            base64_encoded: true,
            fields: FIELDS,
          },
        });
        rows = data?.submissions ?? [];
      } catch (err) {
        throw this.unavailable(err);
      }
      rows.forEach((row, i) => {
        const id = row?.status?.id;
        if (id && id !== STATUS.IN_QUEUE && id !== STATUS.PROCESSING) {
          done.set(row.token ?? pending[i], {
            status: row.status,
            stdout: unb64(row.stdout),
            stderr: unb64(row.stderr),
            compile_output: unb64(row.compile_output),
            message: unb64(row.message),
            time: row.time ?? null,
            memory: row.memory ?? null,
          });
        }
      });
    }
    return tokens.map(
      (t) =>
        done.get(t) ?? {
          status: { id: STATUS.TIME_LIMIT, description: 'Time Limit Exceeded' },
          stdout: null,
          stderr: null,
          compile_output: null,
          message: 'The code runner took too long to respond.',
        },
    );
  }

  private unavailable(err: unknown) {
    const status = (err as any)?.response?.status;
    const detail =
      status === 429
        ? 'The code runner is busy (rate limit reached). Please try again in a minute.'
        : 'The code runner is not responding right now. Please try again.';
    console.error(
      'Judge0 error',
      status ?? '',
      (err as any)?.response?.data ?? (err as Error)?.message,
    );
    return new ServiceUnavailableException(detail);
  }
}
