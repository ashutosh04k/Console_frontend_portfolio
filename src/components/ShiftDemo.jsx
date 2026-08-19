import { useState } from "react";
import "./ShiftDemo.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DRIVERS = [
  { name: "R. Sharma", role: "lead" },
  { name: "A. Khan", role: "driver" },
  { name: "P. Singh", role: "driver" },
  { name: "M. Das", role: "trainee" },
];
// shift states cycle on click: off → morning → evening → night → off
const SHIFTS = [
  { key: "off", label: "—", cls: "s-off" },
  { key: "morning", label: "AM", cls: "s-am" },
  { key: "evening", label: "PM", cls: "s-pm" },
  { key: "night", label: "NT", cls: "s-nt" },
];

function initGrid() {
  // seed a plausible-looking roster
  const g = {};
  DRIVERS.forEach((d, r) => {
    DAYS.forEach((_, c) => {
      const roll = (r + c) % 5;
      g[`${r}-${c}`] = roll === 0 ? 0 : roll; // some off, some assigned
    });
  });
  return g;
}

export default function ShiftDemo() {
  const [grid, setGrid] = useState(initGrid);

  const cycle = (r, c) =>
    setGrid((g) => ({ ...g, [`${r}-${c}`]: ((g[`${r}-${c}`] ?? 0) + 1) % SHIFTS.length }));

  // coverage: how many drivers assigned (non-off) per day
  const coverage = DAYS.map((_, c) =>
    DRIVERS.reduce((n, _d, r) => n + ((grid[`${r}-${c}`] ?? 0) !== 0 ? 1 : 0), 0)
  );

  return (
    <div className="shift">
      <div className="shift-hint mono">
        click any cell to cycle shift · <span className="s-am-t">AM</span>{" "}
        <span className="s-pm-t">PM</span> <span className="s-nt-t">NT</span>
      </div>

      <div className="shift-grid-wrap">
        <table className="shift-grid mono">
          <thead>
            <tr>
              <th className="sg-corner">driver</th>
              {DAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DRIVERS.map((d, r) => (
              <tr key={d.name}>
                <td className="sg-name">
                  {d.name}
                  <span className={`sg-role role-${d.role}`}>{d.role}</span>
                </td>
                {DAYS.map((_, c) => {
                  const s = SHIFTS[grid[`${r}-${c}`] ?? 0];
                  return (
                    <td
                      key={c}
                      className={`sg-cell ${s.cls}`}
                      onClick={() => cycle(r, c)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && cycle(r, c)}
                    >
                      {s.label}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="sg-coverage-row">
              <td className="sg-name">coverage</td>
              {coverage.map((n, i) => (
                <td key={i} className={`sg-cov ${n < 2 ? "low" : ""}`}>
                  {n}/{DRIVERS.length}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
