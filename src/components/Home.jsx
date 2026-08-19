import { useEffect } from "react";
import Hero from "./Hero.jsx";
import PlaygroundSection from "./PlaygroundSection.jsx";
import CaseStudies from "./CaseStudies.jsx";
import Experience from "./Experience.jsx";
import Projects from "./Projects.jsx";
import Skills from "./Skills.jsx";
import Contact from "./Contact.jsx";

export default function Home() {
  // reveal-on-scroll for anything with .reveal
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <Hero />
      <CaseStudies />
      <Experience />
      <Projects />
      <Skills />
      <PlaygroundSection />
      <Contact />
    </>
  );
}
