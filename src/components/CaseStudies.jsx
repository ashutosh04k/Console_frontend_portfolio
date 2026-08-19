import { useState } from "react";
import { CASE_STUDIES } from "../lib/caseStudies.js";
import MapperDemo from "./MapperDemo.jsx";
import TrackingDemo from "./TrackingDemo.jsx";
import DashboardDemo from "./DashboardDemo.jsx";
import ShiftDemo from "./ShiftTiming.jsx";
import Roleandpermission from "./Rolesandpermissions.jsx";
import "./CaseStudies.css";
import ShotGallery from "./ShotGallery.jsx";
import ChatConsole from "./ChatConsole.jsx";

const DEMOS = {
  mapper: MapperDemo,
  tracking: TrackingDemo,
  dashboard: DashboardDemo,
  shift: ShiftDemo,
  roles: Roleandpermission,
  chat:ChatConsole
};

export default function CaseStudies() {
  const [active, setActive] = useState("mapper");
  const study = CASE_STUDIES.find((c) => c.id === active);
  const Demo = DEMOS[active];

  return (
    <section id="systems" className="cs">
      <div className="wrap">
        <p className="eyebrow">systems.build()</p>
        <h2 className="section-title">
          Systems I've <span className="kw">built</span> — try them live 
        </h2>
        <p className="cs-lead">
          These aren't screenshots. Each demo below runs the real logic from
          production features I shipped — rebuilt with synthetic data so you can
          use them right here.
        </p>

        {/* tab switcher */}
        <div className="cs-tabs" role="tablist">
          {CASE_STUDIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={active === c.id}
              className={`cs-tab mono ${active === c.id ? "on" : ""}`}
              onClick={() => setActive(c.id)}
            >
              {c.tab}
            </button>
          ))}
        </div>

        {/* active case study */}
        <div className="cs-body">
          {/* left: logic panel */}
          <aside className="cs-logic">
            <div className="cs-logic-head">
              <h3 className="cs-title mono">{study.title}</h3>
              <span className="cs-context mono">{study.context}</span>
            </div>

            <div className="cs-tags">
              {study.tags.map((t) => (
                <span className="chip mono" key={t}>{t}</span>
              ))}
            </div>

            <div className="cs-block">
              <span className="cs-k mono"> The problem</span>
              <p>{study.problem}</p>
            </div>

            <div className="cs-block">
              <span className="cs-k mono"> How it works</span>
              <ul className="cs-steps">
                {study.approach.map((a, i) => (
                  <li key={i}>
                    <span className="cs-step-n mono">{i + 1}</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cs-metrics">
              {study.metrics.map((m) => (
                <div className="cs-metric mono" key={m.k}>
                  <b>{m.v}</b>
                  <span>{m.k}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* right: live demo (+ optional screenshot) */}
          <div className="cs-demo-col">
            <div className="cs-demo card">
              <div className="cs-demo-bar mono">
                <span className="dot" /> live demo · real logic
              </div>
              <div className="cs-demo-inner">
                <Demo />
              </div>
            </div>
            <p className="cs-demo-note mono">{study.demoNote}</p>

            {/* screenshot slot — fill by setting `shot` in caseStudies.js */}
            {/* {study.shot && (
              <div className="cs-shots">
                {(Array.isArray(study.shot) ? study.shot : [study.shot])
                  .map((s) => (typeof s === "string" ? { src: s } : s))
                  .filter((s) => s && s.src)
                  .map((s, i) => (
                    <figure className="cs-shot" key={i}>
                      <img src={s.src} alt={s.caption || `${study.title} — from production`} loading="lazy" />
                      <figcaption className="mono">{s.caption || "from the real product"}</figcaption>
                    </figure>
                  ))}
              </div>
            )} */}
            <ShotGallery title={study.title} shots={study.shot} />
          </div>
        </div>
      </div>
    </section>
  );
}
