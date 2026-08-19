import { useState, useMemo, useRef, useLayoutEffect } from "react";
import "./ChatConsole.css";

/**
 * SupportChats + ChatService (dummy) — a self-contained clean-room replica of a
 * live support-chat console and its shared message renderer. Keeps the real
 * client-side logic, runs on synthetic data, NO backend.
 *
 * Faithful logic:
 *   • ChatService bubble renderer — left/right alignment by chatContext
 *     (ADMIN_USER / ADMIN_DRIVER / DRIVER_USER), grey vs blue bubbles, avatar,
 *     sender name, utc_offset-adjusted timestamps
 *   • date grouping with "Today" separators
 *   • smart auto-scroll — jumps to bottom on load / chat switch, but on a NEW
 *     incoming message only scrolls if the user is already near the bottom
 *   • driver/user tabs with counts, searchable chat list, 3-column layout
 *   • admin sends as sender_type 3; quick-reply chips above the input
 *   • utc_offset timezone handling (Number()-wrapped)
 *
 * Removed (backend/library-bound): chatUrl/serverUrl endpoints, real 2s polling,
 * react-to-pdf export, URL deep-linking, and the read-only UserLogs audit viewer
 * (same renderer minus sending). A simulated reply stands in for live polling.
 *
 * Fixed on purpose (bugs noted in the source, corrected here so the demo shows
 * the logic working): the "Today" separator actually matches today; utcOffset is
 * numeric; no dead code / NaN ratings.
 *
 * Drop-in: React only, inline styles, no external libs.
 */

/* ============================ constants ============================ */

// who the admin is talking to — drives bubble alignment (as in the real ChatService)
export const CONTEXT = { ADMIN_USER: "ADMIN_USER", ADMIN_DRIVER: "ADMIN_DRIVER", DRIVER_USER: "DRIVER_USER" };
// sender_type codes from the real payload
export const SENDER = { USER: 1, DRIVER: 2, ADMIN: 3 };

const UTC_OFFSET = 330; // minutes (+5:30) — Number(), not a string

const QUICK_REPLIES = [
  "Thanks for reaching out — looking into it now.",
  "Can you share your order ID?",
  "A driver has been assigned to you.",
  "Sorry for the delay. We're on it.",
  "Is there anything else I can help with?",
];

/* ============================ pure logic ============================ */

// minutes-of-day -> "h:mm AM/PM", after applying the utc_offset (stored UTC → local)
export function fmtTime(utcMs, offsetMin = UTC_OFFSET) {
  const d = new Date(utcMs + offsetMin * 60000);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

// local YYYY-MM-DD for a UTC ms, honoring the offset
export function localDateKey(utcMs, offsetMin = UTC_OFFSET) {
  return new Date(utcMs + offsetMin * 60000).toISOString().slice(0, 10);
}

// The date-separator label. FIXED vs the source: compare like-for-like date keys
// so "Today" actually matches today (the real code compared a YYYY-MM-DD string
// against Date.toDateString(), which never matched).
export function dateSeparatorLabel(utcMs, offsetMin = UTC_OFFSET) {
  const key = localDateKey(utcMs, offsetMin);
  const todayKey = localDateKey(Date.now(), offsetMin);
  const yestKey = localDateKey(Date.now() - 86400000, offsetMin);
  if (key === todayKey) return "Today";
  if (key === yestKey) return "Yesterday";
  return new Date(utcMs + offsetMin * 60000).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Group an ordered message list into [{ label, messages: [...] }] by local date.
export function groupByDate(messages, offsetMin = UTC_OFFSET) {
  const groups = [];
  let curKey = null;
  for (const msg of messages) {
    const key = localDateKey(msg.ts, offsetMin);
    if (key !== curKey) {
      groups.push({ key, label: dateSeparatorLabel(msg.ts, offsetMin), messages: [] });
      curKey = key;
    }
    groups[groups.length - 1].messages.push(msg);
  }
  return groups;
}

// Which side does a message sit on, given the chat context and the admin's view?
// In the admin console, the ADMIN is always on the right; the other party left.
export function isRightSide(msg, context) {
  if (context === CONTEXT.ADMIN_USER || context === CONTEXT.ADMIN_DRIVER) {
    return msg.sender_type === SENDER.ADMIN;
  }
  // DRIVER_USER (audit view): driver on the right, user on the left
  return msg.sender_type === SENDER.DRIVER;
}

/* ============================ synthetic seed ============================ */

const now = Date.now();
const min = (n) => n * 60000;

// two support queues: drivers and users
function seedChats() {
  return {
    driver: [
      {
        id: "ENG-4471", name: "Rohit Sharma", phone: "+91 98•• ••3210", role: "Driver",
        status: "on trip", unread: 2,
        messages: [
          { id: 1, sender_type: SENDER.DRIVER, name: "Rohit Sharma", text: "Hi, the pickup address seems wrong.", ts: now - min(140) },
          { id: 2, sender_type: SENDER.ADMIN, name: "Support", text: "Hi Rohit — let me check the order.", ts: now - min(138) },
          { id: 3, sender_type: SENDER.DRIVER, name: "Rohit Sharma", text: "Customer isn't answering calls either.", ts: now - min(9) },
          { id: 4, sender_type: SENDER.DRIVER, name: "Rohit Sharma", text: "What should I do?", ts: now - min(8) },
        ],
      },
      {
        id: "ENG-4460", name: "Aisha Khan", phone: "+91 99•• ••7745", role: "Driver",
        status: "idle", unread: 0,
        messages: [
          { id: 1, sender_type: SENDER.DRIVER, name: "Aisha Khan", text: "App logged me out mid-shift.", ts: now - min(400) },
          { id: 2, sender_type: SENDER.ADMIN, name: "Support", text: "Please reinstall and log in again — should be fixed now.", ts: now - min(395) },
          { id: 3, sender_type: SENDER.DRIVER, name: "Aisha Khan", text: "Working now, thanks!", ts: now - min(390) },
        ],
      },
      {
        id: "ENG-4402", name: "Omar Farooq", phone: "+971 5•• ••1198", role: "Driver",
        status: "offline", unread: 0,
        messages: [
          { id: 1, sender_type: SENDER.DRIVER, name: "Omar Farooq", text: "How do I update my bank details?", ts: now - min(1500) },
          { id: 2, sender_type: SENDER.ADMIN, name: "Support", text: "Settings → Payouts → Edit. Let me know if it doesn't save.", ts: now - min(1495) },
        ],
      },
    ],
    user: [
      {
        id: "ENG-9920", name: "Priya Nair", phone: "+91 90•• ••2231", role: "Rider",
        status: "waiting", unread: 1,
        messages: [
          { id: 1, sender_type: SENDER.USER, name: "Priya Nair", text: "My order is 40 minutes late.", ts: now - min(20) },
          { id: 2, sender_type: SENDER.ADMIN, name: "Support", text: "Apologies Priya — checking with the driver now.", ts: now - min(18) },
          { id: 3, sender_type: SENDER.USER, name: "Priya Nair", text: "Okay, please hurry.", ts: now - min(6) },
        ],
      },
      {
        id: "ENG-9902", name: "Jack Turner", phone: "+44 77•• ••4423", role: "Rider",
        status: "resolved", unread: 0,
        messages: [
          { id: 1, sender_type: SENDER.USER, name: "Jack Turner", text: "Charged twice for one ride.", ts: now - min(2800) },
          { id: 2, sender_type: SENDER.ADMIN, name: "Support", text: "Refund issued — 3–5 business days.", ts: now - min(2790) },
          { id: 3, sender_type: SENDER.USER, name: "Jack Turner", text: "Got it, thank you!", ts: now - min(2788) },
        ],
      },
    ],
  };
}

// canned "incoming" replies for the simulated-polling button, per queue
const SIM_REPLIES = {
  driver: ["Okay, waiting for your reply.", "Should I cancel the order?", "Got it, thanks."],
  user: ["Any update?", "Thank you!", "Still waiting…"],
};

/* ============================ palette ============================ */
const C = {
  bg: "#10141d", panel: "#171c28", line: "#232a3b", ink: "#0b0e14",
  fg: "#e4e7ef", dim: "#8b93a7", run: "#4af626", runDim: "#2fa617",
  amber: "#ffb454", violet: "#a78bfa", rose: "#f472b6", blue: "#3b82f6",
  mono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
};

/* ============================ ChatService (renderer) ============================ */
function ChatService({ chat, context, quickReplies, onQuickReply }) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const prevChatId = useRef(null);
  const prevCount = useRef(0);

  const groups = useMemo(() => groupByDate(chat.messages), [chat.messages]);

  // smart auto-scroll
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const switched = prevChatId.current !== chat.id;
    const grew = chat.messages.length > prevCount.current;

    if (switched) {
      // jump to bottom on first load / chat switch
      el.scrollTop = el.scrollHeight;
    } else if (grew) {
      // new message: only scroll if the user was already near the bottom
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }

    prevChatId.current = chat.id;
    prevCount.current = chat.messages.length;
  }, [chat.id, chat.messages.length]);

  return (
    <div className="cd-thread-wrap">
      <div className="cd-thread" ref={scrollRef}>
        {groups.map((g) => (
          <div key={g.key}>
            <div className="cd-datesep">
              <span>{g.label}</span>
            </div>
            {g.messages.map((m) => {
              const right = isRightSide(m, context);
              return (
                <div key={m.id} className={`cd-row ${right ? "right" : "left"}`}>
                  {!right && <div className="cd-avatar" style={{ background: C.line }}>{m.name?.[0]}</div>}
                  <div className={`cd-bubble ${right ? "me" : "them"}`}>
                    {!right && <div className="cd-sender">{m.name}</div>}
                    <div className="cd-text">{m.text}</div>
                    <div className="cd-time">{fmtTime(m.ts)}</div>
                  </div>
                  {right && <div className="cd-avatar me" style={{ background: C.runDim }}>S</div>}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* quick-reply chips — only present in the live console */}
      {quickReplies?.length > 0 && (
        <div className="cd-quick">
          {quickReplies.map((q, i) => (
            <button key={i} className="cd-chip" onClick={() => onQuickReply(q)} title={q}>
              {q.length > 34 ? q.slice(0, 32) + "…" : q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ the console ============================ */
export default function ChatDemo() {
  const [chats, setChats] = useState(seedChats);
  const [tab, setTab] = useState("driver"); // driver | user
  const [activeId, setActiveId] = useState("ENG-4471");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [showQuick, setShowQuick] = useState(true);

  const list = chats[tab];
  const active = list.find((c) => c.id === activeId) || list[0];
  const context = tab === "driver" ? CONTEXT.ADMIN_DRIVER : CONTEXT.ADMIN_USER;

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [list, search]);

  const switchTab = (t) => {
    setTab(t);
    setActiveId(chats[t][0].id);
    setSearch("");
  };

  // admin sends as sender_type 3, then (in the real app) re-fetches
  const send = (text) => {
    const body = text.trim();
    if (!body || !active) return;
    setChats((prev) => {
      const next = { ...prev };
      next[tab] = next[tab].map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, { id: c.messages.length + 1, sender_type: SENDER.ADMIN, name: "Support", text: body, ts: Date.now() }] }
          : c
      );
      return next;
    });
    setDraft("");
  };

  // simulate the live-polling effect: an incoming reply arrives from the other party
  const simulateIncoming = () => {
    if (!active) return;
    const pool = SIM_REPLIES[tab];
    const text = pool[Math.floor(Math.random() * pool.length)];
    const senderType = tab === "driver" ? SENDER.DRIVER : SENDER.USER;
    setChats((prev) => {
      const next = { ...prev };
      next[tab] = next[tab].map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, { id: c.messages.length + 1, sender_type: senderType, name: c.name, text, ts: Date.now() }] }
          : c
      );
      return next;
    });
  };

  const counts = { driver: chats.driver.length, user: chats.user.length };

  return (
    <div className="cd" style={{ fontFamily: C.mono, color: C.fg }}>
      {/* driver/user tabs */}
      <div className="cd-tabs">
        {["driver", "user"].map((t) => (
          <button key={t} className={`cd-tab ${tab === t ? "on" : ""}`} onClick={() => switchTab(t)}>
            {t === "driver" ? "Driver support" : "User support"}
            <span className="cd-tabcount">{counts[t]}</span>
          </button>
        ))}
        <div className="cd-poll-note mono">live · polls every 2s</div>
      </div>

      {/* 3-column layout */}
      <div className="cd-grid">
        {/* left: chat list */}
        <div className="cd-list">
          <input
            className="cd-search mono"
            placeholder="search name / engagement id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="cd-list-scroll">
            {filtered.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  className={`cd-listitem ${c.id === active?.id ? "on" : ""}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <div className="cd-avatar" style={{ background: C.line }}>{c.name[0]}</div>
                  <div className="cd-li-body">
                    <div className="cd-li-top">
                      <span className="cd-li-name">{c.name}</span>
                      <span className="cd-li-time">{fmtTime(last.ts)}</span>
                    </div>
                    <div className="cd-li-bottom">
                      <span className="cd-li-preview">{last.text}</span>
                      {c.unread > 0 && <span className="cd-unread">{c.unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <div className="cd-empty mono">no chats match</div>}
          </div>
        </div>

        {/* middle: active conversation */}
        <div className="cd-conv">
          <div className="cd-conv-head">
            <div className="cd-avatar" style={{ background: C.line }}>{active?.name[0]}</div>
            <div className="cd-conv-meta">
              <div className="cd-conv-name">{active?.name} <span className="cd-conv-role">· {active?.role}</span></div>
              <div className="cd-conv-sub mono">{active?.id} · {active?.phone} · <span className="cd-status">{active?.status}</span></div>
            </div>
            <button className="cd-simbtn mono" onClick={simulateIncoming} title="Simulate an incoming reply (stands in for 2s polling)">
              ⚡ simulate reply
            </button>
          </div>

          <ChatService
            chat={active}
            context={context}
            quickReplies={showQuick ? QUICK_REPLIES : []}
            onQuickReply={(q) => send(q)}
          />

          <div className="cd-composer">
            <input
              className="cd-input mono"
              placeholder={`Message ${active?.name}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(draft); }}
            />
            <button className="cd-send" onClick={() => send(draft)} disabled={!draft.trim()}>send</button>
          </div>
        </div>

        {/* right: details panel (driver/user card active; trip/vehicle/payment are mock in the real app) */}
        <div className="cd-details">
          <div className="cd-details-head mono">details</div>
          <div className="cd-card">
            <div className="cd-avatar lg" style={{ background: C.line }}>{active?.name[0]}</div>
            <div className="cd-card-name">{active?.name}</div>
            <div className="cd-card-role mono">{active?.role}</div>
            <div className="cd-kv mono"><span>engagement</span><b>{active?.id}</b></div>
            <div className="cd-kv mono"><span>phone</span><b>{active?.phone}</b></div>
            <div className="cd-kv mono"><span>status</span><b className="cd-status">{active?.status}</b></div>
          </div>
          <div className="cd-mock mono">
            trip · vehicle · payment
            <span>disabled in demo (mock in source)</span>
          </div>
        </div>
      </div>
    </div>
  );
}