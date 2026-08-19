import { useState, useMemo, useRef, useEffect } from "react";

/**
 * ShiftTiming (dummy) — a self-contained clean-room replica of a fleet
 * driver-shift scheduler. It keeps the *interesting* client-side logic from
 * the production component and runs it on synthetic data, with NO backend:
 *
 *   • utc_offset timezone handling — shifts are stored as UTC minutes and
 *     converted to local for display / back to UTC on save (switch city to see it)
 *   • overlap detection — end-after-start + conflict vs the driver's other shifts
 *   • overnight shifts — end "before" start (22:00→06:00) crosses midnight
 *   • copy / paste a day's shifts onto another date, with an overwrite confirm
 *   • active/inactive toggle per date, add/edit/delete, city+driver+search filters
 *
 * Removed (backend-bound, not relevant to a demo): the two API base URLs and
 * makeGet/PostRequestToUrl, token-expiry redirect to /signup, ride details,
 * and the bulk paste endpoint — all replaced by in-memory state.
 *
 * Drop-in: no external CSS or libraries beyond React. Styles are inline.
 */

/* ============================ pure logic ============================ */

// Cities carry a utc_offset in MINUTES (like the stored utc_offset).
export const CITIES = [
  { id: "del", name: "Delhi",     utc_offset: 330 },  // +5:30
  { id: "dxb", name: "Dubai",     utc_offset: 240 },  // +4:00
  { id: "lon", name: "London",    utc_offset: 60 },   // +1:00 (BST)
  { id: "nyc", name: "New York",  utc_offset: -240 }, // -4:00 (EDT)
];

// "HH:mm" -> minutes since local midnight
export const hmToMin = (hm) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
// minutes since midnight -> "HH:mm" (wraps a full day)
export const minToHm = (min) => {
  const x = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};

// Convert a LOCAL "HH:mm" (for a city) into a UTC minutes-of-day value.
// utcMin = localMin - offset  (mirrors converting local input back to UTC).
export const localToUtcMin = (hm, offset) => ((hmToMin(hm) - offset) % 1440 + 1440) % 1440;
// Convert stored UTC minutes back to a LOCAL "HH:mm" for display.
export const utcMinToLocal = (utcMin, offset) => minToHm(utcMin + offset);

// Duration in minutes, honoring overnight (end earlier than start => +1 day).
export const shiftDuration = (startMin, endMin) =>
  endMin > startMin ? endMin - startMin : endMin + 1440 - startMin;

// Is this an overnight shift (crosses midnight)?
export const isOvernight = (startMin, endMin) => endMin <= startMin;

/**
 * Validate a candidate shift (local HH:mm) against a driver's existing shifts.
 * `existing` = array of { startLocal, endLocal } already on that day for the driver.
 * Returns { ok } or { ok:false, error }.
 * Overlap uses [start, start+duration) ranges on a 0..2879 minute line so
 * overnight shifts compare correctly against next-morning shifts.
 */
export function validateShift(startLocal, endLocal, existing, ignoreIndex = -1) {
  if (!startLocal || !endLocal) return { ok: false, error: "Start and end are required." };
  const s = hmToMin(startLocal);
  const e = hmToMin(endLocal);
  if (s === e) return { ok: false, error: "End time can't equal start time." };

  const dur = shiftDuration(s, e);
  if (dur < 15) return { ok: false, error: "Shift must be at least 15 minutes." };
  if (dur > 16 * 60) return { ok: false, error: "Shift can't exceed 16 hours." };

  // candidate range on an expanded 2-day line
  const cs = s;
  const ce = s + dur; // may exceed 1440 for overnight
  for (let i = 0; i < existing.length; i++) {
    if (i === ignoreIndex) continue;
    const es = hmToMin(existing[i].startLocal);
    const ee = es + shiftDuration(es, hmToMin(existing[i].endLocal));
    // compare candidate against existing at both same-day and +1day shifts
    for (const shift of [0, 1440, -1440]) {
      const a1 = cs + shift, a2 = ce + shift;
      if (a1 < ee && es < a2) {
        return { ok: false, error: `Overlaps an existing shift (${existing[i].startLocal}–${existing[i].endLocal}).` };
      }
    }
  }
  return { ok: true };
}

/* ============================ synthetic seed ============================ */

const DRIVERS = [
  { id: "D-1042", name: "Rohit Sharma", phone: "+91 98•• ••3210", city: "del" },
  { id: "D-1088", name: "Aisha Khan",   phone: "+91 99•• ••7745", city: "del" },
  { id: "D-2031", name: "Omar Farooq",  phone: "+971 5•• ••1198", city: "dxb" },
  { id: "D-3067", name: "Jack Turner",  phone: "+44 77•• ••4423", city: "lon" },
  { id: "D-4090", name: "Maria Lopez",  phone: "+1 21•• ••8890",  city: "nyc" },
];

const VEHICLES = ["KA-01-9921", "DL-04-1180", "DXB-A-3345", "LDN-77-2Q", "NY-16-889"];
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (iso, d) => {
  const dt = new Date(iso + "T00:00:00");
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

// Shifts are stored in UTC minutes (utcStart/utcEnd), like the real API payload.
// Keyed by `${driverId}|${dateISO}` -> array of shifts.
function seedShifts() {
  const t = todayISO();
  const mk = (sLocal, eLocal, offset, veh) => ({
    id: "S-" + Math.random().toString(36).slice(2, 7),
    utcStart: localToUtcMin(sLocal, offset),
    utcEnd: localToUtcMin(eLocal, offset),
    vehicle: veh,
  });
  return {
    [`D-1042|${t}`]: [mk("08:00", "16:00", 330, "DL-04-1180"), mk("18:00", "22:30", 330, "DL-04-1180")],
    [`D-1088|${t}`]: [mk("22:00", "06:00", 330, "KA-01-9921")], // overnight
    [`D-2031|${t}`]: [mk("09:30", "17:30", 240, "DXB-A-3345")],
    [`D-3067|${t}`]: [mk("07:00", "15:00", 60, "LDN-77-2Q")],
    [`D-4090|${addDaysISO(t, 0)}`]: [mk("10:00", "18:00", -240, "NY-16-889")],
  };
}

/* ============================ component ============================ */

// tiny inline style helpers (dark palette, self-contained)
const C = {
  bg: "#10141d", panel: "#171c28", line: "#232a3b", ink: "#0b0e14",
  fg: "#e4e7ef", dim: "#8b93a7", run: "#4af626", amber: "#ffb454",
  violet: "#a78bfa", rose: "#f472b6",
  mono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
};

export default function ShiftDemo() {
  const [shifts, setShifts] = useState(seedShifts);
  const [cityId, setCityId] = useState("del");
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [driverFilter, setDriverFilter] = useState("all");
  const [activeDates, setActiveDates] = useState(() => ({ [todayISO()]: true }));

  const [modal, setModal] = useState(null); // {driverId, shiftIndex|null}
  const [clipboard, setClipboard] = useState(null); // {fromDate, items:[...]}
  const [pasteTarget, setPasteTarget] = useState(""); // date string being pasted to
  const [overwriteAsk, setOverwriteAsk] = useState(null); // {toDate}
  const [menuFor, setMenuFor] = useState(null); // "driverId|idx" of open action menu

  const city = CITIES.find((c) => c.id === cityId);
  const offset = city.utc_offset;
  const dateActive = !!activeDates[date];

  // drivers shown = in selected city, matching driver filter + search
  const shownDrivers = useMemo(() => {
    return DRIVERS.filter((d) => d.city === cityId)
      .filter((d) => driverFilter === "all" || d.id === driverFilter)
      .filter((d) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
      });
  }, [cityId, driverFilter, search]);

  // resolve a driver's shifts for the current date, converted to local HH:mm
  const localShiftsFor = (driverId) => {
    const key = `${driverId}|${date}`;
    return (shifts[key] || []).map((s) => ({
      ...s,
      startLocal: utcMinToLocal(s.utcStart, offset),
      endLocal: utcMinToLocal(s.utcEnd, offset),
    }));
  };

  // widest driver drives the number of shift columns (like the real table)
  const maxShifts = Math.max(1, ...shownDrivers.map((d) => (shifts[`${d.id}|${date}`] || []).length));

  /* -------- add / edit / delete -------- */
  const openAdd = (driverId) => setModal({ driverId, shiftIndex: null, start: "", end: "", vehicle: VEHICLES[0], error: "" });
  const openEdit = (driverId, idx) => {
    const s = localShiftsFor(driverId)[idx];
    setModal({ driverId, shiftIndex: idx, start: s.startLocal, end: s.endLocal, vehicle: s.vehicle, error: "" });
    setMenuFor(null);
  };
  const deleteShift = (driverId, idx) => {
    const key = `${driverId}|${date}`;
    setShifts((prev) => {
      const next = { ...prev };
      next[key] = (next[key] || []).filter((_, i) => i !== idx);
      return next;
    });
    setMenuFor(null);
  };

  const saveModal = () => {
    const { driverId, shiftIndex, start, end, vehicle } = modal;
    const existing = localShiftsFor(driverId);
    const res = validateShift(start, end, existing, shiftIndex ?? -1);
    if (!res.ok) { setModal((m) => ({ ...m, error: res.error })); return; }

    const key = `${driverId}|${date}`;
    const record = {
      id: shiftIndex != null ? existing[shiftIndex].id : "S-" + Math.random().toString(36).slice(2, 7),
      utcStart: localToUtcMin(start, offset),
      utcEnd: localToUtcMin(end, offset),
      vehicle,
    };
    setShifts((prev) => {
      const arr = [...(prev[key] || [])];
      if (shiftIndex != null) arr[shiftIndex] = record;
      else arr.push(record);
      return { ...prev, [key]: arr };
    });
    setModal(null);
  };

  /* -------- copy / paste with overwrite -------- */
  const copyDay = () => {
    // snapshot current date's shifts for shown drivers (as UTC, source of truth)
    const items = shownDrivers.map((d) => ({
      driverId: d.id,
      shifts: (shifts[`${d.id}|${date}`] || []).map((s) => ({ ...s })),
    })).filter((x) => x.shifts.length);
    setClipboard({ fromDate: date, items });
  };

  const doPaste = (toDate, { overwrite }) => {
    setShifts((prev) => {
      const next = { ...prev };
      clipboard.items.forEach(({ driverId, shifts: sh }) => {
        const key = `${driverId}|${toDate}`;
        const fresh = sh.map((s) => ({ ...s, id: "S-" + Math.random().toString(36).slice(2, 7) }));
        next[key] = overwrite ? fresh : [...(next[key] || []), ...fresh];
      });
      return next;
    });
    setActiveDates((a) => ({ ...a, [toDate]: true }));
    setPasteTarget("");
    setOverwriteAsk(null);
  };

  const requestPaste = (toDate) => {
    if (!clipboard || !toDate) return;
    // does the target already have shifts for any pasted driver? (the 709 case)
    const collision = clipboard.items.some(({ driverId }) => (shifts[`${driverId}|${toDate}`] || []).length > 0);
    if (collision) setOverwriteAsk({ toDate });
    else doPaste(toDate, { overwrite: false });
  };

  // close any open action menu on outside click
  const rootRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (menuFor && rootRef.current && !rootRef.current.contains(e.target)) setMenuFor(null); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuFor]);

  /* ============================ render ============================ */
  const btn = (extra = {}) => ({
    fontFamily: C.mono, fontSize: 12, padding: "6px 11px", borderRadius: 6,
    border: `1px solid ${C.line}`, background: C.panel, color: C.fg, cursor: "pointer", ...extra,
  });

  return (
    <div ref={rootRef} style={{ fontFamily: C.mono, color: C.fg, fontSize: 13 }}>
      {/* filter bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <select value={cityId} onChange={(e) => setCityId(e.target.value)} style={btn({ background: C.ink })}>
          {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name} (UTC{c.utc_offset >= 0 ? "+" : ""}{(c.utc_offset/60).toFixed(2).replace(/\.00$/,"")})</option>)}
        </select>
        <select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} style={btn({ background: C.ink })}>
          <option value="all">all drivers</option>
          {DRIVERS.filter((d) => d.city === cityId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search driver / id"
          style={btn({ background: C.ink, width: 150 })} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={btn({ background: C.ink })} />

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* active/inactive toggle for the date */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.dim, fontSize: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dateActive ? C.run : C.rose }} />
            <input type="checkbox" checked={dateActive}
              onChange={(e) => setActiveDates((a) => ({ ...a, [date]: e.target.checked }))} />
            {dateActive ? "active" : "inactive"}
          </label>
          <button style={btn()} onClick={copyDay}>⧉ copy day</button>
          <button style={btn({ borderColor: clipboard ? "#2fa617" : C.line, color: clipboard ? C.run : C.dim })}
            onClick={() => setPasteTarget(date)} disabled={!clipboard}>⧉ paste…</button>
        </div>
      </div>

      {/* utc_offset explainer */}
      <p style={{ color: C.dim, fontSize: 11, margin: "0 0 10px" }}>
        times stored in UTC · shown in {city.name} local (offset {offset >= 0 ? "+" : ""}{offset} min).
        switch city to watch the same shifts shift.
      </p>

      {/* shift table */}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "auto", opacity: dateActive ? 1 : 0.55 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: C.ink, color: C.dim }}>
              <th style={{ textAlign: "left", padding: "9px 12px", borderBottom: `1px solid ${C.line}`, minWidth: 190 }}>driver</th>
              {Array.from({ length: maxShifts }).map((_, i) => (
                <th key={i} style={{ textAlign: "left", padding: "9px 12px", borderBottom: `1px solid ${C.line}` }}>shift {i + 1}</th>
              ))}
              <th style={{ padding: "9px 12px", borderBottom: `1px solid ${C.line}` }}></th>
            </tr>
          </thead>
          <tbody>
            {shownDrivers.map((d) => {
              const ls = localShiftsFor(d.id);
              return (
                <tr key={d.id} style={{ borderBottom: `1px solid rgba(35,42,59,.5)` }}>
                  <td style={{ padding: "9px 12px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.line, color: C.dim,
                        display: "grid", placeItems: "center", fontSize: 11, flexShrink: 0 }}>
                        {d.name.split(" ").map((w) => w[0]).join("")}
                      </div>
                      <div style={{ lineHeight: 1.35 }}>
                        <div style={{ color: C.fg }}>{d.name}</div>
                        <div style={{ color: C.dim, fontSize: 11 }}>{d.id} · {d.phone}</div>
                      </div>
                    </div>
                  </td>

                  {Array.from({ length: maxShifts }).map((_, i) => {
                    const s = ls[i];
                    if (!s) return <td key={i} style={{ padding: "9px 12px", color: "#3a4256" }}>—</td>;
                    const overnight = isOvernight(hmToMin(s.startLocal), hmToMin(s.endLocal));
                    const dur = shiftDuration(hmToMin(s.startLocal), hmToMin(s.endLocal));
                    const menuKey = `${d.id}|${i}`;
                    return (
                      <td key={i} style={{ padding: "9px 12px", verticalAlign: "top", position: "relative" }}>
                        <div style={{ color: overnight ? C.violet : C.run, fontWeight: 600 }}>
                          {s.startLocal}–{s.endLocal}{overnight ? " ⤵" : ""}
                        </div>
                        <div style={{ color: C.dim, fontSize: 11 }}>
                          {Math.floor(dur/60)}h{dur%60 ? `${dur%60}m` : ""} · {s.vehicle}
                        </div>
                        <div style={{ color: "#465066", fontSize: 10.5 }}>{s.id}</div>
                        <button style={{ position: "absolute", top: 6, right: 6, background: "none",
                          border: "none", color: C.dim, cursor: "pointer", fontSize: 15, lineHeight: 1 }}
                          onClick={() => setMenuFor(menuFor === menuKey ? null : menuKey)}>⋯</button>
                        {menuFor === menuKey && (
                          <div style={{ position: "absolute", top: 24, right: 6, zIndex: 5, background: C.panel,
                            border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden", minWidth: 96 }}>
                            <div style={menuItem} onClick={() => openEdit(d.id, i)}>edit</div>
                            <div style={{ ...menuItem, color: C.rose }} onClick={() => deleteShift(d.id, i)}>delete</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ padding: "9px 12px", verticalAlign: "top", textAlign: "right" }}>
                    <button style={btn({ padding: "4px 9px" })} onClick={() => openAdd(d.id)}>+ add</button>
                  </td>
                </tr>
              );
            })}
            {shownDrivers.length === 0 && (
              <tr><td colSpan={maxShifts + 2} style={{ padding: 18, color: C.dim, textAlign: "center" }}>
                no drivers match these filters
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* add/edit modal */}
      {modal && (
        <Overlay onClose={() => setModal(null)}>
          <h4 style={{ fontFamily: C.mono, margin: "0 0 12px" }}>
            {modal.shiftIndex != null ? "edit shift" : "add shift"} · {DRIVERS.find((d) => d.id === modal.driverId).name}
          </h4>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Field label="start (local)">
              <input type="time" value={modal.start} onChange={(e) => setModal((m) => ({ ...m, start: e.target.value, error: "" }))} style={fieldInput} />
            </Field>
            <Field label="end (local)">
              <input type="time" value={modal.end} onChange={(e) => setModal((m) => ({ ...m, end: e.target.value, error: "" }))} style={fieldInput} />
            </Field>
            <Field label="vehicle">
              <select value={modal.vehicle} onChange={(e) => setModal((m) => ({ ...m, vehicle: e.target.value }))} style={fieldInput}>
                {VEHICLES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
          </div>
          {modal.start && modal.end && (
            <p style={{ color: C.dim, fontSize: 11, marginTop: 10 }}>
              stored as UTC {minToHm(localToUtcMin(modal.start, offset))}–{minToHm(localToUtcMin(modal.end, offset))}
              {isOvernight(hmToMin(modal.start), hmToMin(modal.end)) ? " · overnight (crosses midnight)" : ""}
            </p>
          )}
          {modal.error && <p style={{ color: C.rose, fontSize: 12, marginTop: 8 }}>⚠ {modal.error}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button style={btn()} onClick={() => setModal(null)}>cancel</button>
            <button style={btn({ background: "rgba(74,246,38,.12)", borderColor: "#2fa617", color: C.run })} onClick={saveModal}>save</button>
          </div>
        </Overlay>
      )}

      {/* paste target picker */}
      {pasteTarget !== "" && clipboard && (
        <Overlay onClose={() => setPasteTarget("")}>
          <h4 style={{ fontFamily: C.mono, margin: "0 0 6px" }}>paste {clipboard.items.reduce((n, x) => n + x.shifts.length, 0)} shifts</h4>
          <p style={{ color: C.dim, fontSize: 12, margin: "0 0 12px" }}>copied from {clipboard.fromDate}. choose a target date:</p>
          <input type="date" value={pasteTarget} onChange={(e) => setPasteTarget(e.target.value)} style={fieldInput} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button style={btn()} onClick={() => setPasteTarget("")}>cancel</button>
            <button style={btn({ background: "rgba(74,246,38,.12)", borderColor: "#2fa617", color: C.run })}
              onClick={() => requestPaste(pasteTarget)}>paste here</button>
          </div>
        </Overlay>
      )}

      {/* overwrite confirmation (the 709 flow) */}
      {overwriteAsk && (
        <Overlay onClose={() => setOverwriteAsk(null)}>
          <h4 style={{ fontFamily: C.mono, margin: "0 0 8px", color: C.amber }}>shifts already exist</h4>
          <p style={{ color: C.dim, fontSize: 12.5, margin: "0 0 14px" }}>
            {overwriteAsk.toDate} already has shifts for some of these drivers. Overwrite them, or append alongside?
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={btn()} onClick={() => setOverwriteAsk(null)}>cancel</button>
            <button style={btn()} onClick={() => doPaste(overwriteAsk.toDate, { overwrite: false })}>append</button>
            <button style={btn({ background: "rgba(244,114,182,.12)", borderColor: C.rose, color: C.rose })}
              onClick={() => doPaste(overwriteAsk.toDate, { overwrite: true })}>overwrite</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

/* -------- small presentational helpers -------- */
const menuItem = { padding: "7px 11px", fontSize: 12, cursor: "pointer", color: "#e4e7ef", borderBottom: "1px solid #232a3b" };
const fieldInput = { fontFamily: C.mono, fontSize: 13, padding: "7px 9px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.ink, color: C.fg };

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: C.dim }}>{label}</span>
      {children}
    </label>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
      display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, border: `1px solid ${C.line}`,
        borderRadius: 12, padding: 20, width: "min(460px, 100%)", boxShadow: "0 30px 80px -40px rgba(0,0,0,.8)" }}>
        {children}
      </div>
    </div>
  );
}