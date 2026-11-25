/**
 * Compares a program's output with the expected output, per the question's
 * check mode. Every mode first normalises output the way online judges do:
 * Windows line endings become \n, trailing spaces on each line are dropped,
 * and blank lines at the start and end are ignored — so `print(x, end=" ")`
 * or an expected output typed on Windows never fails correct code.
 *
 *  EXACT          same lines, same text (after the normalising above)
 *  IGNORE_ORDER   same lines in any order; for single-line output, same values in any order
 *  SET_COMPARE    like IGNORE_ORDER, but duplicates are ignored
 *  FLOAT_COMPARE  same values in order; numbers may differ by the allowed tolerance
 *  CUSTOM         lenient: any whitespace and letter case are ignored
 */
export type Validator =
  | 'EXACT'
  | 'IGNORE_ORDER'
  | 'SET_COMPARE'
  | 'FLOAT_COMPARE'
  | 'CUSTOM';

/** Lines of output, normalised (no \r, no trailing spaces, no leading/trailing blank lines). */
export function outputLines(s: string | null | undefined): string[] {
  const lines = (s ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''));
  while (lines.length && lines[0] === '') lines.shift();
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

const tokens = (s: string) => s.split(/\s+/).filter(Boolean);
/** A line with its internal spacing collapsed, so `1  2` and `1 2` are the same line. */
const squash = (line: string) => tokens(line).join(' ');

const sameSorted = (a: string[], e: string[]) => {
  if (a.length !== e.length) return false;
  const as = [...a].sort();
  const es = [...e].sort();
  return as.every((x, i) => x === es[i]);
};

/** Items to compare when order doesn't matter: lines for multi-line output, values for one line. */
function unorderedItems(
  actual: string[],
  expected: string[],
): [string[], string[]] {
  if (expected.length <= 1 && actual.length <= 1) {
    return [tokens(actual[0] ?? ''), tokens(expected[0] ?? '')];
  }
  return [
    actual.map(squash).filter(Boolean),
    expected.map(squash).filter(Boolean),
  ];
}

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/**
 * Two numbers match if they differ by at most 10^-precision (absolute, or relative
 * for large values). If the expected value was printed with fewer decimals than
 * that, rounding to its decimals is also accepted (expected 3.14, actual 3.14159).
 */
export function numbersMatch(
  actual: string,
  expected: string,
  precision = 6,
): boolean {
  const a = Number(actual);
  const e = Number(expected);
  if (!Number.isFinite(a) || !Number.isFinite(e)) return false;
  const decimals =
    expected.includes('.') && !/[eE]/.test(expected)
      ? expected.split('.')[1].length
      : null;
  const eps = Math.pow(10, -precision);
  let tol = eps;
  if (decimals !== null && decimals < precision)
    tol = Math.max(tol, 0.5 * Math.pow(10, -decimals));
  const diff = Math.abs(a - e);
  // absolute (incl. rounding to the shown decimals), or relative 10^-precision for big values
  return diff <= tol + 1e-12 || diff <= eps * Math.abs(e);
}

export function compareOutputs(
  actual: string | null | undefined,
  expected: string | null | undefined,
  validator: string = 'EXACT',
  floatPrecision = 6,
): boolean {
  const a = outputLines(actual);
  const e = outputLines(expected);

  switch (validator as Validator) {
    case 'IGNORE_ORDER': {
      const [ai, ei] = unorderedItems(a, e);
      return sameSorted(ai, ei);
    }

    case 'SET_COMPARE': {
      const [ai, ei] = unorderedItems(a, e);
      return sameSorted([...new Set(ai)], [...new Set(ei)]);
    }

    case 'FLOAT_COMPARE': {
      const at = a.flatMap(tokens);
      const et = e.flatMap(tokens);
      if (at.length !== et.length) return false;
      return et.every((ev, i) => {
        const av = at[i];
        if (NUMBER.test(ev) && NUMBER.test(av))
          return numbersMatch(av, ev, floatPrecision);
        return av === ev; // words must match exactly (e.g. "YES 3.14")
      });
    }

    case 'CUSTOM': {
      const at = a.flatMap(tokens).map((t) => t.toLowerCase());
      const et = e.flatMap(tokens).map((t) => t.toLowerCase());
      return at.length === et.length && at.every((t, i) => t === et[i]);
    }

    case 'EXACT':
    default:
      return a.length === e.length && a.every((line, i) => line === e[i]);
  }
}
