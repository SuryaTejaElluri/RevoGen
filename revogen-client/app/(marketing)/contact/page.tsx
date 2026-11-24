import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import { PageHero } from "@/components/site/SiteShell";
import ContactForm, { CONTACT_EMAIL } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact · Revogen",
  description: "Questions about Revogen, a demo, or setting it up for your team or college.",
};

const FAQS = [
  { q: "How does pricing work?", a: "Recruiters use Revo Credits, bought in packs. Credits are spent when you run assessments, and every transaction is logged. There's no per-seat licence." },
  { q: "Can I get a walkthrough?", a: "Yes. Pick \"Demo\" as the topic and tell us a bit about how you hire, and we'll set up a call." },
  { q: "Can candidates take tests on a phone?", a: "MCQ rounds work on mobile. Coding tests need a desktop or laptop for the editor, and Pro tests need a working camera." },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Talk to us"
        sub="A question about the product, a demo for your team, or setting up placement rounds for your college. Send a message and we'll get back to you."
      />

      <section className="sec sec-top" style={{ paddingTop: 80 }}>
        <div className="wrap split">
          <Reveal>
            <div className="card" style={{ padding: 28 }}>
              <ContactForm />
            </div>
          </Reveal>
          <Reveal delay={2}>
            <div className="side-list">
              <div><b>Email</b><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></div>
              <div><b>Based in</b><span>Hyderabad, India</span></div>
              <div><b>Already a customer?</b><span><Link href="/login" style={{ color: "var(--text)", textDecoration: "underline", textUnderlineOffset: 3 }}>Log in</Link> to see your tests and credits.</span></div>
            </div>
            <div className="faq" style={{ display: "block", marginTop: 40 }}>
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
    </>
  );
}
