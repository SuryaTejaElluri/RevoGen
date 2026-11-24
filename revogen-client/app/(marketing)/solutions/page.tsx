import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import { PageHero, CtaBand, Arrow, Icon } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Solutions · Revogen",
  description: "How hiring teams, colleges and candidates use Revogen.",
};

const USES = [
  {
    id: "recruiters",
    icon: "user",
    who: "Hiring teams",
    title: "Screen a big applicant pool without reading every resume first",
    body: "Start with a short MCQ round to filter on fundamentals, then send a proctored coding test to the people who pass. You interview a shortlist that has already shown its work.",
    flow: ["MCQ round for fundamentals", "Coding test for the shortlist", "Review code and integrity reports", "Interview the top candidates"],
    cta: { href: "/register/recruiter", label: "Create a recruiter account" },
  },
  {
    id: "colleges",
    icon: "school",
    who: "Colleges and placement cells",
    title: "Run placement practice the way companies run real tests",
    body: "Placement officers can set up timed MCQ and coding rounds for a whole batch, so students sit a realistic, proctored test before the real drive.",
    flow: ["Set up a mock placement round", "Invite a batch by email", "Proctored, timed, auto-submitted", "See who needs more practice"],
    cta: { href: "/contact", label: "Talk to us about your college" },
  },
  {
    id: "candidates",
    icon: "file",
    who: "Candidates and students",
    title: "Practise, fix your resume, and take tests in one place",
    body: "Practise before an assessment, check your resume against the role you're aiming for, and keep every test you've been invited to in one dashboard.",
    flow: ["Resume check against a role", "Practice tests", "Assigned tests in one dashboard", "Results once they're released"],
    cta: { href: "/register/candidate", label: "Create a candidate account" },
  },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        kicker="Solutions"
        title="Same tools, three kinds of people"
        sub="Revogen is built around one hiring loop, but the people using it want different things from it. Here's how each group usually works."
      >
        <Link href="#recruiters" className="btn btn-lg">Hiring teams</Link>
        <Link href="#colleges" className="btn btn-lg">Colleges</Link>
        <Link href="#candidates" className="btn btn-lg">Candidates</Link>
      </PageHero>

      {USES.map((u, idx) => (
        <section key={u.id} id={u.id} className="sec sec-top" style={idx === 0 ? { paddingTop: 96 } : undefined}>
          <div className="wrap split">
            <div>
              <Reveal>
                <div className="kicker" style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name={u.icon} />{u.who}</div>
              </Reveal>
              <Reveal delay={1}><h2 className="h2">{u.title}</h2></Reveal>
              <Reveal delay={2}><p className="lead">{u.body}</p></Reveal>
              <Reveal delay={3}>
                <div className="hero-cta" style={{ justifyContent: "flex-start", marginTop: 28 }}>
                  <Link href={u.cta.href} className="btn btn-solid">{u.cta.label}<Arrow /></Link>
                </div>
              </Reveal>
            </div>
            <Reveal delay={2}>
              <div className="card" style={{ padding: 28 }}>
                <div className="card-h"><span className="t">A typical round</span><span className="s">{u.who}</span></div>
                <div className="numlist">
                  {u.flow.map((f, i) => (
                    <div key={f} style={{ padding: "16px 0" }}>
                      <i>{String(i + 1).padStart(2, "0")}</i>
                      <div><b style={{ fontSize: 15, margin: 0 }}>{f}</b></div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      <CtaBand
        title="Not sure which fits you?"
        lead="Tell us how you hire or what you're preparing for, and we'll point you to the right setup."
        primary={{ href: "/contact", label: "Get in touch" }}
        secondary={{ href: "/features", label: "See all features" }}
      />
    </>
  );
}
