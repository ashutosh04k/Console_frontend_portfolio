import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "./Nav.css";

const LINKS = [
  ["/about", "About"],
  ["/systems", "Architecture Lab"],
  ["/experience", "Experience"],
  ["/projects", "Projects"],
  ["/skills", "Skills"],
  ["/playground", "Playground"],
  ["/contact", "Contact"],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav className={`nav ${scrolled ? "nav-scrolled" : ""} ${isOpen ? "nav-open" : ""}`}>
      <div className="wrap nav-inner">
        <Link to="/" className="nav-logo mono" onClick={() => setIsOpen(false)}>
          <span className="nav-run">
            <span>{"<Ashutosh "}</span>
            <span>{" Kumar />"}</span>
          </span>
        </Link>

        <button
          className={`nav-toggle ${isOpen ? "is-active" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle Navigation"
          aria-expanded={isOpen}
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>

        <ul className={`nav-links mono ${isOpen ? "nav-links-open" : ""}`}>
          {LINKS.map(([path, label]) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) => (isActive ? "nav-link-active" : "")}
                onClick={() => setIsOpen(false)}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

