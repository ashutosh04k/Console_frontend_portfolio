import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

// the roles that "compile" one after another
const ROLES = [
  "real-time interfaces",
  "WebSocket systems",
  "accessible React",
  "MERN applications",
];

export default function Hero() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  // typewriter cycling through ROLES
  useEffect(() => {
    const full = ROLES[roleIdx];
    let t;
    if (!deleting && typed.length < full.length) {
      t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 55);
    } else if (!deleting && typed.length === full.length) {
      t = setTimeout(() => setDeleting(true), 1600);
    } else if (deleting && typed.length > 0) {
      t = setTimeout(() => setTyped(full.slice(0, typed.length - 1)), 28);
    } else {
      setDeleting(false);
      setRoleIdx((i) => (i + 1) % ROLES.length);
    }
    return () => clearTimeout(t);
  }, [typed, deleting, roleIdx]);

  return (
    <header className="hero">
      <div className="wrap hero-grid">
        <div className="hero-main">
          <div className="hero-status mono">
            <span className="dot" /> Available for Work · PAN India
          </div>

          {/* name rendered as a line of code — the thesis */}
          <h1 className="hero-name mono">
            <span className="hn-kw">const</span>{" "}
            <span className="hn-var">dev</span>{" "}
            <span className="hn-op">=</span>{" "}
            <span className="hn-str">Ashutosh&nbsp;Kumar</span>
          </h1>

          <p className="hero-line mono">
            <span className="hn-dim">dev.builds</span>
            <span className="hn-op">(</span>
            <span className="hn-run">{typed}</span>
            <span className="cursor" />
            <span className="hn-op">)</span>
          </p>

          <p className="hero-blurb">
            Software developer who ships the hard parts — live maps over
            WebSockets, real-time chat, payment flows, and import tools that
            chew through 100k rows. Comfortable across the stack, most at home
            making interfaces that feel instant.
          </p>

          <div className="hero-cta">
            <Link className="btn btn-run" to="/systems" style={{color:'#ffffff'}}>▶ Try my systems Live</Link>
            <Link className="btn" to="/experience">View Work</Link>
            <a className="btn" href="/Ashutosh_resume.pdf" target="_blank" rel="noreferrer">
              ↓ Résumé
            </a>
          </div>
        </div>

        {/* right: quick "spec sheet" pulled from the résumé */}
        <aside className="hero-spec card mono" aria-label="At a glance">
          <div className="spec-row">
            <span className="spec-k">Role</span>
            <span className="spec-v">Associate SW Developer</span>
          </div>
          <div className="spec-row">
            <span className="spec-k">Current</span>
            <span className="spec-v">Togopool Pvt Ltd.</span>
          </div>
          <div className="spec-row">
            <span className="spec-k">Core</span>
            <span className="spec-v">React · TS · Node</span>
          </div>
          <div className="spec-row">
            <span className="spec-k">Focus</span>
            <span className="spec-v hn-run">real-time UI</span>
          </div>
          <div className="spec-sep" />
          <div className="spec-stat">
            <b>45%</b>
            <span>faster loads via virtualization</span>
          </div>
          <div className="spec-stat">
            <b>27 → 73</b>
            <span>Lighthouse via SSR</span>
          </div>
          <div className="spec-stat">
            <b>10k+</b>
            <span>users served in prod</span>
          </div>
        </aside>
      </div>

      <Link className="hero-scroll mono" to="/playground" aria-label="Go to playground">
        scroll ↓
      </Link>
    </header>
  );
}
