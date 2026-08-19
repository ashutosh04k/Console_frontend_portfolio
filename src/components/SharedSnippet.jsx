import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Playground from "./Playground.jsx";
import { api } from "../lib/api.js";

// Route: /p/:slug — reloads a creation someone saved from the playground.
export default function SharedSnippet() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "loading", data: null, error: "" });

  useEffect(() => {
    let alive = true;
    api
      .getSnippet(slug)
      .then((data) => alive && setState({ status: "ok", data, error: "" }))
      .catch((err) => alive && setState({ status: "error", data: null, error: err.message }));
    return () => { alive = false; };
  }, [slug]);

  return (
    <main className="wrap" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
      <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>
        snippet / {slug}
      </p>
      <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>
        Shared <span className="kw">creation</span>
      </h1>

      {state.status === "loading" && (
        <p className="mono" style={{ color: "var(--fg-dim)" }}>
          loading from the backend…
        </p>
      )}

      {state.status === "error" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="mono" style={{ color: "var(--rose)" }}>
            {state.error}
          </p>
          <Link className="btn" to="/" style={{ marginTop: "1rem" }}>
            ← back to portfolio
          </Link>
        </div>
      )}

      {state.status === "ok" && (
        <>
          <Playground initial={{ title: state.data.title, ...state.data }} />
          <p className="mono" style={{ color: "var(--fg-dim)", marginTop: "1rem" }}>
            // {state.data.views} views · fork it by editing above and sharing again
          </p>
          <Link className="btn" to="/" style={{ marginTop: "0.5rem" }}>
            ← back to portfolio
          </Link>
        </>
      )}
    </main>
  );
}
