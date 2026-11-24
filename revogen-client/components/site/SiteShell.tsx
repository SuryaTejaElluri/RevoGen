import Link from "next/link";
import SiteNav from "./SiteNav";
import Reveal from "./Reveal";
import "./site.css";

// Wraps every public page (landing + marketing) in the shared theme, nav and footer.
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rg">
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-g">
          <div>
            <Link href="/" className="logo">
              <img src="/revogen-icon.svg" alt="" width={24} height={24} />
              Revogen
            </Link>
            <p>Resume screening, assessments and proctored coding tests for technical hiring.</p>
          </div>
          <div>
            <h6>Product</h6>
            <ul>
              <li><Link href="/features">Features</Link></li>
              <li><Link href="/assessments">Assessments</Link></li>
              <li><Link href="/resume-ai">Resume AI</Link></li>
              <li><Link href="/solutions">Solutions</Link></li>
            </ul>
          </div>
          <div>
            <h6>Company</h6>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h6>Account</h6>
            <ul>
              <li><Link href="/login">Log in</Link></li>
              <li><Link href="/register/recruiter">Recruiter sign up</Link></li>
              <li><Link href="/register/candidate">Candidate sign up</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-b">
          <span>© {new Date().getFullYear()} Revogen</span>
          <span>Built in Hyderabad</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Shared page blocks ──────────────────────────────────────────────────────

export function PageHero({ kicker, title, sub, children }: { kicker: string; title: React.ReactNode; sub: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="phero">
      <div className="hero-grid" aria-hidden />
      <div className="phero-glow" aria-hidden />
      <div className="wrap">
        <Reveal><div className="kicker">{kicker}</div></Reveal>
        <Reveal delay={1}><h1>{title}</h1></Reveal>
        <Reveal delay={2}><p className="psub">{sub}</p></Reveal>
        {children && <Reveal delay={3}><div className="hero-cta">{children}</div></Reveal>}
      </div>
    </section>
  );
}

export function SectionHead({ kicker, title, lead }: { kicker: string; title: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <>
      <Reveal><div className="kicker">{kicker}</div></Reveal>
      <Reveal delay={1}><h2 className="h2">{title}</h2></Reveal>
      {lead && <Reveal delay={2}><p className="lead">{lead}</p></Reveal>}
    </>
  );
}

export function CtaBand({ title, lead, primary, secondary }: {
  title: string; lead: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="wrap" style={{ marginTop: 120 }}>
      <Reveal>
        <div className="cta">
          <h2 className="h2">{title}</h2>
          <p className="lead">{lead}</p>
          <div className="hero-cta">
            <Link href={primary.href} className="btn btn-solid btn-lg">{primary.label}<Arrow /></Link>
            {secondary && <Link href={secondary.href} className="btn btn-lg">{secondary.label}</Link>}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" />
    </svg>
  );
}

// Small outline icons for feature cards.
const ICONS: Record<string, React.ReactNode> = {
  file: <><path d="M9 2H4.5A1.5 1.5 0 003 3.5v11A1.5 1.5 0 004.5 16h9a1.5 1.5 0 001.5-1.5V8L9 2z" /><path d="M9 2v6h6" /></>,
  list: <><path d="M6 4.5h9M6 9h9M6 13.5h9" /><path d="M3 4.5h.01M3 9h.01M3 13.5h.01" /></>,
  code: <><path d="M6 5L2 9l4 4M12 5l4 4-4 4" /></>,
  eye: <><path d="M1.5 9S4.5 3.5 9 3.5 16.5 9 16.5 9 13.5 14.5 9 14.5 1.5 9 1.5 9z" /><circle cx="9" cy="9" r="2.2" /></>,
  chart: <><path d="M3 15V9M7.5 15V4M12 15v-4M16 15H2" /></>,
  bank: <><path d="M2.5 7L9 3l6.5 4" /><path d="M4 7.5v6M7 7.5v6M11 7.5v6M14 7.5v6M2.5 15.5h13" /></>,
  coin: <><circle cx="9" cy="9" r="6.5" /><path d="M9 5.5v7M11 7H8.2a1.2 1.2 0 000 2.4h1.6a1.2 1.2 0 010 2.4H7" /></>,
  user: <><circle cx="9" cy="6" r="3" /><path d="M3 16c.7-3 3.2-4.5 6-4.5s5.3 1.5 6 4.5" /></>,
  mail: <><rect x="2" y="4" width="14" height="10.5" rx="1.5" /><path d="M2.5 5l6.5 5 6.5-5" /></>,
  lock: <><rect x="3.5" y="8" width="11" height="7.5" rx="1.5" /><path d="M6 8V5.5a3 3 0 016 0V8" /></>,
  clock: <><circle cx="9" cy="9" r="6.5" /><path d="M9 5.5V9l2.5 1.5" /></>,
  school: <><path d="M1.5 7L9 3.5 16.5 7 9 10.5 1.5 7z" /><path d="M4.5 8.5v4c1.2 1.3 2.7 2 4.5 2s3.3-.7 4.5-2v-4" /></>,
};

export function Icon({ name }: { name: keyof typeof ICONS | string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}
