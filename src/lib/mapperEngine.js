/**
 * Bulk-import mapper engine — a faithful clean-room extraction of the real
 * column-mapping + validation logic from the production route-optimization
 * tool (Togopool). Runs client-side on synthetic data so a visitor can watch
 * the actual logic work: normalize-based header matching, value coercion,
 * multi-format date/time parsing, and category-dependent row validation.
 *
 * No real endpoints, API keys, or business data — just the algorithms.
 * Framework-agnostic (no React) so it can be unit-tested and run in a worker.
 */

/* ------------------------------------------------------------------ *
 * 1. Header normalization  (the real `normalize` used for auto-mapping)
 * ------------------------------------------------------------------ */
// Collapses case, whitespace, punctuation, diacritics and zero-width chars so
// "Order Reference ID", "order_reference_id" and "ORDER-REFERENCE-ID" all match.
export const normalize = (str) =>
  str
    ?.toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\uFEFF\xA0]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

// Looser normalize for *values* (keeps it lenient for enum matching).
export const normalizeValue = (val) =>
  val?.toString().toLowerCase().replace(/[\s_\-]/g, "").trim();

/* ------------------------------------------------------------------ *
 * 2. Schema + accepted header aliases
 *    A representative subset of the real 40-field schema, chosen to show
 *    every validation *type*: enums, phones, category-dependent requireds,
 *    numerics, times and the multi-format date parser.
 * ------------------------------------------------------------------ */
export const SCHEMA = [
  { key: "order_reference_id", label: "Order Reference ID", type: "string",
    aliases: ["Order Ref", "OrderRef", "Reference ID", "Order ID"] },
  { key: "user_phone_number", label: "Customer Phone", type: "phone",
    aliases: ["Customer Mobile", "Cust Phone", "User Phone", "Phone"] },
  { key: "order_category", label: "Order Category", type: "enum",
    aliases: ["Order Type", "Type", "Category"] },
  { key: "delivery_type", label: "Delivery Type", type: "enum",
    aliases: ["Delivery", "Delivery Mode", "Service"] },
  { key: "pickup_address", label: "Pickup Address", type: "string",
    aliases: ["Pickup Addr", "PU Address", "From Address"] },
  { key: "pickup_contact_number", label: "Pickup Phone", type: "phone",
    aliases: ["Pickup Contact Number", "PU Phone", "Pickup Mobile"] },
  { key: "drop_address", label: "Drop Address", type: "string",
    aliases: ["Drop Addr", "DO Address", "To Address"] },
  { key: "drop_contact_number", label: "Drop Phone", type: "phone",
    aliases: ["Drop Contact Number", "DO Phone", "Drop Mobile"] },
  { key: "weight", label: "Weight", type: "number",
    aliases: ["Weight (kg)", "Wt", "Package Weight"] },
  { key: "window_start_time", label: "Window Start", type: "time",
    aliases: ["Start Time", "From", "Window From"] },
  { key: "window_end_time", label: "Window End", type: "time",
    aliases: ["End Time", "To", "Window To"] },
  { key: "date", label: "Order Date", type: "date",
    aliases: ["Date", "Placed On", "Order Dt"] },
  { key: "payment_status", label: "Payment Status", type: "enum",
    aliases: ["Payment", "Pmt Status", "Pay Status"] },
];

// Order-type drives which address/phone fields are required (real business rule).
// 1 = Pickup, 2 = Drop, 3 = Pickup & Drop.
export const CATEGORY_LABEL = { 1: "Pickup", 2: "Drop", 3: "Pickup & Drop" };

// Fields that block import when unmapped. Others get soft defaults.
export const HARD_REQUIRED = [
  "order_reference_id",
  "user_phone_number",
  "order_category",
];

// Enum value maps — accept human-readable OR numeric OR normalized input.
const orderCategoryMap = { pickup: 1, drop: 2, "pickup&drop": 3, pickupanddrop: 3, "1": 1, "2": 2, "3": 3 };
const deliveryTypeMap = { standard: 1, express: 2, std: 1, exp: 2, "1": 1, "2": 2 };
const paymentStatusMap = { pending: 0, paid: 1, failed: 2, "0": 0, "1": 1, "2": 2 };

const ENUM_MAPS = {
  order_category: orderCategoryMap,
  delivery_type: deliveryTypeMap,
  payment_status: paymentStatusMap,
};

// Validate a restricted (enum) field value, matching the real isValidFieldValue.
export function isValidFieldValue(key, value) {
  if (value === undefined || value === null || value === "") return false;
  const map = ENUM_MAPS[key];
  if (!map) return true;
  return map[normalizeValue(value)] !== undefined;
}

/* ------------------------------------------------------------------ *
 * 3. Phone validation  (real logic; libphonenumber approximated by digit rules)
 * ------------------------------------------------------------------ */
export function isValidPhone(phone) {
  if (!phone) return false;
  const clean = phone.toString().trim();
  if (clean.startsWith("+")) {
    const digits = clean.replace(/[^\d]/g, "");
    return digits.length >= 8 && digits.length <= 15; // stands in for parsePhoneNumber().isValid()
  }
  const digitsOnly = clean.replace(/[\s\-()]/g, "");
  return /^\d{7,15}$/.test(digitsOnly);
}

/* ------------------------------------------------------------------ *
 * 4. Time + date normalization  (ported near-verbatim from production)
 * ------------------------------------------------------------------ */
export function normalizeTimeValue(val) {
  if (val === null || val === undefined || val === "") return "";
  // Excel stores time-of-day as a fraction of a day (0.5 = 12:00).
  if (typeof val === "number") {
    const totalMinutes = Math.round((val % 1) * 24 * 60);
    const h = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
    const m = String(totalMinutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  }
  const match = String(val).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return String(val).trim();
}

export function normalizeDateValue(val) {
  if (val === null || val === undefined || val === "") return "";

  // 1) Excel serial number (days since 1899-12-30). Only a plausible serial range.
  if (typeof val === "number" || /^\d{4,6}(\.\d+)?$/.test(String(val).trim())) {
    const num = Number(val);
    if (num > 59 && num < 60000) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      const dt = new Date(excelEpoch + Math.round(num) * 86400000);
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  const parts = str.split(/[-/.]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 3) return str; // unparseable → return as-is (validator will catch)

  let year, month, day;
  if (parts[0].length === 4) {
    // yyyy-mm-dd
    [year, month, day] = parts;
  } else if (parts[2].length === 4) {
    // dd-mm-yyyy OR mm-dd-yyyy → resolve by which value can't be a month
    const p0 = Number(parts[0]);
    const p1 = Number(parts[1]);
    year = parts[2];
    if (p0 > 12) { day = parts[0]; month = parts[1]; }        // must be dd-mm
    else if (p1 > 12) { month = parts[0]; day = parts[1]; }   // must be mm-dd
    else { day = parts[0]; month = parts[1]; }                // ambiguous → dd-mm
  } else {
    // 2-digit year → assume 20yy
    day = parts[0]; month = parts[1]; year = "20" + parts[2].padStart(2, "0");
  }

  month = String(Number(month)).padStart(2, "0");
  day = String(Number(day)).padStart(2, "0");

  // Reject impossible dates (e.g. 31/02) — real code falls back; here it's invalid.
  const mNum = Number(month), dNum = Number(day);
  if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > 31) return "__INVALID__";
  // extra day-of-month sanity so 31/02 and 30/02 are caught
  const daysInMonth = new Date(Number(year), mNum, 0).getDate();
  if (dNum > daysInMonth) return "__INVALID__";

  return `${year}-${month}-${day}`;
}

/* ------------------------------------------------------------------ *
 * 5. Auto-mapping  (the real behaviour: match each schema field to a source
 *    header via normalize() against the field key + its aliases)
 * ------------------------------------------------------------------ */
export function autoMap(sourceHeaders) {
  const mapping = {}; // sourceHeader -> schemaKey
  SCHEMA.forEach((field) => {
    const candidates = [field.key, field.label, ...(field.aliases || [])].map(normalize);
    const match = sourceHeaders.find((h) => candidates.includes(normalize(h)));
    if (match) mapping[match] = field.key;
  });
  return mapping;
}

export function missingMappings(mapping) {
  const targets = new Set(Object.values(mapping));
  return HARD_REQUIRED.filter((k) => !targets.has(k));
}

/* ------------------------------------------------------------------ *
 * 6. Synthetic row generation — realistic mess so the validator has work to do
 * ------------------------------------------------------------------ */
export const SOURCE_HEADERS = [
  "Order Ref",        // → order_reference_id
  "Customer Mobile",  // → user_phone_number
  "Order Type",       // → order_category
  "Delivery Mode",    // → delivery_type
  "Pickup Addr",      // → pickup_address
  "PU Phone",         // → pickup_contact_number
  "Drop Addr",        // → drop_address
  "DO Phone",         // → drop_contact_number
  "Weight (kg)",      // → weight
  "Start Time",       // → window_start_time
  "End Time",         // → window_end_time
  "Placed On",        // → date
  "Pmt Status",       // → payment_status
];

const CATS = ["Pickup", "Drop", "Pickup & Drop", "1", "2", "3"];
const DELIV = ["Standard", "Express", "std", "exp"];
const PMT = ["Pending", "Paid", "Failed", "0", "1", "2"];
const rand = (n) => Math.floor(Math.random() * n);
const pad = (n, len) => String(n).padStart(len, "0");

function phone(valid = true) {
  if (!valid) return "98765"; // too short
  const cc = Math.random() < 0.5 ? "+91" : "";
  return `${cc}${9}${Array.from({ length: 9 }, () => rand(10)).join("")}`;
}

function dateValue(i) {
  const roll = Math.random();
  if (roll < 0.15) return 45000 + rand(500);                       // Excel serial
  if (roll < 0.35) return `${pad(1 + rand(28), 2)}/${pad(1 + rand(12), 2)}/2026`; // dd/mm/yyyy
  if (roll < 0.4) return `31/02/2026`;                             // invalid (bad day)
  if (roll < 0.55) return `2026-${pad(1 + rand(12), 2)}-${pad(1 + rand(28), 2)}`; // ISO
  return new Date(Date.now() - rand(1e10)).toISOString().slice(0, 10);
}

function timeValue() {
  const roll = Math.random();
  if (roll < 0.15) return (rand(24) * 60 + rand(60)) / 1440; // Excel fraction
  if (roll < 0.25) return `${pad(rand(24), 2)}:${pad(rand(60), 2)}:00`; // HH:mm:ss
  return `${pad(rand(24), 2)}:${pad(rand(60), 2)}`;
}

/**
 * Build one synthetic source row (array aligned to SOURCE_HEADERS).
 * `corruptRate` controls how often a deliberate error is injected, so the
 * category-dependent validator has realistic failures to catch.
 */
export function makeRow(i, corruptRate = 0.05) {
  const catRaw = CATS[rand(CATS.length)];
  const catNum = orderCategoryMap[normalizeValue(catRaw)];
  const bad = Math.random() < corruptRate;
  const badKind = bad ? rand(4) : -1;

  const orderId = badKind === 0 ? "" : `ORD-${pad(i, 6)}`; // missing required id
  const custPhone = badKind === 1 ? phone(false) : phone(true);

  // category-dependent fields
  const isPickup = catNum === 1 || catNum === 3;
  const isDrop = catNum === 2 || catNum === 3;

  // sometimes drop a category-required field (badKind 2 = missing pickup addr, 3 = missing drop phone)
  const pickupAddr = isPickup ? (badKind === 2 ? "" : `Sector ${1 + rand(120)}, Gurgaon`) : "";
  const pickupPhone = isPickup ? phone(true) : "";
  const dropAddr = isDrop ? `Block ${String.fromCharCode(65 + rand(6))}, Delhi` : "";
  const dropPhone = isDrop ? (badKind === 3 ? phone(false) : phone(true)) : "";

  const weight = Math.random() < 0.03 ? "heavy" : (1 + rand(40)).toString();

  return [
    orderId,
    custPhone,
    catRaw,
    DELIV[rand(DELIV.length)],
    pickupAddr,
    pickupPhone,
    dropAddr,
    dropPhone,
    weight,
    timeValue(),
    timeValue(),
    dateValue(i),
    PMT[rand(PMT.length)],
  ];
}

/* ------------------------------------------------------------------ *
 * 7. Row validation  (the real category-dependent rules from validatePreviewData)
 * ------------------------------------------------------------------ */
export function validateRow(rowArr, mapping) {
  // resolve mapped values by schema key
  const get = (key) => {
    const idx = SOURCE_HEADERS.findIndex((h) => mapping[h] === key);
    return idx === -1 ? "" : rowArr[idx];
  };

  const rawCat = get("order_category");
  const category = orderCategoryMap[normalizeValue(rawCat)];

  // (a) restricted enum fields must be valid if present
  for (const key of ["order_category", "delivery_type", "payment_status"]) {
    const v = get(key);
    if (v !== "" && !isValidFieldValue(key, v)) {
      return { field: key, reason: `invalid ${key.replace(/_/g, " ")}: "${v}"` };
    }
  }

  // (b) always-required
  if (!get("order_reference_id")) return { field: "order_reference_id", reason: "missing reference id" };
  const userPhone = get("user_phone_number");
  if (!userPhone) return { field: "user_phone_number", reason: "missing phone" };
  if (!isValidPhone(userPhone)) return { field: "user_phone_number", reason: `invalid phone: "${userPhone}"` };

  // (c) numeric weight if present
  const weight = get("weight");
  if (weight !== "" && isNaN(Number(weight))) return { field: "weight", reason: `weight not a number: "${weight}"` };

  // (d) time fields valid HH:mm if present
  for (const key of ["window_start_time", "window_end_time"]) {
    const v = get(key);
    if (v !== "" && !/^\d{2}:\d{2}$/.test(normalizeTimeValue(v))) {
      return { field: key, reason: `bad time: "${v}"` };
    }
  }

  // (e) date must normalize to a real date
  const date = get("date");
  if (date !== "") {
    const norm = normalizeDateValue(date);
    if (norm === "__INVALID__" || !/^\d{4}-\d{2}-\d{2}$/.test(norm)) {
      return { field: "date", reason: `unparseable date: "${date}"` };
    }
  }

  // (f) CATEGORY-DEPENDENT requireds — the real business rule
  if (category === 1 || category === 3) {
    if (!get("pickup_address")) return { field: "pickup_address", reason: "pickup address required for pickup" };
    const pp = get("pickup_contact_number");
    if (pp && !isValidPhone(pp)) return { field: "pickup_contact_number", reason: `invalid pickup phone: "${pp}"` };
  }
  if (category === 2 || category === 3) {
    if (!get("drop_address")) return { field: "drop_address", reason: "drop address required for drop" };
    const dp = get("drop_contact_number");
    if (dp && !isValidPhone(dp)) return { field: "drop_contact_number", reason: `invalid drop phone: "${dp}"` };
  }

  return null; // valid
}

/* ------------------------------------------------------------------ *
 * 8. CSV helpers — parse an uploaded file, serialize, generate a sample
 *    A small RFC-4180-ish parser: handles quoted fields, escaped quotes
 *    ("") and commas/newlines inside quotes. Good enough for real files
 *    without pulling in a dependency.
 * ------------------------------------------------------------------ */

// Parse CSV text into { headers: string[], rows: string[][] }.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  // strip a UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignore, handle \r\n */ }
      else field += c;
    }
  }
  // flush last field/row if the file didn't end with a newline
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  // drop fully-empty trailing rows
  const cleaned = rows.filter((r) => r.some((v) => v !== ""));
  if (cleaned.length === 0) return { headers: [], rows: [] };

  const [headers, ...data] = cleaned;
  return { headers: headers.map((h) => h.trim()), rows: data };
}

// Escape a single CSV cell (quote it if it contains comma/quote/newline).
function csvCell(val) {
  const s = val == null ? "" : String(val);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Serialize headers + rows back into a CSV string.
export function toCSV(headers, rows) {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) lines.push(r.map(csvCell).join(","));
  return lines.join("\n");
}

// Build a downloadable sample file: the messy SOURCE_HEADERS + N synthetic
// rows (with the same ~5% deliberate errors), so users see the exact format
// the importer expects — and can upload it straight back to try validation.
//
// Note: Excel *serials* and time *fractions* only exist inside .xlsx binaries,
// never in an exported CSV — so for the CSV sample we render those columns as
// human-readable strings (dates + HH:mm), keeping the deliberate errors.
export function makeSampleCSV(n = 50) {
  const dateIdx = SOURCE_HEADERS.indexOf("Placed On");
  const startIdx = SOURCE_HEADERS.indexOf("Start Time");
  const endIdx = SOURCE_HEADERS.indexOf("End Time");
  const p2 = (x) => String(x).padStart(2, "0");
  const cleanTime = () => `${p2(Math.floor(Math.random() * 24))}:${p2(Math.floor(Math.random() * 60))}`;

  const rows = Array.from({ length: n }, (_, i) => {
    const r = makeRow(i, 0.05);
    // replace any Excel-internal numeric time fraction with a clean HH:mm
    if (typeof r[startIdx] === "number") r[startIdx] = cleanTime();
    if (typeof r[endIdx] === "number") r[endIdx] = cleanTime();
    // replace an Excel date serial with an ISO date string (keep bad-date errors as-is)
    if (typeof r[dateIdx] === "number") {
      const d = new Date(Date.now() - Math.floor(Math.random() * 1e10));
      r[dateIdx] = d.toISOString().slice(0, 10);
    }
    return r;
  });
  return toCSV(SOURCE_HEADERS, rows);
}
