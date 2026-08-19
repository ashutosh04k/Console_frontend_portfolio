import { useEffect, useRef, useState } from "react";
import "./TrackingDemo.css";

// A handful of vehicles that move around a stylized map area.
// Simulates the "live map updates over WebSockets" tracking UI.
const VEHICLE_NAMES = ["DL-01-AA", "DL-04-BX", "HR-26-KK", "UP-16-Q2", "DL-09-MM"];

function seedVehicles() {
  return VEHICLE_NAMES.map((id, i) => ({
    id,
    x: 15 + Math.random() * 70,
    y: 15 + Math.random() * 70,
    heading: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.5,
    status: "moving",
  }));
}

export default function TrackingDemo() {
  const [vehicles, setVehicles] = useState(seedVehicles);
  const [feed, setFeed] = useState([]);
  const [connected, setConnected] = useState(true);
  const tick = useRef(0);

  useEffect(() => {
    if (!connected) return;
    const iv = setInterval(() => {
      tick.current++;
      setVehicles((prev) =>
        prev.map((v) => {
          // occasionally change heading or stop, like real movement
          let { x, y, heading, speed, status } = v;
          if (Math.random() < 0.08) heading += (Math.random() - 0.5) * 1.2;
          if (Math.random() < 0.03) status = status === "moving" ? "idle" : "moving";

          const s = status === "moving" ? speed : 0;
          x += Math.cos(heading) * s;
          y += Math.sin(heading) * s;

          // bounce off edges
          if (x < 8 || x > 92) { heading = Math.PI - heading; x = Math.max(8, Math.min(92, x)); }
          if (y < 8 || y > 92) { heading = -heading; y = Math.max(8, Math.min(92, y)); }

          return { ...v, x, y, heading, status };
        })
      );

      // emit an event to the feed every few ticks
      if (tick.current % 3 === 0) {
        const v = VEHICLE_NAMES[Math.floor(Math.random() * VEHICLE_NAMES.length)];
        const events = [
          `${v} · location updated`,
          `${v} · speed ${Math.floor(20 + Math.random() * 40)} km/h`,
          `${v} · entered zone ${Math.floor(1 + Math.random() * 6)}`,
          `${v} · heartbeat ack`,
        ];
        const msg = events[Math.floor(Math.random() * events.length)];
        setFeed((f) => [{ t: Date.now(), msg }, ...f.slice(0, 6)]);
      }
    }, 700);
    return () => clearInterval(iv);
  }, [connected]);

  return (
    <div className="tracking">
      <div className="tracking-map-wrap">
        <div className="tk-status mono">
          <span className={`dot ${connected ? "" : "off"}`} />
          {connected ? "socket · connected" : "socket · disconnected"}
          <button className="tk-toggle" onClick={() => setConnected((c) => !c)}>
            {connected ? "disconnect" : "reconnect"}
          </button>
        </div>

        <svg viewBox="0 0 100 100" className="tk-map" preserveAspectRatio="none">
          {/* grid streets */}
          {[20, 40, 60, 80].map((p) => (
            <g key={p}>
              <line x1={p} y1="0" x2={p} y2="100" className="tk-street" />
              <line x1="0" y1={p} x2="100" y2={p} className="tk-street" />
            </g>
          ))}
          {/* vehicles */}
          {vehicles.map((v) => (
            <g key={v.id} transform={`translate(${v.x} ${v.y})`}>
              <circle r="2.4" className={`tk-veh ${v.status}`} />
              <circle r="4.5" className="tk-veh-ping" />
            </g>
          ))}
        </svg>
      </div>

      <div className="tracking-side">
        <div className="tk-list-head mono">vehicles · {vehicles.length}</div>
        <div className="tk-vehicles mono">
          {vehicles.map((v) => (
            <div className="tk-vrow" key={v.id}>
              <span className={`tk-vdot ${v.status}`} />
              <span className="tk-vid">{v.id}</span>
              <span className={`tk-vstatus ${v.status}`}>{v.status}</span>
            </div>
          ))}
        </div>
        <div className="tk-feed-head mono">live event feed</div>
        <div className="tk-feed mono">
          {feed.length === 0 ? (
            <span className="tk-feed-empty">// awaiting socket messages…</span>
          ) : (
            feed.map((e) => (
              <div className="tk-event" key={e.t}>
                <span className="tk-event-time">
                  {new Date(e.t).toLocaleTimeString([], { hour12: false })}
                </span>
                {e.msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
