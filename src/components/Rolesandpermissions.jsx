import { useState, useMemo, useEffect } from "react";

/**
 * RolesAndPermissions (dummy) — a self-contained clean-room replica of an
 * admin role/permission manager from an operations dashboard. Keeps the real
 * client-side logic, runs on synthetic data, NO backend.
 *
 * Faithful logic:
 *   • number-encoded permissions (1=view, 2=edit, 3=add) serialized per tab to
 *     a comma string ("1,2,3"); only active tabs with >=1 permission are submitted
 *   • per-tab expansion: picking a tab reveals View (+ Edit/Add for privileged tabs)
 *   • Role 1 read-only special-casing: can't disable, locked checkboxes, the edit
 *     button reads "View", no Save button
 *   • slide-in add/edit panel, roles table with analytics indicator, enable/disable,
 *     custom pagination (10/page)
 *   • conditional masking toggles gated behind city_manager_enabled; clientId==1
 *     forces masking on + disabled
 *   • tab_id 25 "Manage Tabs" modal for shuttle-analytics sub-reports, submitted
 *     under shuttle_analytics_reports
 *
 * Removed (backend-bound): fetch_admin_roles/tabs endpoints, serverUrl/operationsUrl,
 * token-expiry redirect to /signup, raw fetch vs makePostRequestToUrl — replaced by
 * in-memory state + a live "submitted payload" preview.
 *
 * Fixed on purpose (bugs noted in the source, corrected here so the demo shows
 * the logic working): sorting now actually sorts; the role load runs once, not
 * twice; `view` reflects the real stored permission instead of `|| true` always-on.
 *
 * Drop-in: React only, inline styles, no external libs.
 */

/* ============================ constants ============================ */

// permission codes (as in the real component)
export const PERM = { VIEW: 1, EDIT: 2, ADD: 3 };
// tabs that expose Edit/Add (not just View)
export const PRIVILEGED_TABS = [1, 40];
const SHUTTLE_TAB = 25; // special "Manage Tabs" analytics tab

// available tabs (fetch_admin_tabs, synthetic)
export const TABS = [
  { tab_id: 1, name: "Dashboard" },
  { tab_id: 12, name: "Drivers" },
  { tab_id: 18, name: "Vehicles" },
  { tab_id: 25, name: "Shuttle Analytics" },
  { tab_id: 33, name: "Payments" },
  { tab_id: 40, name: "Roles & Permissions" },
];

// analytics sub-reports for the tab_id 25 modal (AnalyticsTabs constant)
export const ANALYTICS_TABS = [
  { id: "ridership", label: "Ridership" },
  { id: "utilization", label: "Fleet Utilization" },
  { id: "on_time", label: "On-Time Performance" },
  { id: "revenue", label: "Revenue by Route" },
  { id: "cancellations", label: "Cancellations" },
];

/* ============================ pure logic ============================ */

// Serialize a tab's selected permission codes to the submitted comma string.
// Sorted + de-duped so "1,2,3" is stable regardless of click order.
export function serializePermissions(codes) {
  return [...new Set(codes)].sort((a, b) => a - b).join(",");
}

// Parse a stored "1,2,3" back into a Set of codes.
export function parsePermissions(str) {
  if (!str) return new Set();
  return new Set(str.split(",").map((n) => Number(n.trim())).filter(Boolean));
}

// A tab may only offer Edit/Add if it's privileged; View is always offered.
export function allowedPermsForTab(tabId) {
  return PRIVILEGED_TABS.includes(tabId) ? [PERM.VIEW, PERM.EDIT, PERM.ADD] : [PERM.VIEW];
}

/**
 * Build the submit payload from the editor state — the real rule:
 * only ACTIVE tabs that have >=1 permission are included.
 * `tabState` = { [tabId]: { active: bool, perms: Set<number> } }
 */
export function buildPayload({ name, tabState, masking, shuttleReports }) {
  const tabs = Object.entries(tabState)
    .filter(([, t]) => t.active && t.perms.size > 0)
    .map(([tabId, t]) => ({
      tab_id: Number(tabId),
      permissions: serializePermissions([...t.perms]),
    }));

  const payload = { name: name.trim(), tabs };

  // shuttle analytics sub-reports ride under their own field when tab 25 is on
  const shuttle = tabState[SHUTTLE_TAB];
  if (shuttle?.active && shuttleReports.size > 0) {
    payload.shuttle_analytics_reports = [...shuttleReports];
  }
  // masking flags only when present
  if (masking) {
    payload.user_details_masking = masking.user ? 1 : 0;
    payload.driver_details_masking = masking.driver ? 1 : 0;
  }
  return payload;
}

/* ============================ synthetic seed ============================ */

const seedRoles = () => [
  { role_id: 1, name: "Super Admin", analyticsTabs: true, active: true,
    tabs: { 1: "1,2,3", 12: "1", 18: "1", 25: "1", 33: "1", 40: "1,2,3" } },
  { role_id: 2, name: "Operations Manager", analyticsTabs: true, active: true,
    tabs: { 1: "1", 12: "1", 25: "1", 33: "1" }, shuttle: ["ridership", "on_time"] },
  { role_id: 3, name: "Dispatcher", analyticsTabs: false, active: true,
    tabs: { 1: "1", 12: "1" } },
  { role_id: 4, name: "Finance", analyticsTabs: false, active: false,
    tabs: { 1: "1", 33: "1" } },
  { role_id: 5, name: "Support Lead", analyticsTabs: true, active: true,
    tabs: { 1: "1", 12: "1", 25: "1" }, shuttle: ["cancellations"] },
  { role_id: 6, name: "Read-only Auditor", analyticsTabs: false, active: true,
    tabs: { 1: "1", 40: "1" } },
  { role_id: 7, name: "Fleet Analyst", analyticsTabs: true, active: true,
    tabs: { 18: "1", 25: "1" }, shuttle: ["utilization", "revenue"] },
  { role_id: 8, name: "City Manager - North", analyticsTabs: false, active: true,
    tabs: { 1: "1", 12: "1", 18: "1" } },
  { role_id: 9, name: "City Manager - South", analyticsTabs: false, active: false,
    tabs: { 1: "1", 12: "1" } },
  { role_id: 10, name: "Payments Ops", analyticsTabs: false, active: true,
    tabs: { 33: "1" } },
  { role_id: 11, name: "QA / Staging", analyticsTabs: true, active: true,
    tabs: { 1: "1", 40: "1,2" } },
  { role_id: 12, name: "Partner Admin", analyticsTabs: false, active: true,
    tabs: { 1: "1", 18: "1" } },
];

const PAGE_SIZE = 10;

/* ============================ palette ============================ */
const C = {
  bg: "#10141d", panel: "#171c28", line: "#232a3b", ink: "#0b0e14",
  fg: "#e4e7ef", dim: "#8b93a7", run: "#4af626", runDim: "#2fa617",
  amber: "#ffb454", violet: "#a78bfa", rose: "#f472b6",
  mono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
};

/* ============================ component ============================ */

export default function RolesDemo() {
  const [roles, setRoles] = useState(seedRoles);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState("asc");     // sorting state — actually used here
  const [orderBy, setOrderBy] = useState("role_id");
  const [panel, setPanel] = useState(null);      // {mode:'add'|'edit'|'view', role}
  const [cityManagerEnabled, setCityManagerEnabled] = useState(true); // toggle to reveal masking
  const [clientId, setClientId] = useState(2);   // set to 1 to force masking on+disabled

  // sort BEFORE paginating (the source had sort state but never applied it)
  const sortedRoles = useMemo(() => {
    const arr = [...roles];
    arr.sort((a, b) => {
      let av = a[orderBy], bv = b[orderBy];
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [roles, order, orderBy]);

  const pageCount = Math.max(1, Math.ceil(sortedRoles.length / PAGE_SIZE));
  const pageRows = sortedRoles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  const requestSort = (field) => {
    if (orderBy === field) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setOrderBy(field); setOrder("asc"); }
  };

  // enable/disable a role — Role 1 is guarded
  const toggleActive = (role) => {
    if (role.role_id === 1) return; // default role can't be disabled
    setRoles((rs) => rs.map((r) => (r.role_id === role.role_id ? { ...r, active: !r.active } : r)));
  };

  const openAdd = () => setPanel({ mode: "add", role: null });
  const openEditOrView = (role) =>
    setPanel({ mode: role.role_id === 1 ? "view" : "edit", role });

  const saveRole = (built) => {
    setPanel(null);
    if (built.__mode === "add") {
      setRoles((rs) => [
        ...rs,
        {
          role_id: Math.max(...rs.map((r) => r.role_id)) + 1,
          name: built.name || "Untitled role",
          analyticsTabs: !!built.tabs.find((t) => t.tab_id === SHUTTLE_TAB),
          active: true,
          tabs: Object.fromEntries(built.tabs.map((t) => [t.tab_id, t.permissions])),
          shuttle: built.shuttle_analytics_reports || [],
        },
      ]);
    } else {
      setRoles((rs) =>
        rs.map((r) =>
          r.role_id === built.__roleId
            ? {
                ...r,
                name: built.name || r.name,
                analyticsTabs: !!built.tabs.find((t) => t.tab_id === SHUTTLE_TAB),
                tabs: Object.fromEntries(built.tabs.map((t) => [t.tab_id, t.permissions])),
                shuttle: built.shuttle_analytics_reports || [],
              }
            : r
        )
      );
    }
  };

  const btn = (extra = {}) => ({
    fontFamily: C.mono, fontSize: 12, padding: "6px 11px", borderRadius: 6,
    border: `1px solid ${C.line}`, background: C.panel, color: C.fg, cursor: "pointer", ...extra,
  });
  const sortArrow = (f) => (orderBy === f ? (order === "asc" ? " ▲" : " ▼") : "");

  return (
    <div style={{ fontFamily: C.mono, color: C.fg, fontSize: 13 }}>
      {/* account-context toggles (demo affordances for the special-cased flags) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button style={btn({ background: "rgba(74,246,38,.1)", borderColor: C.runDim, color: C.run })} onClick={openAdd}>
          + add role
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center", fontSize: 11.5, color: C.dim }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={cityManagerEnabled} onChange={(e) => setCityManagerEnabled(e.target.checked)} />
            city_manager_enabled
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={clientId === 1} onChange={(e) => setClientId(e.target.checked ? 1 : 2)} />
            clientId == 1
          </label>
        </div>
      </div>

      {/* roles table */}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: C.ink, color: C.dim }}>
              <th onClick={() => requestSort("role_id")} style={{ ...th, cursor: "pointer", userSelect: "none" }}>
                id{sortArrow("role_id")}
              </th>
              <th onClick={() => requestSort("name")} style={{ ...th, cursor: "pointer", userSelect: "none" }}>
                role{sortArrow("name")}
              </th>
              <th style={th}>analytics tabs</th>
              <th style={th}>status</th>
              <th style={{ ...th, textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.role_id} style={{ borderBottom: `1px solid rgba(35,42,59,.5)` }}>
                <td style={td}>{r.role_id}</td>
                <td style={{ ...td, color: C.fg }}>
                  {r.name}
                  {r.role_id === 1 && <span style={badge(C.violet)}>default</span>}
                </td>
                <td style={td}>
                  <span style={{ color: r.analyticsTabs ? C.run : "#465066" }}>
                    {r.analyticsTabs ? "● enabled" : "○ disabled"}
                  </span>
                </td>
                <td style={td}>
                  <button
                    onClick={() => toggleActive(r)}
                    disabled={r.role_id === 1}
                    title={r.role_id === 1 ? "the default role can't be disabled" : ""}
                    style={btn({
                      padding: "3px 10px",
                      color: r.active ? C.run : C.rose,
                      borderColor: r.role_id === 1 ? C.line : (r.active ? C.runDim : C.rose),
                      opacity: r.role_id === 1 ? 0.5 : 1,
                      cursor: r.role_id === 1 ? "not-allowed" : "pointer",
                    })}
                  >
                    {r.active ? "Enabled" : "Disabled"}
                  </button>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button style={btn({ padding: "3px 12px" })} onClick={() => openEditOrView(r)}>
                    {r.role_id === 1 ? "View" : "Edit"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* custom pagination */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end", marginTop: 10 }}>
        <span style={{ color: C.dim, fontSize: 11, marginRight: 6 }}>
          {sortedRoles.length} roles · page {page}/{pageCount}
        </span>
        <button style={btn({ padding: "4px 9px", opacity: page === 1 ? 0.4 : 1 })}
          onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>←</button>
        {Array.from({ length: pageCount }).map((_, i) => (
          <button key={i}
            style={btn({
              padding: "4px 10px",
              background: page === i + 1 ? "rgba(74,246,38,.12)" : C.panel,
              borderColor: page === i + 1 ? C.runDim : C.line,
              color: page === i + 1 ? C.run : C.fg,
            })}
            onClick={() => setPage(i + 1)}>{i + 1}</button>
        ))}
        <button style={btn({ padding: "4px 9px", opacity: page === pageCount ? 0.4 : 1 })}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>→</button>
      </div>

      {/* slide-in add/edit/view panel */}
      {panel && (
        <RolePanel
          key={panel.role?.role_id ?? "new"}
          panel={panel}
          cityManagerEnabled={cityManagerEnabled}
          clientId={clientId}
          onClose={() => setPanel(null)}
          onSave={saveRole}
        />
      )}
    </div>
  );
}

/* ---------------------- the slide-in panel ---------------------- */
function RolePanel({ panel, cityManagerEnabled, clientId, onClose, onSave }) {
  const readOnly = panel.mode === "view"; // Role 1
  const role = panel.role;

  const [name, setName] = useState(role?.name || "");
  // tabState: { [tabId]: { active, perms:Set } }
  const [tabState, setTabState] = useState(() => {
    const st = {};
    TABS.forEach((t) => {
      const stored = role?.tabs?.[t.tab_id];
      st[t.tab_id] = { active: stored != null, perms: parsePermissions(stored) };
    });
    return st;
  });
  const [shuttleModal, setShuttleModal] = useState(false);
  const [shuttleReports, setShuttleReports] = useState(new Set(role?.shuttle || []));

  // masking: clientId==1 forces both ON and disabled
  const forced = clientId === 1;
  const [masking, setMasking] = useState({
    user: forced || false,
    driver: forced || false,
  });
  useEffect(() => {
    if (forced) setMasking({ user: true, driver: true });
  }, [forced]);

  // Escape closes the panel (unless the shuttle modal is open, which handles its own)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (shuttleModal) setShuttleModal(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shuttleModal, onClose]);

  const toggleTab = (tabId) =>
    setTabState((s) => {
      const cur = s[tabId];
      const nextActive = !cur.active;
      // turning a tab on seeds View by default; turning off clears perms
      const perms = nextActive ? new Set([PERM.VIEW]) : new Set();
      return { ...s, [tabId]: { active: nextActive, perms } };
    });

  const togglePerm = (tabId, code) =>
    setTabState((s) => {
      const perms = new Set(s[tabId].perms);
      perms.has(code) ? perms.delete(code) : perms.add(code);
      return { ...s, [tabId]: { ...s[tabId], perms } };
    });

  const toggleShuttleReport = (id) =>
    setShuttleReports((r) => {
      const n = new Set(r);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // live payload preview
  const payload = useMemo(
    () => buildPayload({
      name,
      tabState,
      masking: cityManagerEnabled ? masking : null,
      shuttleReports,
    }),
    [name, tabState, masking, shuttleReports, cityManagerEnabled]
  );

  const submit = () => {
    if (readOnly) return;
    onSave({
      ...payload,
      __mode: panel.mode,
      __roleId: role?.role_id,
    });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: "min(560px, 100%)",
          background: C.bg, borderLeft: `1px solid ${C.line}`, padding: 22, overflow: "auto",
          boxShadow: "-30px 0 80px -40px rgba(0,0,0,.8)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ fontFamily: C.mono, margin: 0, fontSize: 16 }}>
            {panel.mode === "add" ? "add role" : panel.mode === "view" ? "view role" : "edit role"}
          </h3>
          <button style={{ background: "none", border: "none", color: C.dim, fontSize: 20, cursor: "pointer" }} onClick={onClose}>×</button>
        </div>
        {readOnly && (
          <p style={{ color: C.violet, fontSize: 11.5, margin: "0 0 14px" }}>
            default role — read-only (locked checkboxes, no save)
          </p>
        )}

        {/* role name */}
        <label style={{ display: "block", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: C.dim }}>role name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={readOnly}
            placeholder="e.g. Regional Supervisor"
            style={{
              display: "block", width: "100%", marginTop: 4, fontFamily: C.mono, fontSize: 13,
              padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.line}`,
              background: C.ink, color: C.fg, opacity: readOnly ? 0.6 : 1,
            }}
          />
        </label>

        {/* tab picker with per-tab expansion */}
        <div style={{ marginTop: 18 }}>
          <span style={{ fontSize: 11, color: C.dim }}>tabs & permissions</span>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            {TABS.map((t) => {
              const st = tabState[t.tab_id];
              const allowed = allowedPermsForTab(t.tab_id);
              return (
                <div key={t.tab_id} style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "9px 11px",
                    background: st.active ? "rgba(74,246,38,.05)" : C.panel, cursor: readOnly ? "default" : "pointer",
                  }}>
                    <input type="checkbox" checked={st.active} disabled={readOnly} onChange={() => toggleTab(t.tab_id)} />
                    <span style={{ color: C.fg, flex: 1 }}>{t.name}</span>
                    <span style={{ color: C.dim, fontSize: 10.5 }}>tab_id {t.tab_id}</span>
                  </label>

                  {/* expansion: permission checkboxes when the tab is active */}
                  {st.active && (
                    <div style={{ padding: "9px 11px 11px 34px", display: "flex", gap: 16, alignItems: "center",
                      borderTop: `1px solid ${C.line}`, flexWrap: "wrap" }}>
                      {allowed.map((code) => {
                        const label = code === PERM.VIEW ? "view" : code === PERM.EDIT ? "edit" : "add";
                        return (
                          <label key={code} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12,
                            color: st.perms.has(code) ? C.fg : C.dim, cursor: readOnly ? "default" : "pointer" }}>
                            <input type="checkbox" checked={st.perms.has(code)} disabled={readOnly}
                              onChange={() => togglePerm(t.tab_id, code)} />
                            {label} <span style={{ color: "#465066" }}>({code})</span>
                          </label>
                        );
                      })}
                      {/* tab 25 special: Manage Tabs opens the analytics sub-report modal */}
                      {t.tab_id === SHUTTLE_TAB && (
                        <button style={{ ...btnInline, marginLeft: "auto" }} disabled={readOnly}
                          onClick={() => setShuttleModal(true)}>
                          ⚙ manage tabs{shuttleReports.size ? ` (${shuttleReports.size})` : ""}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* masking toggles — only when city_manager_enabled */}
        {cityManagerEnabled && (
          <div style={{ marginTop: 18 }}>
            <span style={{ fontSize: 11, color: C.dim }}>
              masking {forced && <em style={{ color: C.amber }}>· forced on (clientId == 1)</em>}
            </span>
            <div style={{ marginTop: 8, display: "flex", gap: 18, flexWrap: "wrap" }}>
              {["user", "driver"].map((k) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5,
                  color: masking[k] ? C.fg : C.dim, cursor: (readOnly || forced) ? "default" : "pointer" }}>
                  <input type="checkbox" checked={masking[k]} disabled={readOnly || forced}
                    onChange={() => setMasking((m) => ({ ...m, [k]: !m[k] }))} />
                  {k === "user" ? "User Details Masking" : "Driver Details Masking"}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* live submitted-payload preview (stands in for the API call) */}
        <div style={{ marginTop: 20 }}>
          <span style={{ fontSize: 11, color: C.dim }}>submitted payload (only active tabs w/ ≥1 permission)</span>
          <pre style={{
            marginTop: 6, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8,
            padding: 12, fontSize: 11.5, color: C.run, overflow: "auto", maxHeight: 190, lineHeight: 1.5,
          }}>
{JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        {/* actions — no Save for the read-only default role */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button style={btnPanel()} onClick={onClose}>{readOnly ? "close" : "cancel"}</button>
          {!readOnly && (
            <button style={btnPanel({ background: "rgba(74,246,38,.12)", borderColor: C.runDim, color: C.run })} onClick={submit}>
              {panel.mode === "add" ? "create role" : "update role"}
            </button>
          )}
        </div>

        {/* shuttle analytics sub-report modal (tab_id 25) */}
        {shuttleModal && (
          <div onClick={() => setShuttleModal(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", zIndex: 60, padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()}
              style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20, width: "min(420px,100%)" }}>
              <h4 style={{ fontFamily: C.mono, margin: "0 0 4px" }}>Shuttle Analytics · Manage Tabs</h4>
              <p style={{ color: C.dim, fontSize: 11.5, margin: "0 0 12px" }}>
                submitted under <span style={{ color: C.amber }}>shuttle_analytics_reports</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ANALYTICS_TABS.map((a) => (
                  <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                    color: shuttleReports.has(a.id) ? C.fg : C.dim, cursor: "pointer" }}>
                    <input type="checkbox" checked={shuttleReports.has(a.id)} onChange={() => toggleShuttleReport(a.id)} />
                    {a.label}
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button style={btnPanel({ background: "rgba(74,246,38,.12)", borderColor: C.runDim, color: C.run })}
                  onClick={() => setShuttleModal(false)}>done</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------- style helpers -------- */
const th = { textAlign: "left", padding: "9px 12px", borderBottom: `1px solid ${C.line}`, fontWeight: 500, fontSize: 11.5 };
const td = { padding: "9px 12px", verticalAlign: "middle", color: C.dim };
const badge = (color) => ({ marginLeft: 8, fontSize: 10, color, border: `1px solid ${color}`, borderRadius: 999, padding: "1px 7px" });
const btnInline = { fontFamily: C.mono, fontSize: 11.5, padding: "4px 9px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.panel, color: C.amber, cursor: "pointer" };
function btnPanel(extra = {}) {
  return { fontFamily: C.mono, fontSize: 12.5, padding: "8px 14px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.panel, color: C.fg, cursor: "pointer", ...extra };
}