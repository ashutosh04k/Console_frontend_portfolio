import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./components/Home.jsx";
import PlaygroundSection from "./components/PlaygroundSection.jsx";
import CaseStudies from "./components/CaseStudies.jsx";
import Experience from "./components/Experience.jsx";
import Projects from "./components/Projects.jsx";
import Skills from "./components/Skills.jsx";
import Contact from "./components/Contact.jsx";
import SharedSnippet from "./components/SharedSnippet.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import About from "./components/About.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/playground" element={<PlaygroundSection />} />
        <Route path="/systems" element={<CaseStudies />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/p/:slug" element={<SharedSnippet />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
