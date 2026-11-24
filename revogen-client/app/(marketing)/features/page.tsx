import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import { PageHero, SectionHead, CtaBand, Arrow, Icon } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Features · Revogen",
  description: "Everything Revogen does: resume screening, MCQ and coding assessments, proctoring, results and credits.",
};

const MODULES = [
  {
    icon: "file", title: "Resume screening",
    body: "Upload a PDF or Word resume, choose a role, and get a match score with the reasoning behind it.",
    points: ["10 role profiles, from frontend to data", "Must-have vs nice-to-have skills", "Missing skills listed plainly"],
    href: "/resume-ai",
  },
  {
    icon: "list", title: "MCQ assessments",
    body: "Timed multiple-choice rounds built from your own question bank, split into modules if you need sections.",
    points: ["Easy, medium and hard questions", "Per-test time limits with auto-submit", "Scores ready as soon as they finish"],
    href: "/assessments",
  },
  {
    icon: "code", title: "Coding assessments",
    body: "Candidates write and run real code in the browser. Submissions are checked against visible and hidden test cases.",
    points: ["C, C++, Java, Python, JavaScript", "Sandboxed execution", "Four ways to compare output"],
    href: "/assessments",
  },
  {
    icon: "eye", title: "Proctoring",
    body: "Each attempt carries a timestamped log of what happened, and a risk score you can sort by.",
    points: ["Tab switches and fullscreen exits", "Camera face checks on Pro tests", "Copy and paste blocked on Pro tests"],
    href: "/assessments#security",
  },
  {
    icon: "chart", title: "Results and reports",
    body: "One page per candidate with their score, answers, submitted code and integrity report side by side.",
    points: ["Compare candidates within a test", "See exactly which test cases failed", "Flags shown in context, not hidden"],
  },
  {
    icon: "bank", title: "Question banks",
    body: "Keep MCQ and coding questions in one place and reuse them across tests instead of rewriting every round.",
    points: ["Tag by topic and difficulty", "Coding topics from arrays to DP", "Shared bank plus your own questions"],
  },
  {
    icon: "mail", title: "Email invitations",
    body: "Invite candidates by email. Each one gets a unique link tied to their attempt.",
    points: ["No candidate account juggling for you", "Track who has started and finished"],
  },
  {
    icon: "coin", title: "Revo Credits",
    body: "Pay for what you run. Buy credit packs when you need them; every credit spent is logged.",
    points: ["No per-seat licence", "Full transaction history", "Bonus credits on larger packs"],
  },
  {
    icon: "user", title: "Candidate dashboard",
    body: "Candidates get their own space to practise, check their resume and see assigned tests and results.",
    points: ["Practice tests", "Results once released"],
    href: "/solutions#candidates",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        kicker="Features"
        title="Everything Revogen does, in plain terms"
        sub="No feature tour, no buzzwords. Here's what's in the product today and what each part is for."
      >
        <Link href="/register/recruiter" className="btn btn-solid btn-lg">Start hiring<Arrow /></Link>
        <Link href="/contact" className="btn btn-lg">Ask a question</Link>
      </PageHero>

      <section className="sec sec-top" style={{ paddingTop: 96 }}>
        <div className="wrap">
          <SectionHead kicker="The product" title="Nine parts that work together" lead="Each one is useful on its own. Together they cover a technical hiring round from first resume to final shortlist." />
          <div className="grid3">
            {MODULES.map((m, i) => (
              <Reveal key={m.title} delay={(i % 3) + 2}>
                <div className="card feat">
                  <span className="ic"><Icon name={m.icon} /></span>
                  <h3>{m.title}</h3>
                  <p>{m.body}</p>
                  <ul>{m.points.map(p => <li key={p}>{p}</li>)}</ul>
                  {m.href && <Link href={m.href} className="more">Learn more<Arrow /></Link>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-top">
        <div className="wrap split">
          <div className="sticky">
            <SectionHead kicker="How we think about it" title="Built to help you decide, not to decide for you" />
          </div>
          <Reveal delay={2}>
            <div className="numlist">
              <div><i>01</i><div><b>Show the working</b><p>A score on its own isn&apos;t much use. Every number in Revogen comes with the evidence behind it: matched skills, failed test cases, logged events.</p></div></div>
              <div><i>02</i><div><b>Flag, don&apos;t reject</b><p>Proctoring raises flags. It never fails a candidate automatically. A tab switch might be cheating, or a dropped Wi-Fi connection. You know the context; we don&apos;t.</p></div></div>
              <div><i>03</i><div><b>Fair to the candidate</b><p>Clear instructions, a real editor, and correct answers that aren&apos;t failed because of trailing spaces or line order.</p></div></div>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="See it on your own hiring round"
        lead="Create a recruiter account, set up one test, and send it to a few candidates."
        primary={{ href: "/register/recruiter", label: "Start hiring" }}
        secondary={{ href: "/assessments", label: "How assessments work" }}
      />
    </>
  );
}
