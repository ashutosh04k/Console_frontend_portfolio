import { SKILLS } from "../lib/data.js";
import "./Skills.css";

export default function Skills() {
  const groups = Object.entries(SKILLS);

  return (
    <section id="skills" className="skills">
      <div className="wrap">
        <p className="eyebrow">skills.json</p>
        <h2 className="section-title">
          The <span className="kw">toolkit</span>
        </h2>

        {/* rendered as a pretty-printed object — ties into the editor theme */}
        <div className="skills-obj card mono reveal">
          <span className="sk-brace">{"{"}</span>
          {groups.map(([group, items], gi) => (
            <div className="sk-group" key={group}>
              <span className="sk-key">"{group}"</span>
              <span className="sk-colon">: [</span>
              <div className="sk-items">
                {items.map((item, ii) => (
                  <span className="sk-item" key={item}>
                    "<span className="sk-val">{item}</span>"
                    {ii < items.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
              <span className="sk-bracket">]{gi < groups.length - 1 ? "," : ""}</span>
            </div>
          ))}
          <span className="sk-brace">{"}"}</span>
        </div>
      </div>
    </section>
  );
}
