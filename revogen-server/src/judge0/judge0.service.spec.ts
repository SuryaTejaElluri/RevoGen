// Judge0 client, output checks and Java entry point. HTTP is faked — never calls RapidAPI.
import { Judge0Service, LANGUAGE_IDS } from './judge0.service';
import { compareOutputs, numbersMatch, outputLines } from './output-validator';
import { prepareJavaSource } from './java-source';

describe('output checks', () => {
  it('normalises line endings, trailing spaces and blank edge lines', () => {
    expect(outputLines('\r\n1 2 \r\n3\t\r\n\r\n')).toEqual(['1 2', '3']);
  });

  describe('EXACT', () => {
    it('ignores Windows line endings and trailing spaces', () => {
      expect(compareOutputs('1 2 3 \n', '1 2 3', 'EXACT')).toBe(true);
      expect(compareOutputs('a\r\nb\r\n', 'a\nb', 'EXACT')).toBe(true);
    });
    it('still checks content, line breaks and inner spacing', () => {
      expect(compareOutputs('1 2 4', '1 2 3', 'EXACT')).toBe(false);
      expect(compareOutputs('1\n2', '1 2', 'EXACT')).toBe(false);
      expect(compareOutputs('1  2', '1 2', 'EXACT')).toBe(false);
      expect(compareOutputs('Yes', 'YES', 'EXACT')).toBe(false);
    });
    it('treats an unknown or missing mode as EXACT', () => {
      expect(compareOutputs('x', 'x', 'WHATEVER')).toBe(true);
      expect(compareOutputs('x', 'y', undefined)).toBe(false);
    });
  });

  describe('IGNORE_ORDER', () => {
    it('accepts values in any order on one line', () => {
      expect(compareOutputs('3 1 2', '1 2 3', 'IGNORE_ORDER')).toBe(true);
      expect(compareOutputs('3 1', '1 2 3', 'IGNORE_ORDER')).toBe(false);
    });
    it('accepts lines in any order but keeps each line intact', () => {
      expect(compareOutputs('3 4\n1 2', '1 2\n3 4', 'IGNORE_ORDER')).toBe(true);
      expect(compareOutputs('1 3\n2 4', '1 2\n3 4', 'IGNORE_ORDER')).toBe(
        false,
      );
    });
    it('keeps duplicates', () => {
      expect(compareOutputs('1 2', '1 1 2', 'IGNORE_ORDER')).toBe(false);
    });
  });

  describe('SET_COMPARE', () => {
    it('ignores order and duplicates', () => {
      expect(compareOutputs('2 1 1', '1 2', 'SET_COMPARE')).toBe(true);
      expect(compareOutputs('b\na\na', 'a\nb', 'SET_COMPARE')).toBe(true);
      expect(compareOutputs('1 3', '1 2', 'SET_COMPARE')).toBe(false);
    });
  });

  describe('FLOAT_COMPARE', () => {
    it('allows the set precision', () => {
      expect(compareOutputs('3.1415927', '3.141593', 'FLOAT_COMPARE', 6)).toBe(
        true,
      );
      expect(compareOutputs('3.15', '3.14', 'FLOAT_COMPARE', 6)).toBe(false);
    });
    it('accepts more decimals than the expected value shows', () => {
      expect(compareOutputs('3.14159', '3.14', 'FLOAT_COMPARE', 6)).toBe(true);
      expect(compareOutputs('3.146', '3.14', 'FLOAT_COMPARE', 6)).toBe(false);
    });
    it('uses a relative tolerance for large numbers', () => {
      expect(numbersMatch('123456789.0000001', '123456789', 6)).toBe(true);
      expect(compareOutputs('1e9', '1000000000', 'FLOAT_COMPARE')).toBe(true);
    });
    it('compares words exactly and rejects junk numbers', () => {
      expect(compareOutputs('YES 3.1400001', 'YES 3.14', 'FLOAT_COMPARE')).toBe(
        true,
      );
      expect(compareOutputs('NO 3.14', 'YES 3.14', 'FLOAT_COMPARE')).toBe(
        false,
      );
      expect(compareOutputs('3.14abc', '3.14', 'FLOAT_COMPARE')).toBe(false);
      expect(compareOutputs('1.0 2.0', '1.0', 'FLOAT_COMPARE')).toBe(false);
    });
  });

  describe('CUSTOM (lenient)', () => {
    it('ignores whitespace layout and letter case', () => {
      expect(compareOutputs('yes\n  1   2', 'YES 1 2', 'CUSTOM')).toBe(true);
      expect(compareOutputs('yes 1 3', 'YES 1 2', 'CUSTOM')).toBe(false);
    });
  });
});

describe('Java entry point', () => {
  const main = (src: string) => prepareJavaSource(src);

  it('wraps a public Solution class without renaming it', () => {
    const src = `import java.util.*;
public class Solution {
  static class SolutionHelper { int v; }
  public static void main(String[] args) {
    Solution s = new Solution();
    System.out.println("public class Solution");
  }
}`;
    const out = main(src);
    expect(out).toContain('new Solution()');
    expect(out).toContain('SolutionHelper');
    expect(out).toContain('"public class Solution"'); // strings untouched
    expect(out).not.toMatch(/^public class Solution/m);
    expect(out).toMatch(/class Main \{[\s\S]*Solution\.main\(args\);/);
  });

  it('finds main in any class name, after other top-level types', () => {
    const src = `public interface Shape {}
class Helper { void main() {} }
// class Fake { public static void main(String[] a) {} }
public final class Program {
  public static void main(String[] args) throws Exception { }
}`;
    const out = main(src);
    expect(out).toMatch(/Program\.main\(args\)/);
    expect(out).not.toMatch(/public (interface|final class)/);
  });

  it('leaves code that already has a Main class alone', () => {
    const src = 'public class Main { public static void main(String[] a) {} }';
    expect(main(src)).toBe(src);
  });

  it('drops a package line', () => {
    expect(
      main(
        'package com.acme;\npublic class A { public static void main(String[] a){} }',
      ),
    ).not.toContain('package');
  });
});

describe('Judge0Service.runBatch', () => {
  function fakeHttp(statusSequence: number[][]) {
    const calls = { post: 0, get: 0, body: null as any };
    let poll = 0;
    const http = {
      post: async (_url: string, body: any) => {
        calls.post++;
        calls.body = body;
        return {
          data: body.submissions.map((_: unknown, i: number) => ({
            token: `t${calls.post}-${i}`,
          })),
        };
      },
      get: async (_url: string, { params }: any) => {
        calls.get++;
        const ids = statusSequence[Math.min(poll++, statusSequence.length - 1)];
        const tokens = String(params.tokens).split(',');
        return {
          data: {
            submissions: tokens.map((token) => {
              const i = Number(token.split('-')[1]);
              return {
                token,
                status: { id: ids[i] ?? 3, description: 'x' },
                stdout: Buffer.from(`out${i}`).toString('base64'),
              };
            }),
          },
        };
      },
    };
    const service = new Judge0Service();
    (service as any).http = http;
    return { service, calls };
  }

  beforeAll(() => jest.useFakeTimers({ advanceTimers: true }));
  afterAll(() => jest.useRealTimers());

  it('sends all cases in one batch, base64-encoded with limits, and returns results in order', async () => {
    const { service, calls } = fakeHttp([
      [2, 3, 1],
      [3, 3, 3],
    ]);
    const results = await service.runBatch('print(1)', LANGUAGE_IDS.python, [
      'a',
      'b',
      'c',
    ]);
    expect(calls.post).toBe(1);
    expect(calls.get).toBe(2);
    expect(results.map((r) => r.stdout)).toEqual(['out0', 'out1', 'out2']);
    const sub = calls.body.submissions[0];
    expect(Buffer.from(sub.source_code, 'base64').toString()).toBe('print(1)');
    expect(Buffer.from(sub.stdin, 'base64').toString()).toBe('a');
    expect(sub).toEqual(
      expect.objectContaining({
        cpu_time_limit: expect.any(Number),
        memory_limit: expect.any(Number),
      }),
    );
  });

  it('splits more than 20 cases into several batches', async () => {
    const { service, calls } = fakeHttp([[]]);
    const results = await service.runBatch(
      'x',
      LANGUAGE_IDS.c,
      Array.from({ length: 25 }, (_, i) => String(i)),
    );
    expect(calls.post).toBe(2);
    expect(results).toHaveLength(25);
  });

  it('prepares Java before sending it', async () => {
    const { service, calls } = fakeHttp([[]]);
    await service.runBatch(
      'public class Solution { public static void main(String[] a) {} }',
      LANGUAGE_IDS.java,
      [''],
    );
    expect(
      Buffer.from(calls.body.submissions[0].source_code, 'base64').toString(),
    ).toContain('class Main');
  });

  it('turns HTTP failures into a clear 503', async () => {
    const service = new Judge0Service();
    (service as any).http = {
      post: async () => {
        throw Object.assign(new Error('x'), { response: { status: 429 } });
      },
    };
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(service.runBatch('x', 71, ['1'])).rejects.toThrow(/busy/);
  });
});
