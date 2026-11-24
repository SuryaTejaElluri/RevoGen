import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import { PageHero, SectionHead, CtaBand, Arrow } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "About · Revogen",
  description: "Why we're building Revogen, and how.",
};

const STACK = [
  ["Next.js", "Web app"],
  ["NestJS", "API server"],
  ["PostgreSQL", "Database, via Prisma"],
  ["Judge0", "Sandboxed code execution"],
  ["Monaco", "In-browser code editor"],
  ["MediaPipe", "On-device face detection"],
  ["Cloudinary", "Resume file storage"],
  ["TypeScript", "Front to back"],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About"
        title="We think technical hiring should run on evidence"
        sub="Revogen is built in Hyderabad by engineers who have sat on both sides of the interview table, and wanted a better way to run it."
      >
        <Link href="/contact" className="btn btn-solid btn-lg">Get in touch<Arrow /></Link>
      </PageHero>

      <section className="sec sec-top" style={{ paddingTop: 96 }}>
        <div className="wrap split">
          <div className="sticky">
            <SectionHead kicker="Why Revogen" title="Resumes are a poor proxy for skill" />
          </div>
          <Reveal delay={2}>
            <div className="prose">
              <p>Most technical hiring still starts with a resume screen. Someone skims a page, looks for familiar keywords and company names, and decides in a few seconds. Good engineers get filtered out for listing the wrong things, and weaker ones get through because they listed the right ones.</p>
              <p>The usual fix is a patchwork: a Google Form for MCQs, a separate coding site, a spreadsheet to track it all, and no record of what happened while the candidate was taking the test.</p>
              <p><b>Revogen puts that loop in one place.</b> Screen the resume, test the skill, see the code and the integrity log, then decide. Every score comes with the evidence behind it, so the decision stays with a person.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec sec-top">
        <div className="wrap">
          <SectionHead kicker="Principles" title="What we try to get right" />
          <div className="grid3">
            {[
              ["Show the working", "If we give you a number, we show you how we got it. No unexplained scores."],
              ["Fair to candidates", "Clear rules, a proper editor, and output checks that don't fail correct answers over formatting."],
              ["People make the call", "Proctoring flags events; it doesn't reject anyone. Context matters, and only you have it."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i + 2}>
                <div className="card feat">
                  <span className="tagline">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-top">
        <div className="wrap">
          <SectionHead kicker="Under the hood" title="What it's built with" lead="For the engineers reading this: here's the stack." />
          <Reveal delay={3}>
            <div className="tech">
              {STACK.map(([n, d]) => <div key={n}><b>{n}</b><span>{d}</span></div>)}
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Want to try it, or work with us?"
        lead="Questions, feedback and partnership ideas are all welcome."
        primary={{ href: "/contact", label: "Contact us" }}
        secondary={{ href: "/register", label: "Create an account" }}
      />
    </>
  );
}
