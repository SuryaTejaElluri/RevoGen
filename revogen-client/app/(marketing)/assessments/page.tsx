import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import { PageHero, SectionHead, CtaBand, Arrow, Icon } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Assessments · Revogen",
  description: "MCQ and coding assessments with Basic and Pro proctoring levels.",
};

const SECURITY: { label: string; basic: boolean; pro: boolean }[] = [
  { label: "Fullscreen required, exits logged", basic: true, pro: true },
  { label: "Tab switches and focus loss logged", basic: true, pro: true },
  { label: "Right-click menu disabled", basic: true, pro: true },
  { label: "Auto-submit when time runs out", basic: true, pro: true },
  { label: "Camera and microphone required", basic: false, pro: true },
  { label: "Face checks (no face, more than one face)", basic: false, pro: true },
  { label: "Copy and paste blocked", basic: true, pro: true },
  { label: "Screenshot captured on flagged events", basic: false, pro: true },
];

function Mark({ on }: { on: boolean }) {
  return on
    ? <span className="y" aria-label="Included"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-6.5" /></svg></span>
    : <span className="x" aria-label="Not included">–</span>;
}

export default function AssessmentsPage() {
  return (
    <>
      <PageHero
        kicker="Assessments"
        title="Test the skill the job actually needs"
        sub="Two formats: multiple choice for fundamentals, live coding for problem solving. Run either one on its own or both in the same round."
      >
        <Link href="/register/recruiter" className="btn btn-solid btn-lg">Create a test<Arrow /></Link>
        <Link href="#security" className="btn btn-lg">See proctoring levels</Link>
      </PageHero>

      <section className="sec sec-top" style={{ paddingTop: 96 }}>
        <div className="wrap">
          <SectionHead kicker="Formats" title="MCQ and coding, built for different jobs" />
          <div className="grid2">
            <Reveal delay={2}>
              <div className="card feat">
                <span className="ic"><Icon name="list" /></span>
                <span className="tagline">FORMAT 01</span>
                <h3>MCQ rounds</h3>
                <p>Good for checking fundamentals quickly across a large group: language basics, databases, networking, aptitude.</p>
                <ul>
                  <li>Questions pulled from your MCQ bank</li>
                  <li>Split a test into modules, each with its own question count</li>
                  <li>Easy, medium and hard difficulty</li>
                  <li>Scored instantly when the candidate submits</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={3}>
              <div className="card feat">
                <span className="ic"><Icon name="code" /></span>
                <span className="tagline">FORMAT 02</span>
                <h3>Coding tests</h3>
                <p>Candidates solve problems in a full code editor and run their solution before submitting.</p>
                <ul>
                  <li>Arrays, strings, trees, graphs, DP and more</li>
                  <li>Visible example cases plus hidden test cases</li>
                  <li>Code runs in a sandbox, not on the candidate&apos;s machine</li>
                  <li>Submitted code saved for your review</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="sec sec-top">
        <div className="wrap split">
          <div>
            <SectionHead kicker="Coding details" title="Correct answers shouldn't fail on formatting" lead="Pick how each problem's output is compared, so a right answer printed in a different order still passes when order doesn't matter." />
            <Reveal delay={3}>
              <div className="langs">
                <span>C</span><span>C++</span><span>Java</span><span>Python</span><span>JavaScript</span>
              </div>
            </Reveal>
          </div>
          <Reveal delay={2}>
            <div className="card">
              <div className="card-h"><span className="t">Output checks</span><span className="s">set per problem</span></div>
              <table className="vtable">
                <tbody>
                  <tr><td>EXACT</td><td>Same output, line for line (line endings and trailing spaces ignored)</td></tr>
                  <tr><td>IGNORE_ORDER</td><td>Same lines, or same values on one line, in any order</td></tr>
                  <tr><td>SET_COMPARE</td><td>Same unique values, duplicates ignored</td></tr>
                  <tr><td>FLOAT_COMPARE</td><td>Numbers within a set tolerance, words exact</td></tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec sec-top" id="security">
        <div className="wrap">
          <SectionHead kicker="Proctoring" title="Two security levels, so the lockdown fits the stakes" lead="Basic suits screening rounds and practice. Pro is for final rounds where you need stronger evidence." />
          <Reveal delay={3}>
            <table className="cmp">
              <thead>
                <tr>
                  <th>What&apos;s checked</th>
                  <th><b>Basic</b>Screening</th>
                  <th><b>Pro</b>Final rounds</th>
                </tr>
              </thead>
              <tbody>
                {SECURITY.map(r => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td><Mark on={r.basic} /></td>
                    <td><Mark on={r.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <Reveal delay={4}>
            <p className="lead" style={{ fontSize: 15, marginTop: 24 }}>
              Every event is logged with a timestamp and rolled into a risk score. Nothing is rejected automatically; you review the flags and decide.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Set up your first assessment"
        lead="Pick questions from the bank, choose a security level, and send the link."
        primary={{ href: "/register/recruiter", label: "Create a recruiter account" }}
        secondary={{ href: "/features", label: "All features" }}
      />
    </>
  );
}
