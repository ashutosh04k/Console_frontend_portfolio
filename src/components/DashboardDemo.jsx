import { useEffect, useRef, useState } from "react";
import "./DashboardDemo.css";

const START = { orders: 1284, revenue: 48210, active: 342, latency: 84 };

export default function DashboardDemo() {
  const [kpi, setKpi] = useState(START);
  const [series, setSeries] = useState(() =>
    Array.from({ length: 24 }, () => 30 + Math.random() * 60)
  );
  const [live, setLive] = useState(true);
  const dir = useRef({});

  useEffect(() => {
    if (!live) return;
    const iv = setInterval(() => {
      setKpi((k) => ({
        orders: k.orders + Math.floor(Math.random() * 4),
        revenue: k.revenue + Math.floor(Math.random() * 220),
        active: Math.max(280, k.active + Math.floor((Math.random() - 0.5) * 30)),
        latency: Math.max(40, Math.min(160, k.latency + Math.floor((Math.random() - 0.5) * 18))),
      }));
      setSeries((s) => {
        const next = Math.max(15, Math.min(95, s[s.length - 1] + (Math.random() - 0.5) * 22));
        return [...s.slice(1), next];
      });
    }, 1200);
    return () => clearInterval(iv);
  }, [live]);

  // build the SVG path for the area chart
  const W = 100, H = 40;
  const pts = series.map((v, i) => [(i / (series.length - 1)) * W, H - (v / 100) * H]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  const cards = [
    { k: "orders today", v: kpi.orders.toLocaleString(), accent: "run" },
    { k: "revenue", v: `$${kpi.revenue.toLocaleString()}`, accent: "amber" },
    { k: "active users", v: kpi.active.toLocaleString(), accent: "violet" },
    { k: "p95 latency", v: `${kpi.latency}ms`, accent: kpi.latency > 120 ? "rose" : "run" },
  ];

  return (
    <div className="dash">
      <div className="dash-top mono">
        <span className="dash-title">
          <span className={`dot ${live ? "" : "off"}`} /> ops overview
        </span>
        <button className="dash-toggle" onClick={() => setLive((l) => !l)}>
          {live ? "pause stream" : "resume stream"}
        </button>
      </div>

      <div className="dash-kpis">
        {cards.map((c) => (
          <div className={`dash-card acc-${c.accent}`} key={c.k}>
            <span className="dc-k mono">{c.k}</span>
            <b className="dc-v mono">{c.v}</b>
          </div>
        ))}
      </div>

      <div className="dash-chart-wrap">
        <div className="dc-chart-head mono">throughput · req/s (last 24 intervals)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="dash-chart" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dashgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--run)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--run)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#dashgrad)" />
          <path d={line} fill="none" stroke="var(--run)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}
