import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import { PageHero, SectionHead, CtaBand, Arrow } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Resume AI · Revogen",
  description: "Check a resume against a role or a job description and see which skills match and which are missing.",
};

const ROLES = [
  ["Frontend Engineer", "Engineering"],
  ["Backend Engineer", "Engineering"],
  ["Full-Stack Developer", "Engineering"],
  ["Mobile App Developer", "Mobile"],
  ["AI & Machine Learning Engineer", "Data & AI"],
  ["Data Engineer", "Data & AI"],
  ["Data Analyst & BI Specialist", "Data & AI"],
  ["DevOps & Cloud Engineer", "Infrastructure"],
  ["QA & Automation Engineer", "Quality"],
  ["Cybersecurity Analyst", "Security"],
];

export default function ResumeAiPage() {
  return (
    <>
      <PageHero
        kicker="Resume AI"
        title="See how your resume reads for the role you want"
        sub="Upload a resume, pick a role or paste a job description, and get a match score with the skills behind it: what's there, what's missing, and what to fix first."
      >
        <Link href="/register/candidate" className="btn btn-solid btn-lg">Check my resume<Arrow /></Link>
        <Link href="#how" className="btn btn-lg">How the score works</Link>
      </PageHero>

      <section className="sec sec-top" id="how" style={{ paddingTop: 96 }}>
        <div className="wrap split">
          <div>
            <SectionHead kicker="How it works" title="Four steps, about a minute" />
            <Reveal delay={2}>
              <div className="numlist" style={{ marginTop: 40 }}>
                <div><i>01</i><div><b>Upload</b><p>PDF or Word (.docx). The text is pulled out of the file the way an applicant tracking system would read it.</p></div></div>
                <div><i>02</i><div><b>Choose a target</b><p>Pick one of ten role profiles, or paste the job description you&apos;re applying to.</p></div></div>
                <div><i>03</i><div><b>Skills are matched</b><p>Skills are recognised even when they&apos;re written differently: &quot;nodejs&quot;, &quot;Node.js&quot; and &quot;node.js&quot; all count as the same skill.</p></div></div>
                <div><i>04</i><div><b>Read the result</b><p>A score out of 100, the skills that matched, the must-haves that didn&apos;t, and tips specific to the role.</p></div></div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={3} className="sticky">
            <div className="card">
              <div className="card-h">
                <span className="t">priya_sharma_resume.pdf</span>
                <span className="s">Backend Engineer</span>
              </div>
              <div className="match"><b>74</b><span>/ 100 role match</span></div>
              <div className="meter"><i style={{ width: "74%" }} /></div>
              <div className="skills">
                <h5>Must-have · 70% of score</h5>
                <div className="chips">
                  <span className="chip">Node.js</span><span className="chip">PostgreSQL</span><span className="chip">REST API</span><span className="chip">Git</span><span className="chip miss">Docker</span>
                </div>
                <h5>Nice to have · 30% of score</h5>
                <div className="chips">
                  <span className="chip">TypeScript</span><span className="chip">Redis</span><span className="chip">Express</span><span className="chip miss">AWS</span><span className="chip miss">Prisma</span>
                </div>
              </div>
              <div className="note">Fix first: mention Docker. If you&apos;ve containerised a project, say so in that project&apos;s bullet points.</div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec sec-top">
        <div className="wrap split">
          <div>
            <SectionHead kicker="The score" title="No black box" lead="The score is plain arithmetic you can check yourself." />
          </div>
          <Reveal delay={2}>
            <div className="prose">
              <p><b>Against a role profile:</b> each role has must-have skills and nice-to-have skills. Must-haves make up 70% of the score and nice-to-haves 30%. Missing a must-have costs much more than missing a nice-to-have, which is how most hiring managers actually read a resume.</p>
              <p><b>Against a job description:</b> the skills in the description become the checklist, and the score is the share of them your resume mentions.</p>
              <p>It checks for skills, not writing quality. A high score means the right skills are on the page. It doesn&apos;t mean the resume is well written, so get a person to read it too.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec sec-top">
        <div className="wrap">
          <SectionHead kicker="Role profiles" title="Ten roles to check against" lead="Each profile lists the skills hiring teams usually screen for in that role, plus tips specific to it." />
          <Reveal delay={3}>
            <div className="rolelist">
              {ROLES.map(([r, c]) => <div key={r}>{r}<span>{c}</span></div>)}
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Check your resume before you apply"
        lead="Create a free candidate account and run your first check."
        primary={{ href: "/register/candidate", label: "Create a candidate account" }}
        secondary={{ href: "/solutions#candidates", label: "What candidates get" }}
      />
    </>
  );
}
