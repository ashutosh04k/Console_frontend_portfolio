import { useState, useRef, useCallback, useMemo } from "react";
import {
  SCHEMA,
  SOURCE_HEADERS,
  autoMap,
  makeRow,
  validateRow,
  missingMappings,
  parseCSV,
  makeSampleCSV,
} from "../lib/mapperEngine.js";
import "./MapperDemo.css";

const ROW_OPTIONS = [10000, 50000, 100000, 200000];
const CHUNK = 4000; // rows per animation frame
const SCHEMA_OPTIONS = SCHEMA.map((f) => ({ key: f.key, label: f.label, type: f.type }));
const MAX_UPLOAD_ROWS = 200000; // guardrail for pasted/huge files

// trigger a browser download of text content
function downloadText(filename, text, mime = "text/csv") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function MapperDemo() {
  const [rowCount, setRowCount] = useState(50000);
  const [mapping, setMapping] = useState({}); // sourceHeader -> schemaKey
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ valid: 0, invalid: 0, rate: 0 });
  const [samples, setSamples] = useState([]);
  // uploaded file: null = synthetic mode; otherwise { name, headers, rows }
  const [upload, setUpload] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const cancelRef = useRef(false);
  const fileRef = useRef(null);

  // headers driving the mapping grid: uploaded file's headers, or the built-in messy set
  const headers = upload ? upload.headers : SOURCE_HEADERS;
  // effective row count: uploaded row count, or the chosen synthetic volume
  const effectiveRows = upload ? upload.rows.length : rowCount;

  const missing = missingMappings(mapping);
  const canRun = missing.length === 0 && phase !== "running" && headers.length > 0;

  const setField = (header, schemaKey) =>
    setMapping((m) => ({ ...m, [header]: schemaKey || undefined }));

  const doAutoMap = () => setMapping(autoMap(headers));
  const clearMap = () => {
    setMapping({});
    setPhase("idle");
    setProgress(0);
    setSamples([]);
  };

  // ---- download a sample CSV -------------------------------------------
  const downloadSample = () => {
    downloadText("sample-orders.csv", makeSampleCSV(50));
  };

  // ---- upload + parse a CSV --------------------------------------------
  const onPickFile = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setUploadError("");
    try {
      const text = await file.text();
      const { headers: h, rows } = parseCSV(text);
      if (h.length === 0 || rows.length === 0) {
        setUploadError("Couldn't find any rows in that file.");
        return;
      }
      const trimmed = rows.slice(0, MAX_UPLOAD_ROWS);
      setUpload({ name: file.name, headers: h, rows: trimmed });
      // auto-map the uploaded headers immediately — instant gratification
      setMapping(autoMap(h));
      setPhase("idle");
      setProgress(0);
      setSamples([]);
    } catch (err) {
      setUploadError("Failed to read the file. Is it a valid CSV?");
    }
  };

  const clearUpload = () => {
    setUpload(null);
    setUploadError("");
    setMapping({});
    setPhase("idle");
    setProgress(0);
    setSamples([]);
  };

  // ---- run validation (uploaded rows if present, else synthetic) -------
  const run = useCallback(() => {
    if (missingMappings(mapping).length > 0) return;
    cancelRef.current = false;
    setPhase("running");
    setProgress(0);
    setSamples([]);
    setStats({ valid: 0, invalid: 0, rate: 0 });

    const total = upload ? upload.rows.length : rowCount;
    let i = 0, valid = 0, invalid = 0;
    const found = [];
    const started = performance.now();

    const step = () => {
      if (cancelRef.current) { setPhase("idle"); return; }
      const end = Math.min(i + CHUNK, total);
      for (; i < end; i++) {
        const row = upload ? upload.rows[i] : makeRow(i, 0.05);
        const err = validateRow(row, mapping);
        if (err) {
          invalid++;
          if (found.length < 7) found.push({ row: i + 1, ...err });
        } else valid++;
      }
      const elapsed = (performance.now() - started) / 1000;
      setProgress(i / total);
      setStats({ valid, invalid, rate: Math.round(i / elapsed) });
      if (i < total) requestAnimationFrame(step);
      else { setSamples(found); setPhase("done"); }
    };
    requestAnimationFrame(step);
  }, [mapping, rowCount, upload]);

  const cancel = () => { cancelRef.current = true; };

  const pct = Math.round(progress * 100);
  const processed = Math.round(progress * effectiveRows);
  const mappedCount = useMemo(() => headers.filter((h) => mapping[h]).length, [headers, mapping]);

  return (
    <div className="mapper">
      {/* Step 0: data source — sample + upload */}
      <div className="mapper-source">
        <div className="ms-buttons">
          <button className="btn" onClick={downloadSample} disabled={phase === "running"} style={{marginRight:'10px'}}>
            ↓ sample CSV
          </button>
          <button className="btn" onClick={onPickFile} disabled={phase === "running"}>
            ↑ upload CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            style={{ display: "none" }}
          />
        </div>
        <div className="ms-status mono">
          {upload ? (
            <>
              <span className="dot" /> {upload.name} · {upload.rows.length.toLocaleString()} rows
              <button className="ms-clear" onClick={clearUpload}>use synthetic instead</button>
            </>
          ) : (
            <span className="ms-synthetic">source: synthetic generator · download the sample to see the format, then upload it back</span>
          )}
        </div>
      </div>
      {uploadError && <p className="mapper-warn mono">⚠ {uploadError}</p>}

      {/* Step 1: volume (synthetic only) + actions */}
      <div className="mapper-controls">
        <div className="mc-group">
          <span className="mc-label mono">
            {upload ? "rows in file" : "rows to import"}
          </span>
          {upload ? (
            <div className="mc-filecount mono">{upload.rows.length.toLocaleString()}</div>
          ) : (
            <div className="mc-chips">
              {ROW_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={`mc-chip mono ${rowCount === n ? "on" : ""}`}
                  onClick={() => { setRowCount(n); setPhase("idle"); setProgress(0); }}
                  disabled={phase === "running"}
                >
                  {n / 1000}k
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mc-actions">
          <button className="btn" onClick={doAutoMap} disabled={phase === "running"}>
            ⚡ auto-map
          </button>
          <button className="btn" onClick={clearMap} disabled={phase === "running"}>
            clear
          </button>
        </div>
      </div>

      <p className="mapper-hint mono">
        headers are matched by a normalize() pass (case, spaces, punctuation
        stripped) — {mappedCount}/{headers.length} mapped
      </p>

      {/* Step 2: mapping grid */}
      <div className="mapper-grid">
        <div className="mg-head mono">
          <span>source column {upload ? "(from your file)" : "(messy header)"}</span>
          <span className="mg-arrow">→</span>
          <span>schema field</span>
        </div>
        {headers.map((header, idx) => {
          const mapped = mapping[header];
          return (
            <div className={`mg-row ${mapped ? "mapped" : ""}`} key={`${header}-${idx}`}>
              <span className="mg-source mono">{header || <em className="mg-blank">(empty header)</em>}</span>
              <span className="mg-arrow mono">→</span>
              <select
                className="mg-select mono"
                value={mapped || ""}
                onChange={(e) => setField(header, e.target.value)}
                disabled={phase === "running"}
              >
                <option value="">— unmapped —</option>
                {SCHEMA_OPTIONS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label} ({f.type})
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* mapping status */}
      {missing.length > 0 ? (
        <p className="mapper-warn mono">
          ⚠ {missing.length} hard-required field{missing.length > 1 ? "s" : ""} unmapped:{" "}
          {missing.join(", ")} — {upload ? "map them above or hit" : "hit"} <b>auto-map</b>
        </p>
      ) : (
        <p className="mapper-ok mono">
          <span className="dot" /> required fields mapped — validation is category-aware
          (pickup vs drop fields)
        </p>
      )}

      {/* Step 3: run + live progress */}
      <div className="mapper-run">
        {phase !== "running" ? (
          <button className="btn btn-run mapper-go" onClick={run} disabled={!canRun}>
            ▶ validate {upload ? `${upload.rows.length.toLocaleString()} rows` : `${rowCount / 1000}k rows`}
          </button>
        ) : (
          <button className="btn mapper-go" onClick={cancel}>■ cancel</button>
        )}
      </div>

      {(phase === "running" || phase === "done") && (
        <div className="mapper-out">
          <div className="mo-bar-wrap">
            <div className="mo-bar" style={{ width: `${pct}%` }} />
            <span className="mo-bar-label mono">
              {phase === "done" ? "complete" : `${pct}%`}
            </span>
          </div>

          <div className="mo-stats mono">
            <div className="mo-stat">
              <span className="mo-k">processed</span>
              <b>{processed.toLocaleString()}</b>
            </div>
            <div className="mo-stat ok">
              <span className="mo-k">valid</span>
              <b>{stats.valid.toLocaleString()}</b>
            </div>
            <div className="mo-stat bad">
              <span className="mo-k">rejected</span>
              <b>{stats.invalid.toLocaleString()}</b>
            </div>
            <div className="mo-stat rate">
              <span className="mo-k">throughput</span>
              <b>{stats.rate.toLocaleString()}/s</b>
            </div>
          </div>

          {samples.length > 0 && (
            <div className="mo-rejects">
              <div className="mo-rejects-head mono">
                sample rejected rows — {upload ? "from your file" : "note the category-dependent failures"}
              </div>
              <div className="mo-rejects-body">
                {samples.map((s, idx) => (
                  <div className="reject-row mono" key={idx}>
                    <span className="rr-line">row {s.row}</span>
                    <span className="rr-field">{s.field}</span>
                    <span className="rr-reason">{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
