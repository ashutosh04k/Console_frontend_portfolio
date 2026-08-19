/**
 * Builds the srcDoc for the playground's preview iframe.
 *
 * Safety: the iframe is rendered with sandbox="allow-scripts" only —
 * NOT allow-same-origin — so user JS cannot touch the parent page,
 * cookies, or localStorage. It's a throwaway origin.
 *
 * We also inject a small shim that forwards console.log / errors up to
 * the parent via postMessage, so the playground can show a console pane.
 */
export function buildSrcDoc({ html, css, js }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; font-family: system-ui, sans-serif; color: #0b0e14; background: #fff; }
      ${css || ""}
    </style>
  </head>
  <body>
    ${html || ""}
    <script>
      // forward console + errors to the parent playground
      (function () {
        const send = (level, args) => {
          try {
            parent.postMessage({
              __playground: true,
              level,
              text: args.map(a => {
                try { return typeof a === "object" ? JSON.stringify(a) : String(a); }
                catch { return String(a); }
              }).join(" ")
            }, "*");
          } catch (e) {}
        };
        ["log", "warn", "error", "info"].forEach((level) => {
          const orig = console[level];
          console[level] = (...args) => { send(level, args); orig && orig.apply(console, args); };
        });
        window.addEventListener("error", (e) => send("error", [e.message]));
        window.addEventListener("unhandledrejection", (e) =>
          send("error", ["Unhandled promise rejection: " + (e.reason && e.reason.message || e.reason)])
        );
      })();
    <\/script>
    <script>
      try {
        ${js || ""}
      } catch (err) {
        console.error(err.message);
      }
    <\/script>
  </body>
</html>`;
}
