import { EXPERIENCE } from "../lib/data.js";
import { useState } from "react";
import "./Experience.css";
const VISIBLE_POINTS = 6;
function ExperienceCard({ job, index }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = job.points.length > VISIBLE_POINTS;
  const shown = expanded ? job.points : job.points.slice(0, VISIBLE_POINTS);
  const hiddenCount = job.points.length - VISIBLE_POINTS;

  return (
    <article className="exp-item reveal">
      <div className="exp-meta">
        <span className="exp-idx mono">{String(index + 1).padStart(2, "0")}</span>
        <span className="exp-period mono">{job.period}</span>
        {hasMore && (
          <span className="exp-count mono">{job.points.length} highlights</span>
        )}
      </div>

      <div className="exp-card card">
        <header className="exp-head">
          <h3 className="exp-role">
            {job.role} <span className="exp-at mono">@ {job.company}</span>
          </h3>
          <div className="exp-tags">
            {job.tags.map((t) => (
              <span className="tag mono" key={t}>{t}</span>
            ))}
          </div>
        </header>

        <ul className="exp-points">
          {shown.map((p, idx) => (
            <li key={idx}>
              <span className="bullet mono" aria-hidden>›</span>
              {p}
            </li>
          ))}
        </ul>

        {hasMore && (
          <button
            className="exp-toggle mono"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "− show less" : `+ ${hiddenCount} more`}
          </button>
        )}
      </div>
    </article>
  );
}

export default function Experience() {
  return (
    <section id="work" className="exp">
      <div className="wrap">
        <p className="eyebrow">experience.log</p>
        <h2 className="section-title">
          Where I've <span className="kw">shipped</span>
        </h2>

        <div className="exp-list">
          {EXPERIENCE.map((job, i) => (
             <ExperienceCard key={job.company} job={job} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
