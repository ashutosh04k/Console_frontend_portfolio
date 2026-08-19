import { useState, useRef } from "react";
import "./ShotGallery.css";

/**
 * ShotGallery — a horizontal scroll strip of screenshots with a click-to-enlarge
 * lightbox. `shots` accepts a string, an array of strings, or an array of
 * { src, caption } objects.
 */
export default function ShotGallery({ shots, title = "" }) {
  const [open, setOpen] = useState(null); // index of enlarged shot, or null
  const stripRef = useRef(null);

  // normalize: string | string[] | {src,caption}[]  ->  {src,caption}[]
  const items = (Array.isArray(shots) ? shots : [shots])
    .map((s) => (typeof s === "string" ? { src: s } : s))
    .filter((s) => s && s.src);

  if (items.length === 0) return null;
  const single = items.length === 1;

  const scrollByCards = (dir) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: "smooth" });
  };

  const handleWheel = (e) => {
    const el = stripRef.current;
    if (!el || single) return;
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="sg">
      <div className="sg-head">
        <span className="sg-dot" /> From the real product
        {!single && <span className="sg-count">· {items.length} screenshots · scroll →</span>}
      </div>

      <div className="sg-viewport">
        <div className={`sg-strip ${single ? "single" : ""}`} ref={stripRef} onWheel={handleWheel}>
          {items.map((s, i) => (
            <figure className="sg-shot" key={i} onClick={() => setOpen(i)}>
              <img src={s.src} alt={s.caption || `${title} screenshot`} loading="lazy" />
              {s.caption && <figcaption>{s.caption}</figcaption>}
              <span className="sg-zoom">⤢ enlarge</span>
            </figure>
          ))}
        </div>

        {!single && (
          <>
            <button className="sg-arrow left" onClick={() => scrollByCards(-1)} aria-label="Scroll left">‹</button>
            <button className="sg-arrow right" onClick={() => scrollByCards(1)} aria-label="Scroll right">›</button>
          </>
        )}
      </div>

      {open !== null && (
        <div className="sg-lightbox" onClick={() => setOpen(null)}>
          <button className="sg-lb-close" onClick={() => setOpen(null)} aria-label="Close">×</button>
          {!single && (
            <button
              className="sg-lb-nav prev"
              onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + items.length) % items.length); }}
              aria-label="Previous"
            >‹</button>
          )}
          <figure className="sg-lb-fig" onClick={(e) => e.stopPropagation()}>
            <img src={items[open].src} alt={items[open].caption || title} />
            {items[open].caption && <figcaption>{items[open].caption}</figcaption>}
          </figure>
          {!single && (
            <button
              className="sg-lb-nav next"
              onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % items.length); }}
              aria-label="Next"
            >›</button>
          )}
        </div>
      )}
    </div>
  );
}