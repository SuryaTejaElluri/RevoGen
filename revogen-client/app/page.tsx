"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import SiteShell from "@/components/site/SiteShell";
import Reveal from "@/components/site/Reveal";

// ─── Data ────────────────────────────────────────────────────────────────────
const LOOP = [
  {
    n: "01",
    title: "Screen",
    body: "Upload a PDF or Word resume and pick the role. Revogen pulls out the skills, checks them against what the role needs, and tells you what's missing.",
  },
  {
    n: "02",
    title: "Assess",
    body: "Send an MCQ round, a coding test, or both. Questions come from your own bank, and candidates get a link by email.",
  },
  {
    n: "03",
    title: "Decide",
    body: "Every attempt comes back with a score, the submitted code, and an integrity report. You compare people on evidence, not on how well their resume was written.",
  },
];

const STEPS = [
  { title: "Build the test", body: "Pick questions from the MCQ and coding banks, set difficulty and time limits." },
  { title: "Invite candidates", body: "Each candidate gets a unique test link by email. No account juggling on your side." },
  { title: "They take it, proctored", body: "Camera, fullscreen and tab activity are tracked while they work." },
  { title: "You review", body: "Scores, code, test-case results and flagged events, all on one page per candidate." },
];

const FAQS = [
  {
    q: "How does pricing work?",
    a: "Revogen runs on Revo Credits. Actions like sending an assessment use credits, and you buy more in packs when you need them. There's no per-seat licence.",
  },
  {
    q: "Which languages can candidates code in?",
    a: "C, C++, Java, Python and JavaScript. Code runs in a sandbox against your test cases, including hidden ones the candidate can't see.",
  },
  {
    q: "What does the proctoring actually check?",
    a: "Whether the camera is on, whether a face is in frame (and only one), tab switches, leaving fullscreen, window resizes and idle time. Each event is logged with a timestamp, and the attempt gets a risk score. Nothing is auto-rejected; you make the call.",
  },
  {
    q: "How is the resume match calculated?",
    a: "Each role has must-have and nice-to-have skills. Must-haves count for 70% of the score and nice-to-haves for 30%. Skill names are normalised, so \"nodejs\" and \"Node.js\" count as the same thing.",
  },
  {
    q: "Can I use my own questions?",
    a: "Yes. Write your own MCQs and coding problems, or build tests from the shared question bank. Coding problems support exact, unordered, set and floating-point output checks.",
  },
  {
    q: "Is there anything for candidates?",
    a: "Candidates can practise, check their resume against a role, and see the results of tests they've been assigned.",
  },
];

// ─── Small pieces ────────────────────────────────────────────────────────────
function CodeLine({ n, children }: { n: number; children?: React.ReactNode }) {
  return <div className="ln"><i>{n}</i><span>{children}</span></div>;
}

const CASES = [
  { name: "Example 1", result: "Passed" },
  { name: "Example 2", result: "Passed" },
  { name: "Hidden · 12 cases", result: "12 / 12" },
  { name: "Hidden · large input", result: "0.04s" },
];

// Cycles test cases: pending → running → passed, then restarts.
function useTestRun() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? CASES.length * 2 : 0);
  useEffect(() => {
    if (reduce) return;
    const done = step >= CASES.length * 2;
    const t = setTimeout(() => setStep(s => (s >= CASES.length * 2 ? 0 : s + 1)), done ? 4200 : step === 0 ? 1200 : 550);
    return () => clearTimeout(t);
  }, [step, reduce]);
  return step;
}

function useCountdown(start: number) {
  const [left, setLeft] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setLeft(s => (s <= 0 ? start : s - 1)), 1000);
    return () => clearInterval(t);
  }, [start]);
  const m = Math.floor(left / 60), s = left % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ProductFrame() {
  const step = useTestRun();
  const timer = useCountdown(32 * 60 + 14);
  const allDone = step >= CASES.length * 2;
  return (
    <div className="frame">
      <div className="frame-bar">
        <div className="l">
          <span className="win" aria-hidden><i /><i /><i /></span>
          <span className="crumb">Backend round · <b>Question 2 of 3</b></span>
          <span className="pill">Medium</span>
        </div>
        <div className="l">
          <span className="pill keep"><span className="dot" /> Camera on</span>
          <span className="pill" style={{ fontVariantNumeric: "tabular-nums" }}>{timer} left</span>
        </div>
      </div>
      <div className="ide">
        <div className="prob">
          <div className="lbl">Problem</div>
          <h4>Merge meeting slots</h4>
          <div className="tags"><span>Arrays</span><span>Sorting</span></div>
          <p>You&apos;re given a list of booked time slots as [start, end] pairs. Merge any that overlap and return the slots in order.</p>
          <pre>{"Input:  [[1,3],[2,6],[8,10]]\nOutput: [[1,6],[8,10]]"}</pre>
        </div>
        <div className="code">
          <div className="code-tabs"><span className="sel">solution.py</span><span>Python 3</span></div>
          <div className="code-body">
            <CodeLine n={1}><span className="k">def</span> <span className="f">merge</span>(slots):</CodeLine>
            <CodeLine n={2}>    <span className="k">if not</span> slots:</CodeLine>
            <CodeLine n={3}>        <span className="k">return</span> []</CodeLine>
            <CodeLine n={4}>    slots.<span className="f">sort</span>(key=<span className="k">lambda</span> s: s[<span className="n">0</span>])</CodeLine>
            <CodeLine n={5}>    merged = [slots[<span className="n">0</span>]]</CodeLine>
            <CodeLine n={6} />
            <CodeLine n={7}>    <span className="k">for</span> start, end <span className="k">in</span> slots[<span className="n">1</span>:]:</CodeLine>
            <CodeLine n={8}>        <span className="c"># overlaps with the last one we kept</span></CodeLine>
            <CodeLine n={9}>        <span className="k">if</span> start &lt;= merged[-<span className="n">1</span>][<span className="n">1</span>]:</CodeLine>
            <CodeLine n={10}>            merged[-<span className="n">1</span>][<span className="n">1</span>] = <span className="f">max</span>(merged[-<span className="n">1</span>][<span className="n">1</span>], end)</CodeLine>
            <CodeLine n={11}>        <span className="k">else</span>:</CodeLine>
            <CodeLine n={12}>            merged.<span className="f">append</span>([start, end])</CodeLine>
            <CodeLine n={13} />
            <CodeLine n={14}>    <span className="k">return</span> merged<span className="caret" aria-hidden /></CodeLine>
          </div>
        </div>
        <div>
          <div className="lbl">Test cases</div>
          <div className="cases">
            {CASES.map((c, i) => {
              const state = step > i * 2 + 1 ? "done" : step === i * 2 + 1 ? "run" : "pend";
              return (
                <div className="case" key={c.name}>
                  <span className="t">{c.name}</span>
                  {state === "done" ? <span className="ok">{c.result}</span>
                    : state === "run" ? <span className="run">Running</span>
                    : <span className="pend">Queued</span>}
                </div>
              );
            })}
          </div>
          <div className="submit">
            <span>{allDone ? "All tests passed" : "Running tests…"}</span>
            <span className="btn btn-solid">Submit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumeCard() {
  return (
    <div className="card">
      <div className="card-h">
        <span className="t">priya_sharma_resume.pdf</span>
        <span className="s">Backend Engineer · Node.js</span>
      </div>
      <div className="match"><b>74</b><span>/ 100 role match</span></div>
      <div className="meter"><i style={{ width: "74%" }} /></div>
      <div className="skills">
        <h5>Must-have</h5>
        <div className="chips">
          <span className="chip">Node.js</span>
          <span className="chip">PostgreSQL</span>
          <span className="chip">REST API</span>
          <span className="chip">Git</span>
          <span className="chip miss">Docker</span>
        </div>
        <h5>Nice to have</h5>
        <div className="chips">
          <span className="chip">TypeScript</span>
          <span className="chip">Redis</span>
          <span className="chip miss">AWS</span>
          <span className="chip miss">Prisma</span>
        </div>
      </div>
      <div className="note">Strong core fit. Docker is the only must-have not mentioned anywhere on the resume.</div>
    </div>
  );
}

function ValidatorCard() {
  return (
    <div className="card">
      <div className="card-h">
        <span className="t">How output is checked</span>
        <span className="s">per problem</span>
      </div>
      <table className="vtable">
        <tbody>
          <tr><td>EXACT</td><td>Same output, line for line (line endings and trailing spaces ignored)</td></tr>
          <tr><td>IGNORE_ORDER</td><td>Same lines, or same values on one line, in any order</td></tr>
          <tr><td>SET_COMPARE</td><td>Same unique values, duplicates ignored</td></tr>
          <tr><td>FLOAT_COMPARE</td><td>Numbers within a set tolerance, words exact</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function ProctorCard() {
  return (
    <div className="card">
      <div className="card-h">
        <span className="t">Integrity report · Rahul M.</span>
        <span className="s">MCQ round · 40 min</span>
      </div>
      <div className="log">
        <div className="log-row"><time>10:02</time><span>Camera and mic enabled</span><span className="sev ok">ok</span></div>
        <div className="log-row"><time>10:17</time><span>Switched to another tab for 8s</span><span className="sev warn">flag</span></div>
        <div className="log-row"><time>10:23</time><span>No face detected for 12s</span><span className="sev warn">flag</span></div>
        <div className="log-row"><time>10:31</time><span>Exited fullscreen</span><span className="sev warn">flag</span></div>
        <div className="log-row"><time>10:42</time><span>Submitted</span><span className="sev">done</span></div>
      </div>
      <div className="risk">
        <div><b>3</b><span>Flags</span></div>
        <div><b className="warn">28</b><span>Risk score</span></div>
        <div><b>72%</b><span>Test score</span></div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="hero">
        <div className="hero-grid" aria-hidden />
        <div className="hero-glow" aria-hidden />
        <div className="wrap">
          <Reveal>
            <Link href="/assessments" className="eyebrow">
              <b>New</b> Proctored coding tests in 5 languages
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M4.5 3l3 3-3 3" /></svg>
            </Link>
          </Reveal>
          <Reveal delay={1}>
            <h1>
              Hire engineers on what they{" "}
              <span className="u">
                can do
                <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 9 C 50 2, 120 2, 198 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              , not what their resume says.
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="hero-sub">Resume screening, MCQ rounds and live coding tests in one place, with proctoring built in. You shortlist on real work, and candidates get a fair shot.</p>
          </Reveal>
          <Reveal delay={3}>
            <div className="hero-cta">
              <Link href="/register/recruiter" className="btn btn-solid btn-lg">
                Start hiring
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" /></svg>
              </Link>
              <Link href="/register/candidate" className="btn btn-lg">I&apos;m a candidate</Link>
            </div>
          </Reveal>
          <Reveal delay={4}>
            <div className="hero-facts">
              {["C, C++, Java, Python, JavaScript", "Hidden test cases", "Camera and tab proctoring"].map(f => (
                <span key={f}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 7.5l2.5 2.5L11 4.5" /></svg>
                  {f}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={6}>
            <div className="stage">
              <div className="float float-l" aria-hidden>
                <div className="ft">Resume match</div>
                <div className="big"><b>74</b><span style={{ color: "var(--dim)" }}>/ 100</span></div>
                <div className="bar"><i style={{ width: "74%" }} /></div>
                <div className="mini"><span>Node.js</span><span>PostgreSQL</span><span>REST API</span></div>
              </div>
              <ProductFrame />
              <div className="float float-r" aria-hidden>
                <div className="ft">Integrity</div>
                <div className="row2"><span>Tab switches</span><span>0</span></div>
                <div className="row2"><span>Fullscreen exits</span><span>0</span></div>
                <div className="row2"><span>Risk score</span><span className="ok">Low</span></div>
              </div>
              <div className="fade-bottom" aria-hidden />
            </div>
          </Reveal>
        </div>
      </section>

      {/* The loop */}
      <section className="sec">
        <div className="wrap">
          <Reveal><div className="kicker">How it fits together</div></Reveal>
          <Reveal delay={1}><h2 className="h2">One place for the whole technical hiring loop</h2></Reveal>
          <Reveal delay={2}><p className="lead">Most teams stitch this together from a job board, a Google Form and a separate coding site. Revogen does all three steps in one place.</p></Reveal>
          <Reveal delay={3}>
            <div className="loop">
              {LOOP.map(s => (
                <div key={s.n}>
                  <span className="num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Feature deep dives */}
      <section className="sec sec-top" id="features">
        <div className="wrap">
          <Reveal><div className="kicker">What&apos;s inside</div></Reveal>
          <Reveal delay={1}><h2 className="h2">The parts that save you the most time</h2></Reveal>

          <div className="stack">
            <div className="row">
              <Reveal>
                <h3>Resume screening that shows its working</h3>
                <p className="lead">Pick a role and Revogen reads the resume against it. You see which skills are there, which aren&apos;t, and why the score is what it is.</p>
                <ul className="ticks">
                  <li><span><b>PDF and Word</b> resumes are both supported</span></li>
                  <li><span><b>Must-haves count for 70%</b> of the score, nice-to-haves for 30%</span></li>
                  <li><span><b>Skill names are normalised</b>, so &quot;nodejs&quot; and &quot;Node.js&quot; count as the same skill</span></li>
                </ul>
              </Reveal>
              <Reveal delay={2}><ResumeCard /></Reveal>
            </div>

            <div className="row flip">
              <Reveal>
                <h3>Coding tests that run real code</h3>
                <p className="lead">Candidates write and run code in the browser. Submissions are checked against your test cases in a sandbox, including hidden ones they never see.</p>
                <div className="langs">
                  <span>C</span><span>C++</span><span>Java</span><span>Python</span><span>JavaScript</span>
                </div>
                <ul className="ticks">
                  <li><span><b>Topics from arrays to DP</b>, at easy, medium and hard</span></li>
                  <li><span><b>Choose how output is checked</b>, so a correct answer isn&apos;t failed over its formatting</span></li>
                </ul>
              </Reveal>
              <Reveal delay={2}><ValidatorCard /></Reveal>
            </div>

            <div className="row">
              <Reveal>
                <h3>Proctoring that flags, not accuses</h3>
                <p className="lead">Every attempt is logged with a timestamp, so you can see exactly what happened and when. Nobody is auto-rejected; a person makes the call.</p>
                <ul className="ticks">
                  <li><span><b>Camera and face checks</b>: no face, or more than one</span></li>
                  <li><span><b>Browser activity</b>: tab switches, fullscreen exits, resizes, idle time</span></li>
                  <li><span><b>Basic and Pro levels</b>, so a practice quiz isn&apos;t locked down like a final round</span></li>
                </ul>
              </Reveal>
              <Reveal delay={2}><ProctorCard /></Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="sec sec-top">
        <div className="wrap">
          <Reveal><div className="kicker">Running a round</div></Reveal>
          <Reveal delay={1}><h2 className="h2">From a blank test to a shortlist</h2></Reveal>
          <div className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i + 2} className="step">
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="sec sec-top">
        <div className="wrap">
          <Reveal><div className="kicker">Who it&apos;s for</div></Reveal>
          <Reveal delay={1}><h2 className="h2">Two sides of the same interview</h2></Reveal>
          <div className="aud">
            <Reveal delay={2} className="card">
              <h3>Recruiters and hiring teams</h3>
              <p>Run screening rounds without the spreadsheet.</p>
              <ul>
                <li>MCQ and coding question banks</li>
                <li>Email invites with unique test links</li>
                <li>Scores, code and integrity reports per candidate</li>
                <li>Pay with credits, no per-seat licence</li>
              </ul>
              <Link href="/register/recruiter" className="btn btn-solid">Create a recruiter account</Link>
            </Reveal>
            <Reveal delay={3} className="card">
              <h3>Candidates</h3>
              <p>Practise, then show what you can actually do.</p>
              <ul>
                <li>Practice tests before the real thing</li>
                <li>Resume check against the role you want</li>
                <li>All your assigned tests in one dashboard</li>
                <li>Results you can see once they&apos;re released</li>
              </ul>
              <Link href="/register/candidate" className="btn">Create a candidate account</Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec sec-top">
        <div className="wrap faq">
          <Reveal>
            <div className="kicker">FAQ</div>
            <h2 className="h2">Questions we get asked</h2>
            <p className="lead">Something not covered? <Link href="/contact" style={{ color: "var(--text)", textDecoration: "underline", textUnderlineOffset: 3 }}>Get in touch</Link> and we&apos;ll answer it.</p>
          </Reveal>
          <Reveal delay={2}>
            <div>
              {FAQS.map(f => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="wrap">
        <Reveal>
          <div className="cta">
            <h2 className="h2">Run your next screening round on Revogen</h2>
            <p className="lead">Set up a test, invite a few candidates, and see the results.</p>
            <div className="hero-cta">
              <Link href="/register/recruiter" className="btn btn-solid btn-lg">Start hiring</Link>
              <Link href="/contact" className="btn btn-lg">Talk to us</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </SiteShell>
  );
}
