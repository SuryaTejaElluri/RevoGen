import axios from 'axios';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { Injectable } from '@nestjs/common';
import { SKILLS } from './skills';
import { ROLES_CATALOG, RoleDefinition } from './roles';
import {
  SKILL_DICTIONARY,
  AMBIGUOUS_GENERAL_SKILLS,
  SkillEntry,
} from './skill-dictionary';

// ── Skill matching ───────────────────────────────────────────────────────────

interface Matcher {
  skill: string;
  /** Patterns that count anywhere in the text. */
  direct: RegExp[];
  /** Exact-case pattern that only counts on a line naming another skill, or in a skills section. */
  contextual?: RegExp;
  implies: string[];
}

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A skill token must not be glued to letters/digits (so "java" doesn't match "javascript",
// and ".net" doesn't match inside "asp.net").
const boundary = (pattern: string, flags: string) =>
  new RegExp(`(^|[^A-Za-z0-9#+.])${pattern}(?=$|[^A-Za-z0-9#+])`, flags);

function buildMatcher(skill: string, entry: SkillEntry): Matcher {
  const aliases = new Set((entry.aliases ?? []).map((a) => a.toLowerCase()));
  const exactOnly = entry.caseSensitive || entry.needsContext;
  if (!exactOnly) aliases.add(skill.toLowerCase());

  const direct = [...aliases].map((a) => boundary(escapeRegex(a), 'i'));
  let contextual: RegExp | undefined;
  if (entry.caseSensitive && !entry.needsContext)
    direct.push(boundary(escapeRegex(skill), ''));
  if (entry.needsContext) contextual = boundary(escapeRegex(skill), '');

  return { skill, direct, contextual, implies: entry.implies ?? [] };
}

// Dictionary entries first; general skills list (skills.ts) fills in anything else.
const MATCHERS: Matcher[] = (() => {
  const entries: Record<string, SkillEntry> = { ...SKILL_DICTIONARY };
  const known = new Set(Object.keys(entries).map((k) => k.toLowerCase()));
  for (const s of SKILLS) {
    if (known.has(s.toLowerCase())) continue;
    known.add(s.toLowerCase());
    entries[s] = AMBIGUOUS_GENERAL_SKILLS.has(s)
      ? { caseSensitive: true, needsContext: true }
      : {};
  }
  return Object.entries(entries).map(([skill, entry]) =>
    buildMatcher(skill, entry),
  );
})();

const SKILLS_HEADING =
  /^\s*(technical\s+|core\s+|key\s+)?(skills|skill\s*set|tech(nical)?\s*stack|technologies|tools(\s*(&|and)\s*technologies)?|competencies)\b/i;
const OTHER_HEADING =
  /^\s*(experience|work\s+experience|employment|projects?|education|certifications?|achievements|summary|profile|objective|awards|languages|interests|hobbies|publications)\b/i;

export interface SkillDetection {
  /** Skills written on the resume. */
  found: string[];
  /** Skills not written but demonstrated by another skill (MySQL → SQL). */
  implied: string[];
}

// ── Scoring ──────────────────────────────────────────────────────────────────

/** Must-have skills are worth 70 points, nice-to-haves 30. */
const CORE_WEIGHT = 0.7;
const BONUS_WEIGHT = 0.3;
/** Nice-to-have lists are a menu: listing 60% of them earns the full 30 points. */
const BONUS_FULL_CREDIT_SHARE = 0.6;

export function ratingFor(score: number) {
  if (score >= 80) return 'Strong match';
  if (score >= 60) return 'Good match';
  if (score >= 40) return 'Partial match';
  return 'Weak match';
}

@Injectable()
export class AnalysisService {
  getRoles(): RoleDefinition[] {
    return ROLES_CATALOG;
  }

  getRoleById(roleId?: string): RoleDefinition | undefined {
    if (!roleId) return undefined;
    return ROLES_CATALOG.find((r) => r.id === roleId);
  }

  async extractText(fileUrl: string, fileType?: string): Promise<string> {
    if (!fileUrl) return '';

    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });

      const buffer = Buffer.from(response.data);
      const isPdf =
        (fileType && fileType.toLowerCase().includes('pdf')) ||
        fileUrl.toLowerCase().includes('.pdf') ||
        buffer.slice(0, 4).toString() === '%PDF';

      const isDocx =
        (fileType &&
          (fileType.includes('word') || fileType.includes('officedocument'))) ||
        fileUrl.toLowerCase().includes('.docx');

      // 1. Try PDF extraction if PDF
      if (isPdf) {
        try {
          const text = await pdfToText(buffer);
          if (text.trim().length > 0) return text;
        } catch (pdfErr) {
          console.warn(
            'pdf-parse primary attempt failed:',
            pdfErr?.message || pdfErr,
          );
        }
      }

      // 2. Try DOCX extraction if DOCX
      if (isDocx) {
        try {
          const docxResult = await mammoth.extractRawText({ buffer });
          if (docxResult?.value && docxResult.value.trim().length > 0) {
            return docxResult.value;
          }
        } catch (docxErr) {
          console.warn(
            'mammoth primary attempt failed:',
            docxErr?.message || docxErr,
          );
        }
      }

      // 3. Fallback attempts: try pdf-parse, then mammoth, then raw string
      if (!isPdf) {
        try {
          const text = await pdfToText(buffer);
          if (text.trim().length > 10) return text;
        } catch {}
      }

      if (!isDocx) {
        try {
          const fallbackDocx = await mammoth.extractRawText({ buffer });
          if (fallbackDocx?.value && fallbackDocx.value.trim().length > 10) {
            return fallbackDocx.value;
          }
        } catch {}
      }

      // Final fallback: plain-text files only. Reading a PDF/DOCX's raw bytes as
      // text produces gibberish, so for those return nothing and let the
      // "we found very few skills" tip explain what to do.
      const isBinary = isPdf || buffer.slice(0, 2).toString() === 'PK';
      return isBinary ? '' : buffer.toString('utf-8');
    } catch (err) {
      console.error(
        'Failed to download or extract text from resume URL:',
        err?.message || err,
      );
      return '';
    }
  }

  /** Find the skills on a resume (or job description). */
  detectSkills(text: string): SkillDetection {
    const found = new Set<string>();
    if (!text) return { found: [], implied: [] };

    // Pass 1: unambiguous matches, tracked per line so pass 2 can use them as context.
    const lines = text.split(/\r?\n/);
    const lineHits: Set<string>[] = lines.map((line) => {
      const hits = new Set<string>();
      for (const m of MATCHERS)
        if (m.direct.some((r) => r.test(line))) hits.add(m.skill);
      hits.forEach((s) => found.add(s));
      return hits;
    });

    // Pass 2: everyday-word skills ("Excel", "Swift") only on a tech line or inside a skills section.
    let inSkillsSection = false;
    lines.forEach((line, i) => {
      if (SKILLS_HEADING.test(line) && line.trim().length < 60)
        inSkillsSection = true;
      else if (OTHER_HEADING.test(line) && line.trim().length < 40)
        inSkillsSection = false;

      for (const m of MATCHERS) {
        if (!m.contextual || found.has(m.skill) || !m.contextual.test(line))
          continue;
        const otherSkillOnLine = [...lineHits[i]].some((s) => s !== m.skill);
        if (otherSkillOnLine || inSkillsSection) found.add(m.skill);
      }
    });

    // Pass 3: implied skills.
    const implied = new Set<string>();
    const byName = new Map(MATCHERS.map((m) => [m.skill, m]));
    for (const s of found) {
      for (const imp of byName.get(s)?.implies ?? [])
        if (!found.has(imp)) implied.add(imp);
    }

    return { found: [...found], implied: [...implied] };
  }

  /** All skills demonstrated by the text, written or implied. */
  extractSkills(text: string): string[] {
    const { found, implied } = this.detectSkills(text);
    return [...found, ...implied];
  }

  /**
   * Role-based ATS score.
   * Score = 70 × (must-haves matched / must-haves)
   *       + 30 × min(1, nice-to-haves matched / (60% of nice-to-haves)).
   * With a pasted job description, the job description's skills are all treated as must-haves.
   */
  calculateATS(detection: SkillDetection, roleId?: string, customJd?: string) {
    const written = new Set(detection.found.map((s) => s.toLowerCase()));
    const has = (s: string) =>
      written.has(s.toLowerCase()) ||
      detection.implied.some((i) => i.toLowerCase() === s.toLowerCase());
    const isImplied = (s: string) => !written.has(s.toLowerCase()) && has(s);

    let role: { id: string; title: string; category: string; icon: string };
    let core: string[];
    let bonus: string[];
    let roleTips: string[];

    const jdSkills =
      customJd && customJd.trim().length > 20
        ? this.extractSkills(customJd)
        : [];
    if (jdSkills.length > 0) {
      role = {
        id: 'custom-jd',
        title: 'Custom job description',
        category: 'Custom',
        icon: '📋',
      };
      core = jdSkills;
      bonus = [];
      roleTips = [
        'Mirror the job description’s exact wording for skills you have.',
        'Put the job title from the posting in your summary line.',
      ];
    } else {
      const target = this.getRoleById(roleId);
      if (!target) throw new Error('UNKNOWN_ROLE');
      role = {
        id: target.id,
        title: target.title,
        category: target.category,
        icon: target.icon,
      };
      core = target.coreSkills;
      bonus = target.bonusSkills;
      roleTips = target.tips;
    }

    const coreMatched = core.filter(has);
    const coreMissing = core.filter((s) => !has(s));
    const bonusMatched = bonus.filter(has);
    const bonusMissing = bonus.filter((s) => !has(s));

    const coreRate = core.length ? coreMatched.length / core.length : 1;
    const bonusTarget = Math.max(
      1,
      Math.ceil(bonus.length * BONUS_FULL_CREDIT_SHARE),
    );
    const bonusRate = bonus.length
      ? Math.min(1, bonusMatched.length / bonusTarget)
      : core.length
        ? coreRate
        : 1;

    const atsScore = Math.round(
      100 *
        (bonus.length
          ? coreRate * CORE_WEIGHT + bonusRate * BONUS_WEIGHT
          : coreRate),
    );

    const roleSkills = new Set([...core, ...bonus].map((s) => s.toLowerCase()));
    const impliedOnly = [...coreMatched, ...bonusMatched].filter(isImplied);
    const otherSkills = detection.found
      .filter((s) => !roleSkills.has(s.toLowerCase()))
      .sort();

    // Advice built from this resume's own gaps first, then the role's general tips.
    const tips: string[] = [];
    if (coreMissing.length) {
      tips.push(
        `Add ${listJoin(coreMissing)}: ${coreMissing.length === 1 ? 'it is a must-have' : 'they are must-haves'} for ${role.title}. If you have used ${coreMissing.length === 1 ? 'it' : 'them'}, name ${coreMissing.length === 1 ? 'it' : 'them'} in a project or job bullet, not only in your skills list.`,
      );
    }
    if (impliedOnly.length) {
      tips.push(
        `Write ${listJoin(impliedOnly)} out explicitly. We credited ${impliedOnly.length === 1 ? 'it' : 'them'} from related skills, but many ATS filters search for the exact word.`,
      );
    }
    if (bonus.length && bonusMatched.length < bonusTarget) {
      tips.push(
        `Strengthen your profile with ${listJoin(bonusMissing.slice(0, 3))}. You have ${bonusMatched.length} of the ${bonusTarget} nice-to-haves needed for full credit.`,
      );
    }
    if (detection.found.length < 4) {
      tips.push(
        'We found very few skills in your file. If it is a scanned image, or uses text boxes or columns, export a text-based PDF from Word or Google Docs and upload again.',
      );
    }
    tips.push(...roleTips);

    return {
      atsScore,
      rating: ratingFor(atsScore),
      targetRole: role,
      coreSkills: core,
      bonusSkills: bonus,
      coreMatched,
      coreMissing,
      bonusMatched,
      bonusMissing,
      bonusTarget,
      impliedSkills: impliedOnly,
      otherSkills,
      matchedSkills: [...coreMatched, ...bonusMatched],
      missingSkills: coreMissing,
      bonusMissingSkills: bonusMissing,
      coreMatchPercent: Math.round(coreRate * 100),
      bonusMatchPercent: Math.round(bonusRate * 100),
      tips,
    };
  }
}

/** Text of a PDF using pdf-parse v2 (class API; v1's `pdfParse(buffer)` function no longer exists). */
export async function pdfToText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result?.text ?? '';
  } finally {
    await parser.destroy();
  }
}

function listJoin(items: string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
