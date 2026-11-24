import Link from 'next/link';
import './bento.css';

// Footer for candidate pages (dashboard, tests list, practice, results, resumes, thank-you).
// Not used on exam screens. Render inside a `.bx` root, after <main>.

const YOUR_AREA = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/assigned-tests', label: 'Assigned tests' },
  { href: '/practice', label: 'Practice' },
  { href: '/my-results', label: 'Results' },
  { href: '/resumes', label: 'Resumes' },
];

const HELP = [
  { href: '/contact', label: 'Contact us' },
  { href: '/about', label: 'About Revogen' },
  { href: '/resume-ai', label: 'How the ATS score works' },
];

export default function CandidateFooter() {
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          <Link href="/dashboard" className="brand">
            <img src="/revogen-icon.svg" alt="" width={22} height={22} />
            Revogen
          </Link>
          <p>Practise, check your resume, and take the tests recruiters send you, all in one place.</p>
        </div>
        <nav className="foot-col" aria-label="Your area">
          <h4>Your area</h4>
          <ul>{YOUR_AREA.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
        </nav>
        <nav className="foot-col" aria-label="Help">
          <h4>Help</h4>
          <ul>{HELP.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
        </nav>
      </div>
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} Revogen · Built in Hyderabad</span>
        <span>Having trouble with a test? Contact the recruiter who invited you.</span>
      </div>
    </footer>
  );
}
