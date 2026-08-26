// All portfolio content lives here so it's easy to update in one place.
// Sourced from Ashutosh Kumar's résumé.

export const EXPERIENCE = [
  {
    role: "Associate Software Developer",
    company: "Togopool",
    period: "Jul 2025 — Present",
    tags: ["Logistics","Car Pooling","WebSockets", "Firebase", "Stripe", "RBAC"],
    points: [
          "Built real-time driver/vehicle tracking with live map updates over WebSockets on a SaaS operations platform.",
          "Built a live two-way support console (WhatsApp-style) for driver and rider chats, with a shared message renderer, date-grouped threads, smart auto-scroll, quick-reply canned responses, and 2-second live polling.",
          "Built a read-only chat audit viewer for reviewing past driver–rider conversations, with a 45-day filter window and PDF export of full transcripts.",
          "Engineered a bulk-order import tool that maps arbitrary CSV/XLSX headers to a 40-field schema via normalize-based fuzzy matching, coerces enums/dates/times (including Excel serials and dd-mm vs mm-dd), and validates 100k+ rows per upload with category-dependent rules before import.",
          "Built a driver shift-scheduling module storing shifts in UTC and converting per-city via utc_offset, with overlap detection, overnight-shift handling, and copy/paste of a day's roster across dates with overwrite confirmation.",
          "Built a tab-level RBAC roles & permissions manager with number-encoded permissions (view/edit/add) serialized per tab, a locked read-only default role, conditional PII-masking toggles, and analytics sub-report selection.",
          "Built a real-time logistics analytics dashboard with 15+ configurable KPI cards (OTIF, RTO, SLA, driver utilization, cost-per-delivery), custom SVG charts (trend lines with targets, stacked/dual-axis bars, donuts, funnels), and city/hub/date filtering.",
          "Integrated Stripe for a client booking flow — checkout, secure card capture, and confirmation.",
          "Integrated Firebase Cloud Messaging for push notifications with background delivery via service workers.",
          "Implemented role-based access control and push alerts across the driver operations modules.",
    ],
  },
  {
    role: "Software Developer",
    company: "100acress",
    period: "Oct 2024 — Jun 2025",
    tags: ["React", "Redux", "CI/CD", "Perf"],
    points: [
      "Built pixel-accurate, responsive React interfaces from Figma with keyboard nav and ARIA labeling.",
      "Optimized rendering for large datasets with virtualization and memoization, cutting load time 45%.",
      "Restructured client state with a normalized Redux schema and RTK Query, eliminating stale-cache bugs.",
      "Reduced main-bundle size 20% via code splitting and dynamic imports, improving Time-to-Interactive.",
      "Built CI/CD with GitHub Actions deploying to AWS on merge, replacing manual releases.",
    ],
  },
  {
    role: "Software Developer — Intern",
    company: "TawglUp",
    period: "Jan 2024 — Sep 2024",
    tags: ["WebSockets", "Realtime"],
    points: [
      "Built an interactive interview chat with real-time messaging and live client-side updates.",
      "Implemented structured feedback flows, replacing ad-hoc input with a guided conversational UI.",
      "Added a WebSocket notification service for real-time interview-status updates.",
    ],
  },
];

export const PROJECTS = [
  {
    name: "Mobility Fleet Management",
    metric: "Enterprise scale",
    blurb:
      "Enterprise-grade transportation platform for employee mobility, shuttle operations, and fleet tracking. Built responsive dashboards, booking workflows, live trip monitoring, driver management, and reporting with React, Redux, and Material UI, plus real-time notifications, GPS tracking, and role-based access control.",
    stack: ["React", "Redux", "Material UI", "WebSocket", "REST APIs", "Google Maps API", "Firebase"],
    live: "https://admin-dev.mobilityinfotech.com/signup",
    github: "",
  },
  {
    name: "100Acress",
    metric: "Real estate portal",
    blurb:
      "Software for a large-scale real estate platform serving buyers, sellers, and agents. Converted Figma designs into responsive, cross-browser interfaces with property search, dynamic filters, and location-based discovery. Deployed via AWS EC2, Docker, Nginx, and CI/CD with GitHub Actions.",
    stack: ["React", "JavaScript", "Redux", "Tailwind CSS", "REST APIs", "AWS EC2", "Docker", "GitHub Actions"],
    live: "https://www.100acress.com/",
    github: "",
  },
  {
    name: "ProXperty",
    metric: "Scalable platform",
    blurb:
      "Scalable real estate platform with property listing, lead management, and role-based administration for agents and admins. Built high-performance UIs with React, Redux, and Material UI, plus dynamic filtering and location-based discovery. Deployed containerized apps with Docker and AWS.",
    stack: ["React", "Redux", "Material UI", "Node.js", "MongoDB", "Docker", "AWS"],
    live: "http://demo.proxperty.in/",
    github: "",
  },
  {
    name: "AI Movie Search",
    metric: "GPT-powered",
    blurb:
      "AI-powered movie search using OpenAI's GPT APIs for natural-language queries and recommendations. Secured with Firebase authentication and Google Cloud Functions for scalable serverless execution, with Tailwind CSS styling and React Redux state management.",
    stack: ["Redux", "React", "API Gateway", "Tailwind CSS"],
    live: "",
    github: "https://github.com/ashutosh04k/netflixgpt",
  },
  {
    name: "Aisle Essential",
    metric: "200+ daily txns",
    blurb:
      "E-commerce platform with seamless product browsing and checkout, reaching 200+ daily transactions within two quarters of launch. Built a comprehensive admin panel to manage 300+ listings and real-time inventory, plus a streamlined multi-user purchase flow.",
    stack: ["React", "Redux Toolkit", "MongoDB", "Node.js", "Express"],
    live: "",
    github: "https://github.com/ashutosh04k/console-frontend-app",
  },
  {
    name: "Food Cart App",
    metric: "TheMealDB API",
    blurb:
      "React and Redux app for discovering meals worldwide via TheMealDB API. Features dynamic filtering by area, modal detail views, shimmer loading, name search, alphabetical sorting, and responsive pagination, with Ant Design for a polished UI.",
    stack: ["React", "Redux", "JavaScript", "Ant Design", "REST API"],
    live: "https://brainstormtest.netlify.app/",
    github: "https://github.com/ashutosh04k/Ashutosh-Kumar--Frontend-Developer.",
  },
  {
    name: "Textify",
    metric: "AI audio-to-text",
    blurb:
      "Interactive web app using OpenAI's API to convert any audio to text, then generate a summary rendered as key points.",
    stack: ["React", "OpenAI API", "JavaScript"],
    live: "https://voice-textify.vercel.app/",
    github: "https://github.com/ashutosh04k/VoiceTextify",
  },
];

export const SKILLS = {
  Frontend: [
    "React.js",
    "TypeScript",
    "Redux Toolkit / RTK Query",
    "JavaScript (ES6+)",
    "HTML5",
    "CSS3 / SCSS",
    "Tailwind CSS",
    "Responsive Design",
    "WCAG 2.1 a11y",
  ],
  Backend: ["Node.js", "Express", "MongoDB", "SQL", "REST APIs"],
  "Testing / Tooling": [
    "Jest",
    "React Testing Library",
    "Vite",
    "Webpack",
    "Git",
    "GitHub Actions",
  ],
  "Cloud / DevOps": ["AWS (EC2, S3)", "Docker", "Firebase", "CI/CD"],
  Fundamentals: ["Data Structures & Algorithms", "OOP", "C++", "C"],
};

export const CONTACT = {
  email: "kumarasutosh2014@gmail.com", // ← swap for your real email
  linkedin: "https://www.linkedin.com/in/ashutosh-kumar-sde/",
  github: "https://github.com/ashutosh04k",
  location: "Gurgaon, Haryana, IN",
};
