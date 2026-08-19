import { useState } from "react";
import { api } from "../lib/api.js";
import { CONTACT } from "../lib/data.js";
import "./Contact.css";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", body: "", website: "" });
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: "sending", msg: "" });
    try {
      await api.sendMessage(form);
      setStatus({ state: "done", msg: "Message stored. I'll get back to you soon." });
      setForm({ name: "", email: "", body: "", website: "" });
    } catch (err) {
      setStatus({ state: "error", msg: err.message });
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="wrap contact-grid">
        <div className="contact-intro">
          <p className="eyebrow">contact.send()</p>
          <h2 className="section-title">
            Let's <span className="kw">build</span> something
          </h2>
          <p className="contact-copy">
            This form isn't a mailto link — it POSTs to an Express API and
            persists to MongoDB. Small demo of the stack, doing real work.
          </p>

          <ul className="contact-links mono">
            <li>
              <span className="cl-k">Email</span>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            <li>
              <span className="cl-k">Github</span>
              <a href={CONTACT.github} target="_blank" rel="noreferrer">/github</a>
            </li>
            <li>
              <span className="cl-k">Linkedin</span>
              <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">/in</a>
            </li>
            <li>
              <span className="cl-k">Based</span>
              <span>{CONTACT.location}</span>
            </li>
          </ul>
        </div>

        <form className="contact-form card" onSubmit={submit}>
          {/* honeypot — hidden from humans, catches bots */}
          <input
            type="text"
            name="website"
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={update("website")}
          />

          <label className="field">
            <span className="field-label mono">Name</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={update("name")}
              placeholder="Your name"
            />
          </label>

          <label className="field">
            <span className="field-label mono">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="you@company.com"
            />
          </label>

          <label className="field">
            <span className="field-label mono">Message</span>
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={update("body")}
              placeholder="What are you building?"
            />
          </label>

          <button
            className="btn btn-run contact-submit"
            type="submit"
            disabled={status.state === "Sending"}
          >
            {status.state === "Sending" ? "Sending…" : "⇪ Send Message"}
          </button>

          {status.state !== "idle" && status.state !== "Sending" && (
            <p className={`contact-status ${status.state}`}>
              {status.state === "done" && <span className="dot" />}
              {status.msg}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
