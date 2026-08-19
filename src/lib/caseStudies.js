// Content for the "Systems I've Built" case-study section.
// Each entry pairs a live demo with the real-world logic behind it.
// Drop real product screenshots into client/public/shots/ and reference them
// in `shot` to show them alongside the live demo.

export const CASE_STUDIES = [
  {
    id: "mapper",
    tab: "Bulk Import Mapper",
    title: "Mapper to import Data",
    context: "Togopool · bulk-order import tool upto 200k rows",
    tags: ["React", "Fuzzy header match", "30-field schema", "XLSX/CSV"],
    problem:
      "Client Ops teams uploaded messy XLSX/CSV order files where headers never matched the schema, dates arrived in five formats, enums were free-text, and required fields depended on the order type. A naive import mangled data or froze the tab on large files.",
    approach: [
      "A normalize() pass (strips case, spaces, punctuation, diacritics) auto-maps arbitrary headers like \"Placed On\" or \"Cust Mobile\" to the right schema field.",
      "Values are coerced, not just checked: \"Pickup & Drop\", \"pickup\" and \"3\" all resolve to the same category; dates handle Excel serials and dd-mm vs mm-dd ambiguity.",
      "Validation is category-dependent — a pickup order requires pickup address/phone, a drop order requires drop fields — and runs in chunks so the tab never freezes at 200k rows.",
    ],
    impact: "Imports of 100k+ rows per upload, validated before a single write.",
    // Numbers measured from the actual extracted engine running in-browser:
    metrics: [
      { k: "rows/import", v: "200k+" },
      { k: "throughput", v: "~90k/s" },
      { k: "date formats", v: "5+" },
    ],
    demoNote:
      "This runs the actual mapping + validation logic from the production tool, on synthetic data. Hit auto-map to see the fuzzy header matching, then validate — the reject table shows real category-dependent failures.",
    shot: [
      {
        src: "./shots/importimage.png",
        caption: "CSV Import Interface – Upload and import bulk order data efficiently."
      },
      {
        src: "./shots/headermapper.png",
        caption: "Smart Header Mapping – Map CSV columns to the required system fields."
      },
      {
        src: "./shots/datamapper.png",
        caption: "Data Mapping & Validation – Review and validate mapped data before importing."
      },
      {
        src: "./shots/succesful.png",
        caption: "Successful Import Confirmation – Provides clear feedback after bulk data processing."
      },
      {
        src: "./shots/output.png",
        caption: "Imported Order Data – Processed orders are ready for route optimization and management."
      },
    ],
  },
  {
    id: "tracking",
    tab: "Real-time Tracking",
    title: "Live vehicle tracking",
    context: "Togopool · SaaS tracking platform",
    tags: ["WebSockets", "SVG", "Real-time state"],
    problem:
      "Dispatchers needed to see driver and vehicle positions update live, without hammering the server with polling.",
    approach: [
      "A single WebSocket connection streams position + status deltas to the client.",
      "Incoming ticks patch an in-memory vehicle map; markers interpolate smoothly between updates instead of jumping.",
      "A connection indicator and event feed make the live link visible and debuggable.",
    ],
    impact: "Smooth live tracking with reconnect handling on a production SaaS.",
    metrics: [
      { k: "transport", v: "WebSocket" },
      { k: "update cadence", v: "sub-second" },
      { k: "polling", v: "none" },
    ],
    demoNote:
      "Simulated socket ticks drive the markers and the event feed. Toggle the connection to see disconnect/reconnect behavior.",
    shot: [
      { src: "./shots/livetracking.png", caption: "Live Vehicle Tracking – Track vehicle locations and status in real-time." },
      { src: "./shots/livetrackingdetails.png", caption: "Vehicle Details – View detailed information about specific vehicles and their trips." },
    ],
  },
  {
    id: "dashboard",
    tab: "Ops Dashboard",
    title: "Live operations dashboard",
    context: "Togopool · admin monitoring",
    tags: ["React", "Live charts", "Streaming metrics"],
    problem:
      "Admins needed an at-a-glance view of orders, revenue, active users, and system latency that reflected reality now — not a stale hourly snapshot.",
    approach: [
      "KPI cards subscribe to a metrics stream and update in place with tabular-figure formatting so numbers don't jitter.",
      "A rolling throughput chart keeps a fixed window of recent intervals, shifting as new data arrives.",
      "Latency crosses a threshold → its card shifts color, surfacing problems without a separate alert screen.",
    ],
    impact: "Real-time operational visibility for the admin team.",
    metrics: [
      { k: "refresh", v: "live" },
      { k: "KPIs", v: "4 streams" },
      { k: "window", v: "rolling 24" },
    ],
    demoNote:
      "Live-updating metrics and a rolling chart. Pause the stream to inspect a moment.",
    shot: [
      {
        src: "./shots/dashboard1.png",
        caption: "Real-time KPI overview – OTIF, RTO, driver utilization, and cost-per-delivery at a glance."
      },
      {
        src: "./shots/dashboard2.png",
        caption: "Trip status & delivery outcomes – live breakdown of trips and delivery funnel."
      },
      {
        src: "./shots/dashboard3.png",
        caption: "Fleet & operational trends – hub distribution, hourly dispatch, and COD reconciliation."
      },
      {
        src: "./shots/customisekpi.png",
        caption: "Customise KPIs – choose which metrics appear on the dashboard."
      },
    ],
  },
  {
    id: "shift",
    tab: "Shift Scheduling",
    title: "Driver shift scheduler",
    context: "Togopool · driver operations + RBAC",
    tags: ["React", "RBAC", "Scheduling"],
    problem:
      "Coordinating driver shifts across a week — with roles and minimum coverage — was being done in spreadsheets and broke constantly.",
    approach: [
      "An interactive roster grid assigns AM/PM/NT shifts per driver per day with a click.",
      "Roles (lead / driver / trainee) carry through as badges, mirroring the role-based access control in the real module.",
      "A live coverage row flags any day that drops below minimum staffing.",
    ],
    impact: "Shift scheduling with role-based access, replacing spreadsheets.",
    metrics: [
      { k: "shift types", v: "AM/PM/NT" },
      { k: "roles", v: "RBAC" },
      { k: "coverage", v: "live check" },
    ],
    demoNote:
      "Click cells to reassign shifts; the coverage row recomputes instantly and flags understaffed days.",
    shot: [
      {
        src: "./shots/shifttimingdata1.png",
        caption: "Shift schedule overview – drivers and their shifts for the selected day and city."
      },
      {
        src: "./shots/shifttiming2.png",
        caption: "Add & edit shifts – set timings and assign a vehicle, with overlap validation."
      },
      {
        src: "./shots/copiedon.png",
        caption: "Copy a day's shifts – duplicate a whole day's roster in one action."
      },
      {
        src: "./shots/copypattern.png",
        caption: "Choose the target date – pick which date to paste the copied shifts onto."
      },
      {
        src: "./shots/aftercopy.png",
        caption: "After copy – the same shifts applied to the selected date."
      },
      {
        src: "./shots/singleshiftedit.png",
        caption: "Edit a single shift – adjust an individual driver's shift inline."
      },
    ],
  },
  {
    id: "roles",
    tab: "Roles & Permissions",
    title: "Admin roles & permissions",
    context: "Togopool · access control",
    tags: ["React", "RBAC", "Permission encoding"],
    problem:
      "Admins needed to define roles and control, per tab, exactly what each role could see and do — with a locked-down default role, account-specific masking rules, and analytics sub-permissions.",
    approach: [
      "Permissions are number-encoded (1=view, 2=edit, 3=add) and serialized per tab to a comma string; only active tabs with at least one permission are submitted.",
      "Selecting a tab expands to reveal its permission checkboxes — View everywhere, Edit/Add only on privileged tabs — and a special tab opens a modal for analytics sub-reports.",
      "The default role is read-only throughout: it can't be disabled, its checkboxes are locked, and no save button appears — mirroring the real guard rails.",
    ],
    impact: "Fine-grained, tab-level RBAC for the operations dashboard.",
    metrics: [
      { k: "encoding", v: "1/2/3" },
      { k: "default role", v: "locked" },
      { k: "scope", v: "per-tab" },
    ],
    demoNote:
      "Runs the real permission logic on synthetic data (no backend). Open a role to see per-tab expansion and the live submitted payload; try the locked default role, or toggle city_manager_enabled / clientId==1 to reveal the masking special-cases.",
    shot: [
      {
        src: "./shots/rolesandpermissiondata.png",
        caption: "Roles overview – all admin roles with their access status and analytics-tab access."
      },
      {
        src: "./shots/rolesandpermissionforsuperadmin.png",
        caption: "Super Admin (default role) – read-only view with locked permissions."
      },
      {
        src: "./shots/rolesandpermissionnonsuperadmin.png",
        caption: "Editable role – set per-tab View/Edit/Add permissions for a standard role."
      },
    ],
  },
  {
    id: "chat",
    tab: "Support Chat Console",
    title: "Real-time support chat & console",
    context: "Togopool · admin support operations",
    tags: ["React", "Smart auto-scroll", "UTC offset", "Real-time chat"],
    problem:
      "Support agents and dispatchers needed a unified console to manage live chats with both drivers and riders simultaneously, with message bubble orientation by role, timezone offset handling, and non-disruptive auto-scrolling when new messages arrive.",
    approach: [
      "A ChatService bubble renderer computes left/right message placement dynamically based on context (ADMIN_USER vs ADMIN_DRIVER vs DRIVER_USER).",
      "Messages group automatically into date bands with timezone (UTC offset) calculations for accurate local time rendering.",
      "Smart auto-scroll pins to bottom on initial load and chat switching, but respects user scroll position when new live messages arrive.",
    ],
    impact: "Unified driver and rider support platform with low latency and quick-reply capability.",
    metrics: [
      { k: "context", v: "driver/user" },
      { k: "polling", v: "2s interval" },
      { k: "time offset", v: "UTC +5:30" },
    ],
    demoNote:
      "Interactive demo running client-side logic on synthetic data. Switch between driver/user queues, search conversations, send messages, or click 'simulate reply' to test live incoming ticks.",
    shot: [
      {
        src: "./shots/driverandcustomerchatlogs.png",
        caption: "Driver-User Chat Logs – audit table of past ride conversations, filterable by city and date range."
      },
      {
        src: "./shots/logsdetails.png",
        caption: "Chat log details – full conversation view with a side panel showing driver, rider, trip, vehicle, and payment details."
      },
      {
        src: "./shots/supportchatadmintodriver.png",
        caption: "Support Chats (Admin ↔ Driver) – live console for messaging drivers directly, with real-time updates."
      },
      {
        src: "./shots/chatadmintouser.png",
        caption: "Support Chats (Admin ↔ User) – live console for messaging riders directly, with quick-reply suggestions."
      },
    ],
  },
];
