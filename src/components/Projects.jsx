import { PROJECTS } from "../lib/data.js";
import { useState } from "react";
import "./Projects.css";

const VISIBLE_CHIPS = 6;

function ProjectCard({ project, index }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = project.stack.length > VISIBLE_CHIPS;
  const shown = expanded ? project.stack : project.stack.slice(0, VISIBLE_CHIPS);
  const hiddenCount = project.stack.length - VISIBLE_CHIPS;

  return (
    <article className="proj-item reveal">
      <div className="proj-meta">
        <span className="proj-idx mono">{String(index + 1).padStart(2, "0")}</span>
        <span className="proj-metric mono">{project.metric}</span>
        {hasMore && (
          <span className="proj-count mono">{project.stack.length} tech</span>
        )}
      </div>

      <div className="proj-card card">
        <header className="proj-head">
          <h3 className="proj-name">{project.name}</h3>
          <div className="proj-links mono">
            {project.live && (
              <a href={project.live} target="_blank" rel="noreferrer">↗ live</a>
            )}
            {project.github && (
              <a href={project.github} target="_blank" rel="noreferrer">↗ source</a>
            )}
          </div>
        </header>

        <p className="proj-blurb">{project.blurb}</p>

        <div className="proj-stack">
          {shown.map((s) => (
            <span className="chip mono" key={s}>{s}</span>
          ))}
        </div>

        {hasMore && (
          <button
            className="proj-toggle mono"
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

export default function Projects() {
  return (
    <section id="projects" className="proj">
      <div className="wrap">
        <p className="eyebrow">projects.build()</p>
        <h2 className="section-title">
          Things I've <span className="kw">built</span>
        </h2>

        <div className="proj-list">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.name} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}