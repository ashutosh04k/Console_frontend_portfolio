// Footer.jsx
import { Link } from "react-router-dom";
import "./Footer.css";
import { CONTACT } from "../lib/data";
const NAV = [
  ["/", "Home"],
  ["/experience", "Experience"],
  ["/systems", "Architecture Lab"],
  ["/skills", "Skills"],
];

const NAV_2 = [
  ["/about", "About"],
  ["/projects", "Projects"],
  ["/playground", "Playground"],
  ["/contact", "Contact"],
];

const SOCIAL = [
  [CONTACT.github, "GitHub"],
  [CONTACT.linkedin, "LinkedIn"],
  [`mailto:${CONTACT.email}`, "Email"],
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner mono">
        <div className="footer-brand">
          <Link to="/" className="footer-name">Ashutosh Kumar</Link>
          <p className="footer-tag">Full-Stack engineer — distributed systems, Logical thinking, mobility.</p>
        </div>

        <nav className="footer-cols">
          <ul className="footer-col">
            {NAV.map(([path, label]) => (
              <li key={path}><Link to={path}>{label}</Link></li>
            ))}
          </ul>
          <ul className="footer-col">
            {NAV_2.map(([path, label]) => (
              <li key={path}><Link to={path}>{label}</Link></li>
            ))}
          </ul>
        </nav>

        <ul className="footer-social">
          {SOCIAL.map(([href, label]) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer">{label}</a>
            </li>
          ))}
        </ul>
      </div>

      <div className="wrap footer-bottom mono">
        © {new Date().getFullYear()} Ashutosh Kumar
      </div>
    </footer>
  );
}