import { useEffect, useMemo, useRef, useState } from "react";
import { buildSrcDoc } from "../lib/sandbox.js";
import { api } from "../lib/api.js";
import "./Playground.css";

const STARTER = {
  title: "Pulse",
  html: `<div class="ring">
  <span>live</span>
</div>`,
  css: `body { display:grid; place-items:center; height:100vh;
  background:#0b0e14; }
.ring {
  --g:#4af626;
  width:120px; height:120px; border-radius:50%;
  display:grid; place-items:center;
  color:var(--g); font:600 14px/1 ui-monospace, monospace;
  letter-spacing:.2em; text-transform:uppercase;
  box-shadow:0 0 0 0 var(--g);
  animation:pulse 1.6s infinite;
}
@keyframes pulse {
  70% { box-shadow:0 0 0 26px transparent; }
}`,
  js: `console.log("Preview is live. Edit the code →");`,
};

const TABS = [
  { key: "html", label: "index.html", color: "var(--rose)" },
  { key: "css", label: "styles.css", color: "var(--violet)" },
  { key: "js", label: "script.js", color: "var(--amber)" },
];

export default function Playground({ initial }) {
  const [code, setCode] = useState(initial || STARTER);
  const [active, setActive] = useState("html");
  const [srcDoc, setSrcDoc] = useState("");
  const [logs, setLogs] = useState([]);
  const [autoRun, setAutoRun] = useState(true);
  const [share, setShare] = useState({ state: "idle", url: "" });
  const debounce = useRef();

  // run = rebuild the iframe srcDoc from current code
  const run = () => {
    setLogs([]);
    setSrcDoc(buildSrcDoc(code));
  };

  // first paint
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-run with debounce as the user types
  useEffect(() => {
    if (!autoRun) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(run, 600);
    return () => clearTimeout(debounce.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, autoRun]);

  // receive console messages from the sandbox
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data && e.data.__playground) {
        setLogs((l) => [...l.slice(-40), { level: e.data.level, text: e.data.text }]);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const lineCount = useMemo(
    () => (code[active] || "").split("\n").length,
    [code, active]
  );

  const onShare = async () => {
    try {
      setShare({ state: "saving", url: "" });
      const { slug } = await api.saveSnippet(code);
      const url = `${window.location.origin}/p/${slug}`;
      setShare({ state: "done", url });
      navigator.clipboard?.writeText(url).catch(() => {});
    } catch (err) {
      setShare({ state: "error", url: err.message });
    }
  };

  return (
    <div className="pg card">
      {/* window chrome */}
      <div className="pg-bar">
        <div className="pg-dots" aria-hidden>
          <i style={{ background: "#ff5f57" }} />
          <i style={{ background: "#febc2e" }} />
          <i style={{ background: "#28c840" }} />
        </div>
        <span className="pg-name mono">playground / {code.title || "untitled"}</span>
        <div className="pg-actions">
          <label className="pg-auto mono">
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
            />
            auto-run
          </label>
          <button className="btn" onClick={run}>▶ run</button>
          <button className="btn btn-run" onClick={onShare}>
            {share.state === "saving" ? "saving…" : "⇪ share"}
          </button>
        </div>
      </div>

      <div className="pg-body">
        {/* editor side */}
        <div className="pg-editor">
          <div className="pg-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={active === t.key}
                className={`pg-tab ${active === t.key ? "on" : ""}`}
                onClick={() => setActive(t.key)}
              >
                <span className="tab-dot" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="pg-code">
            {/* line-number gutter */}
            <div className="pg-gutter" aria-hidden>
              {Array.from({ length: lineCount }, (_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              className="pg-textarea mono"
              spellCheck={false}
              value={code[active]}
              onChange={(e) => setCode({ ...code, [active]: e.target.value })}
              onKeyDown={(e) => {
                // real tab insertion, not focus change
                if (e.key === "Tab") {
                  e.preventDefault();
                  const el = e.target;
                  const s = el.selectionStart;
                  const v = code[active];
                  const next = v.slice(0, s) + "  " + v.slice(el.selectionEnd);
                  setCode({ ...code, [active]: next });
                  requestAnimationFrame(() => (el.selectionStart = el.selectionEnd = s + 2));
                }
              }}
              aria-label={`${active} editor`}
            />
          </div>
        </div>

        {/* preview side */}
        <div className="pg-preview">
          <div className="pg-preview-bar mono">
            <span className="dot" /> live preview
          </div>
          <iframe
            title="preview"
            className="pg-frame"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
          />
          <div className="pg-console mono">
            <div className="pg-console-head">
              console
              {logs.length > 0 && (
                <button className="pg-clear" onClick={() => setLogs([])}>clear</button>
              )}
            </div>
            <div className="pg-console-body">
              {logs.length === 0 ? (
                <span className="pg-console-empty">// console output appears here</span>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className={`pg-line lv-${l.level}`}>
                    {l.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* share result strip */}
      {share.state !== "idle" && (
        <div className={`pg-share lv-${share.state === "error" ? "error" : "ok"}`}>
          {share.state === "done" && (
            <>
              <span className="dot" /> saved to the backend & copied:&nbsp;
              <a href={share.url} target="_blank" rel="noreferrer">{share.url}</a>
            </>
          )}
          {share.state === "saving" && <>saving snippet to MongoDB…</>}
          {share.state === "error" && <>couldn’t save: {share.url}</>}
        </div>
      )}
    </div>
  );
}
