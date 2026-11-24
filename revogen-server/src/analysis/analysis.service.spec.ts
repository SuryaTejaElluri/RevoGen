import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from './analysis.service';
import { ROLES_CATALOG } from './roles';
import { SKILL_DICTIONARY } from './skill-dictionary';

const FRONTEND_RESUME = `Priya Sharma | priya@mail.com | +91 98765 43210 | github.com/priya
SUMMARY Frontend engineer with 3 years building React apps.
EXPERIENCE
Software Engineer, Acme (Jan 2022 - Present)
- Built a design system in React and TypeScript used by 6 teams, cutting UI bugs by 40%.
- Improved page load time by 35% using code splitting and lazy loading.
- Wrote Jest and Cypress tests, raising coverage from 45% to 80%.
PROJECTS
Shop UI - Next.js, Tailwind, REST API integration
EDUCATION B.Tech Computer Science, JNTU, 2021
SKILLS JavaScript, TypeScript, React, Next.js, HTML, CSS, Tailwind, Redux, Git`;

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisService],
    }).compile();
    service = module.get<AnalysisService>(AnalysisService);
  });

  describe('role catalog', () => {
    it('has 20 roles with unique ids', () => {
      expect(ROLES_CATALOG).toHaveLength(20);
      expect(new Set(ROLES_CATALOG.map((r) => r.id)).size).toBe(20);
    });

    it('only uses skills the dictionary can detect', () => {
      const missing = ROLES_CATALOG.flatMap((r) => [
        ...r.coreSkills,
        ...r.bonusSkills,
      ]).filter((s) => !SKILL_DICTIONARY[s]);
      expect(missing).toEqual([]);
    });

    it('gives every role at least 5 must-haves and 5 nice-to-haves', () => {
      for (const r of ROLES_CATALOG) {
        expect(r.coreSkills.length).toBeGreaterThanOrEqual(5);
        expect(r.bonusSkills.length).toBeGreaterThanOrEqual(5);
      }
    });

    it('detects every role skill when written by its canonical name in a skills list', () => {
      for (const r of ROLES_CATALOG) {
        const skills = [...r.coreSkills, ...r.bonusSkills];
        const { found } = service.detectSkills(`SKILLS\n${skills.join(', ')}`);
        expect(skills.filter((s) => !found.includes(s))).toEqual([]);
      }
    });
  });

  describe('skill detection', () => {
    it('ignores everyday words that are also skill names', () => {
      const { found } = service.detectSkills(
        'I like to go hiking. I excel at teamwork. We react quickly and express ideas in a swift way. Rust on my bike. Shell beach. The room had a spark.',
      );
      expect(found).toEqual([]);
    });

    it('counts everyday-word skills on a tech line or in a skills section', () => {
      expect(
        service.detectSkills('Tools: Excel, Power BI, SQL').found,
      ).toContain('Excel');
      expect(service.detectSkills('SKILLS\nSwift\nXcode').found).toContain(
        'Swift',
      );
      expect(
        service.detectSkills('Built dashboards in Microsoft Excel').found,
      ).toContain('Excel');
    });

    it('recognises common spellings', () => {
      const { found } = service.detectSkills(
        'nodejs, k8s, sklearn, reactjs, postgres, ci/cd',
      );
      expect(found).toEqual(
        expect.arrayContaining([
          'Node.js',
          'Kubernetes',
          'Scikit-learn',
          'React',
          'PostgreSQL',
          'CI/CD',
        ]),
      );
    });

    it('does not confuse Java with JavaScript or .NET with ASP.NET', () => {
      expect(service.detectSkills('JavaScript developer').found).not.toContain(
        'Java',
      );
      expect(service.detectSkills('ASP.NET MVC').found).toContain('ASP.NET');
    });

    it('credits implied skills separately', () => {
      const { found, implied } = service.detectSkills(
        'Built APIs with Django and MySQL',
      );
      expect(found).toEqual(expect.arrayContaining(['Django', 'MySQL']));
      expect(implied).toEqual(expect.arrayContaining(['Python', 'SQL']));
    });
  });

  describe('ATS score', () => {
    it('scores a real frontend resume high for Frontend and low for Data Analyst', () => {
      const detection = service.detectSkills(FRONTEND_RESUME);
      const frontend = service.calculateATS(detection, 'frontend-engineer');
      const analyst = service.calculateATS(detection, 'data-analyst');
      expect(frontend.atsScore).toBeGreaterThanOrEqual(85);
      expect(frontend.coreMissing).toEqual([]);
      expect(analyst.atsScore).toBeLessThan(30);
      expect(analyst.coreMissing).toEqual(
        expect.arrayContaining(['SQL', 'Excel', 'Power BI']),
      );
    });

    it('weights must-haves at 70% and caps nice-to-haves at 30%', () => {
      const role = ROLES_CATALOG.find((r) => r.id === 'java-developer')!;
      const onlyCore = service.calculateATS(
        { found: role.coreSkills, implied: [] },
        role.id,
      );
      const onlyBonus = service.calculateATS(
        { found: role.bonusSkills, implied: [] },
        role.id,
      );
      expect(onlyCore.atsScore).toBe(70);
      expect(onlyBonus.atsScore).toBe(30);
      expect(
        service.calculateATS(
          { found: [...role.coreSkills, ...role.bonusSkills], implied: [] },
          role.id,
        ).atsScore,
      ).toBe(100);
    });

    it('explains missing must-haves in the tips', () => {
      const res = service.calculateATS(
        { found: ['Java', 'Git'], implied: [] },
        'java-developer',
      );
      expect(res.tips[0]).toMatch(/Spring Boot/);
      expect(res.rating).toBe('Weak match');
    });

    it('rejects an unknown role', () => {
      expect(() =>
        service.calculateATS({ found: [], implied: [] }, 'astronaut'),
      ).toThrow();
    });

    it('scores against a pasted job description', () => {
      const res = service.calculateATS(
        service.detectSkills(FRONTEND_RESUME),
        undefined,
        'We need a developer with React, TypeScript, GraphQL and AWS experience.',
      );
      expect(res.targetRole.id).toBe('custom-jd');
      expect(res.coreMissing).toEqual(
        expect.arrayContaining(['GraphQL', 'AWS']),
      );
      expect(res.atsScore).toBe(50);
    });
  });
});
