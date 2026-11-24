"use client";

import { useState } from "react";

// There is no contact endpoint on the server yet, so the form opens the
// visitor's email app with the message filled in instead of pretending to send.
export const CONTACT_EMAIL = "surya09e@gmail.com";

const TOPICS = ["General question", "Demo", "Pricing and credits", "College or placement cell", "Something isn't working"];

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", topic: TOPICS[0], message: "" });
  const [opened, setOpened] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(s => ({ ...s, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `[${form.topic}] ${form.name}${form.company ? ` · ${form.company}` : ""}`;
    const body = `${form.message}\n\n${form.name}\n${form.email}${form.company ? `\n${form.company}` : ""}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="two">
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" required value={form.name} onChange={set("name")} placeholder="Your name" autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="c-email">Work email</label>
          <input id="c-email" type="email" required value={form.email} onChange={set("email")} placeholder="name@company.com" autoComplete="email" />
        </div>
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="c-company">Company or college <i>(optional)</i></label>
          <input id="c-company" value={form.company} onChange={set("company")} placeholder="Where you work or study" autoComplete="organization" />
        </div>
        <div className="field">
          <label htmlFor="c-topic">Topic</label>
          <select id="c-topic" value={form.topic} onChange={set("topic")}>
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-msg">Message</label>
        <textarea id="c-msg" required value={form.message} onChange={set("message")} placeholder="How many people you hire for, which roles, or what you'd like to see" />
      </div>
      {opened ? (
        <div className="done">
          <b>Your email app should have opened</b>
          Send the drafted message from there. If nothing opened, email us directly at {CONTACT_EMAIL}.
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <p className="form-note">Opens your email app with this message filled in.</p>
          <button type="submit" className="btn btn-solid btn-lg">Write email</button>
        </div>
      )}
    </form>
  );
}
