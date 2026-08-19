import Playground from "./Playground.jsx";
import "./PlaygroundSection.css";

export default function PlaygroundSection() {
  return (
    <section id="playground" className="pg-section">
      <div className="wrap">
        <div className="pg-intro">
          <div>
            <p className="eyebrow">live.demo</p>
            <h2 className="section-title">
              Don't take my word — <span className="kw">run</span> some code
            </h2>
          </div>
          <p className="pg-intro-copy">
            A working code editor with a sandboxed preview and captured console.
            Type HTML, CSS, or JS and it renders instantly. Hit{" "}
            <span className="mono hn-run">share</span> and it saves to the
            MongoDB backend, returning a link to your creation — the frontend
            and API doing real work together.
          </p>
        </div>

        <Playground />
      </div>
    </section>
  );
}
