/**
 * Judge0 compiles Java as Main.java and runs `java Main`. Candidates write
 * `public class Solution` (or any other name), so instead of renaming their class
 * — which breaks `new Solution()` and renames `SolutionHelper` — we:
 *   1. drop any `package` line,
 *   2. drop `public` from top-level types (a file may only have one public type,
 *      and it must match the file name),
 *   3. add a tiny `class Main` that calls the candidate's main method.
 * Code that already has a top-level `Main` class is left as it is.
 */

interface TopLevelType {
  name: string;
  /** index of the `public` keyword, if the declaration has one */
  publicAt: number | null;
  /** body of the type (between its braces) */
  body: string;
}

/** Replace comments and string/char literals with spaces, keeping every index in place. */
function blankOutLiterals(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') {
        out += ' ';
        i++;
      }
    } else if (c === '/' && n === '*') {
      out += '  ';
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < src.length) {
        out += '  ';
        i += 2;
      }
    } else if (src.startsWith('"""', i)) {
      out += '   ';
      i += 3;
      while (i < src.length && !src.startsWith('"""', i)) {
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < src.length) {
        out += '   ';
        i += 3;
      }
    } else if (c === '"' || c === "'") {
      const q = c;
      out += ' ';
      i++;
      while (i < src.length && src[i] !== q && src[i] !== '\n') {
        if (src[i] === '\\') {
          out += ' ';
          i++;
        }
        if (i < src.length) {
          out += ' ';
          i++;
        }
      }
      if (i < src.length) {
        out += ' ';
        i++;
      }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function topLevelTypes(src: string): TopLevelType[] {
  const code = blankOutLiterals(src);
  const types: TopLevelType[] = [];
  const decl =
    /\b((?:(?:public|abstract|final|sealed|non-sealed|strictfp|static)\s+)*)(class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/g;
  let depth = 0;
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '{') {
      depth++;
      i++;
      continue;
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1);
      i++;
      continue;
    }
    if (depth === 0) {
      decl.lastIndex = i;
      const m = decl.exec(code);
      if (m && m.index === i) {
        const mods = m[1] ?? '';
        const pubOffset = mods.search(/\bpublic\b/);
        const open = code.indexOf('{', i + m[0].length);
        if (open < 0) break;
        // find the matching close brace
        let d = 0;
        let close = open;
        for (; close < code.length; close++) {
          if (code[close] === '{') d++;
          else if (code[close] === '}' && --d === 0) break;
        }
        types.push({
          name: m[3],
          publicAt: pubOffset >= 0 ? i + pubOffset : null,
          body: code.slice(open + 1, close),
        });
        i = close + 1;
        continue;
      }
    }
    i++;
  }
  return types;
}

const HAS_MAIN = /\bstatic\b[^;{}()]*\bvoid\s+main\s*\(/;

export function prepareJavaSource(source: string): string {
  const types = topLevelTypes(source);
  if (types.some((t) => t.name === 'Main')) return source;

  // Remove `public ` from top-level declarations (right to left keeps indexes valid).
  let out = source;
  for (const t of [...types]
    .filter((t) => t.publicAt !== null)
    .sort((a, b) => b.publicAt! - a.publicAt!)) {
    out =
      out.slice(0, t.publicAt!) +
      out.slice(t.publicAt! + 'public'.length).replace(/^\s+/, ' ');
  }
  out = out.replace(/^\s*package\s+[\w.]+\s*;\s*$/m, '');

  const entry = types.find((t) => HAS_MAIN.test(t.body));
  if (!entry) return out; // no main method: let the compiler/runtime report it

  return `${out}\n\nclass Main {\n    public static void main(String[] args) throws Exception {\n        ${entry.name}.main(args);\n    }\n}\n`;
}
