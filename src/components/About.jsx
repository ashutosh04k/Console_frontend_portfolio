import "./About.css";
import Aboutimage from "../../public/shots/2.jpeg";
/**
 * About page — same structure/tone as the reference (ABOUT / THE WORK /
 * HOW I THINK / STILL LEARNING / Get in touch, with a left-rail of fact cards),
 * but written about Ashutosh Kumar from his résumé + the systems he's built.
 *
 * Fill in the two contact links marked TODO with your real email / LinkedIn.
 */

const FACTS = [
  { label: "CURRENT", value: "Associate SW Developer · Togopool" },
  { label: "EDUCATION", value: "B.Tech C.S.E · J.I.E.T Jodhpur" },
  { label: "LOCATION", value: "Gurgaon, India" },
];

// TODO: replace with your real links
const EMAIL = "kumarasutosh2014@gmail.com";
const LINKEDIN = "https://www.linkedin.com/in/ashutosh-kumar-sde";

export default function About() {
  return (
    <section id="about" className="ab">
      <div className="wrap ab-top">
        <p className="eyebrow">about</p>
        <h1 className="ab-headline">
          I'm Ashutosh — a frontend engineer drawn to the features most
          people call <span className="ab-hl">too complex for the browser</span>.
        </h1>
      </div>

      <div className="wrap ab-body">
        {/* left rail: portrait + fact cards */}
        <aside className="ab-rail">
          <figure className="ab-photo card">
            {/* Drop your photo at client/public/portrait.jpg (or change the src).
                If the image is missing, the initials fallback shows instead. */}
            <img
              src={Aboutimage}
              alt="Ashutosh Kumar"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "grid";
              }}
            />
            <div className="ab-photo-fallback" aria-hidden>AK</div>
          </figure>

          {FACTS.map((f) => (
            <div className="ab-fact card" key={f.label}>
              <span className="ab-fact-label mono">{f.label}</span>
              <span className="ab-fact-value">{f.value}</span>
            </div>
          ))}
        </aside>

        {/* right: prose */}
        <div className="ab-prose">
          <p className="ab-kicker mono">the work</p>
          <p>
            I'm an Associate Software Developer at Togopool, a mobility SaaS
            platform, where I build the parts of the frontend that don't fit
            neatly into a tutorial: live maps updating over WebSockets, a
            two-way support console, payment flows, and an import tool that has
            to swallow a hundred thousand rows without freezing the tab.
          </p>
          <p>
            My first instinct with any feature is to ask what happens at the
            edges. What does the import do when a file has five different date
            formats and half the headers are misspelled? What does the shift
            scheduler do when a shift crosses midnight, in a city three
            timezones away? What does the chat do when a reply arrives while the
            user is scrolled halfway up the thread? The interesting work lives in
            those questions.
          </p>

          <p className="ab-statement">
            The hard part of frontend isn't the pixels — it's the state.
          </p>

          <p>
            So I lean into the messy, stateful features: a column-mapping
            importer that fuzzy-matches arbitrary headers to a 40-field schema
            and validates 100k+ rows before a single write; real-time tracking
            and chat built on raw WebSocket connections; a tab-level permissions
            system where the encoding, the locked default role, and the masking
            rules all have to be exactly right. I also care about the
            unglamorous half — accessibility, bundle size, render performance —
            because a feature that's correct but janky still feels broken.
          </p>
          <p>
            Before Togopool I built pixel-accurate React interfaces at 100acress,
            cut load time 45% with virtualization and memoization, trimmed the
            main bundle 20% with code-splitting, and set up the CI/CD that
            replaced manual releases. Earlier, as an intern at TawglUp, I built
            my first real-time systems — interview chat and live notifications
            over WebSockets.
          </p>

          <p className="ab-statement">
            Because a UI that quietly shows the wrong number is worse than one
            that crashes.
          </p>

          <p className="ab-kicker mono" style={{ marginTop: "2.5rem" }}>how i think</p>
          <p>
            I care about architecture — but I don't believe good structure comes
            from predicting everything up front. You build with what you know,
            you ship it, and production shows you the parts you couldn't have
            guessed.
          </p>
          <p className="ab-verse">
            You design with what you know.<br />
            You ship.<br />
            Production teaches you the rest.<br />
            And then you go back and make it simpler.
          </p>
          <p>
            After the deadline passes and the pressure lifts, I like to revisit
            what I built and ask:
          </p>
          <ul className="ab-list">
            <li>Could this component have been simpler?</li>
            <li>What state am I duplicating that should have one source?</li>
            <li>What happens on a slow network, or a huge dataset?</li>
            <li>Where did I paper over a bug instead of fixing it?</li>
            <li>What would I build differently if I started again today?</li>
          </ul>
          <p>
            What I learn to notice after shipping becomes what I notice before
            building the next thing.
          </p>
          <p className="ab-statement">Hindsight slowly becomes instinct.</p>

          <p className="ab-kicker mono" style={{ marginTop: "2.5rem" }}>still learning</p>
          <p>
            I hold a B.Sc in Computer Science from J.I.E.T, Jodhpur. Right now
            I'm going deeper into frontend architecture and the backend side of
            the stack — state management at scale, real-time systems, and the
            trade-offs that only get interesting once real users and real data
            hit the code.
          </p>
          <p>
            The live demos on this site are where I show that in public: the
            actual logic from features I've shipped, rebuilt so you can use them
            right in the browser — not screenshots, but the real thing running.
          </p>
          <p className="ab-verse">
            I'm still learning.<br />
            Still deleting code I used to be proud of.<br />
            Still trying to make the next thing harder to break than the last.
          </p>

          <p className="ab-kicker mono" style={{ marginTop: "2.5rem" }}>get in touch</p>
          <p>
            The best way to reach me is by{" "}
            <a href={`mailto:${EMAIL}`}>Email</a>, or connect with me on{" "}
            <a href={LINKEDIN} target="_blank" rel="noreferrer">LinkedIn</a>.
          </p>
          <div className="ab-cta">
            <a className="btn btn-run" href="/systems">▶ Try the live demos</a>
            <a className="btn" href="/experience">View experience</a>
          </div>
        </div>
      </div>
    </section>
  );
}