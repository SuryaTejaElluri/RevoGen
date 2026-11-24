import Link from "next/link";
import "./auth.css";

// Split layout for login and register: product showcase on the left, form on the right.
export default function AuthShell({ kicker, title, sub, topRight, children }: {
  kicker: string;
  title: React.ReactNode;
  sub: string;
  topRight: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="au">
      <aside className="side" aria-hidden>
        <div className="side-grid" />
        <div className="side-glow" />
        <Link href="/" className="logo" tabIndex={-1}>
          <img src="/revogen-icon.svg" alt="" width={28} height={28} />
          Revogen
        </Link>

        <div className="side-body">
          <span className="pill"><b>Revogen</b>{kicker}</span>
          <h1>{title}</h1>
          <p className="side-sub">{sub}</p>

          <div className="proof">
            <div className="pc">
              <div className="pc-h"><span className="ico ok"><AuthIcon name="code" size={13} /></span>Coding test · Merge meeting slots</div>
              <div className="pc-row"><span>Hidden test cases</span><span className="ok-t">12 / 12 passed</span></div>
            </div>
            <div className="pc">
              <div className="pc-h"><span className="ico"><AuthIcon name="file" size={13} /></span>Resume match · Backend Engineer</div>
              <div className="pc-row"><span>Role match</span><span>74 / 100</span></div>
              <div className="pc-bar"><i style={{ width: "74%" }} /></div>
            </div>
            <div className="pc">
              <div className="pc-h"><span className="ico warn"><AuthIcon name="shield" size={13} /></span>Integrity report · Pro test</div>
              <div className="pc-row"><span>Tab switches · Fullscreen exits</span><span>0 · 0</span></div>
            </div>
          </div>

          <div className="ticks">
            {["5 coding languages", "Basic and Pro proctoring", "Resume match in a minute"].map(t => (
              <span key={t}><AuthIcon name="check" size={14} />{t}</span>
            ))}
          </div>
        </div>

        <div className="side-foot">
          <span>© {new Date().getFullYear()} Revogen</span>
          <span>Built in Hyderabad</span>
        </div>
      </aside>

      <main className="main">
        <div className="main-top">
          <Link href="/" className="logo">
            <img src="/revogen-icon.svg" alt="" width={24} height={24} />
            Revogen
          </Link>
          <Link href="/" className="back"><AuthIcon name="back" size={14} />Back to site</Link>
          <span>{topRight}</span>
        </div>
        <div className="form-wrap">{children}</div>
      </main>
    </div>
  );
}

const PATHS: Record<string, React.ReactNode> = {
  mail: <><rect x="2.5" y="4" width="15" height="12" rx="2" /><path d="M3 5.5l7 5 7-5" /></>,
  lock: <><rect x="4" y="9" width="12" height="8.5" rx="2" /><path d="M7 9V6.5a3 3 0 016 0V9" /></>,
  user: <><circle cx="10" cy="6.5" r="3.2" /><path d="M3.5 17.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /></>,
  phone: <><path d="M5 2.5h3l1.5 4-2 1.2a9 9 0 004.8 4.8l1.2-2 4 1.5v3a2 2 0 01-2 2A14.5 14.5 0 013 4.5a2 2 0 012-2z" /></>,
  building: <><rect x="4" y="2.5" width="12" height="15" rx="1.5" /><path d="M7.5 6h1M11.5 6h1M7.5 9.5h1M11.5 9.5h1M8.5 17.5v-3h3v3" /></>,
  eye: <><path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z" /><circle cx="10" cy="10" r="2.5" /></>,
  eyeOff: <><path d="M3 3l14 14M8.6 4.2A8.6 8.6 0 0110 4c5.5 0 8.5 6 8.5 6a14 14 0 01-2.4 3.2M5.4 5.6A14 14 0 001.5 10s3 6 8.5 6a8 8 0 004-1.1" /><path d="M8.2 8.3a2.5 2.5 0 003.5 3.5" /></>,
  arrow: <><path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" /></>,
  back: <><path d="M16 10H5M9 5.5L4.5 10 9 14.5" /></>,
  alert: <><circle cx="10" cy="10" r="7.5" /><path d="M10 6.5v4M10 13.5h.01" /></>,
  ok: <><circle cx="10" cy="10" r="7.5" /><path d="M6.8 10.2l2.2 2.2 4.3-4.6" /></>,
  check: <><path d="M4 10.5l3.5 3.5L16 5.5" /></>,
  code: <><path d="M7 5.5L2.5 10 7 14.5M13 5.5l4.5 4.5-4.5 4.5" /></>,
  file: <><path d="M11 2.5H5.5A1.5 1.5 0 004 4v12a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0016 16V7.5l-5-5z" /><path d="M11 2.5v5h5" /></>,
  shield: <><path d="M10 2.5l6 2.5v4.5c0 4-2.6 6.9-6 8-3.4-1.1-6-4-6-8V5l6-2.5z" /><path d="M7.5 10l1.8 1.8 3.2-3.6" /></>,
  cap: <><path d="M1.5 8L10 4l8.5 4L10 12 1.5 8z" /><path d="M5 9.7v4.3c1.4 1.4 3 2 5 2s3.6-.6 5-2V9.7M18.5 8v5" /></>,
  briefcase: <><rect x="2.5" y="6" width="15" height="11" rx="2" /><path d="M7 6V4.5A1.5 1.5 0 018.5 3h3A1.5 1.5 0 0113 4.5V6M2.5 11h15" /></>,
  key: <><circle cx="6.5" cy="13.5" r="3.5" /><path d="M9 11l7.5-7.5M14 6l2 2M12 8l1.5 1.5" /></>,
  sparkle: <><path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6L10 2.5zM15.5 13.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" /></>,
  inbox: <><path d="M2.5 11l2.2-6.2A1.5 1.5 0 016.1 4h7.8a1.5 1.5 0 011.4.8l2.2 6.2v4.5a1.5 1.5 0 01-1.5 1.5H4a1.5 1.5 0 01-1.5-1.5V11z" /><path d="M2.5 11h4l1 2h5l1-2h4" /></>,
};

export function AuthIcon({ name, size = 16 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
