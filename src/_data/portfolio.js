// Portfolio data — single source of truth for featured + earlier work.
// Copy preserved from the legacy site (index.html / archive.html).
module.exports = [
  // ── FEATURED ──────────────────────────────────────────────────
  {
    id: "extropian",
    title: "Extropian Ecosystem",
    years: "2025–present",
    category: "product",
    featured: true,
    summary: "A product-led ecosystem of modular C++/OpenGL scientific software — core platform libraries, solvers, renderers, and UI systems composing into end-user products.",
    detail: [
      "The Extropian ecosystem is the evolution of my real-time multiphysics simulation work into a product-led platform: modular C++ libraries and OpenGL-based systems — a core platform, physics and optimization engines, a renderer, and UI libraries — that compose into end-user products like the CAE Workbench, Synthesis, and Composer.",
      "Every component is available as a modular repository to build on, or as a finished product to run — see the Products page for the full catalog and licensing."
    ],
    media: null,
    quote: null
  } ,
  {
    id: "hyperfat",
    title: "HyperFat: Hypersonic Adaptive-Mesh CFD",
    years: null,
    category: "scientific",
    featured: true,
    summary: "Building a commercial-grade interactive UI/UX for a hypersonic flow solver — model editing, boundary conditions, batch processing, save/load with reproducibility.",
    detail: [
      "HyperFat is a CFD solver with adaptive mesh refinement for hypersonic flows. The underlying solver was powerful but inaccessible to non-developers.",
      "I am building a commercial-grade interactive UI/UX — editing models and boundary conditions, managing batch processes, save/load scenes with reproducibility, and a command-bus architecture separating the UI from computational operations. Active contract with Whoosh HPC Lab LLC."
    ],
    media: { type: "video", src: "/vid/whoosh.webm", interactive: false },
    quote: null
  } ,
  {
    id: "capars",
    title: "CAPARS: Atmospheric Dispersion Modeling",
    years: null,
    category: "scientific",
    featured: true,
    summary: "Large-scale system for modeling chemical and radiological release scenarios — modernized, customized, and deployed to Sandia National Laboratories.",
    detail: [
      "CAPARS is a large-scale system for modeling chemical and radiological release scenarios, used to develop Emergency Action Levels and Protective Action Guidelines. Originating in the 1990s, it required modernization, customization, and deployment to Sandia National Laboratories.",
      "I took technical ownership — upgrading the application, building deployment infrastructure, and operating across every layer of the stack."
    ],
    media: { type: "video", src: "/vid/capars.webm", interactive: true, poster: "/img/posters/capars.jpg" },
    quote: { text: "Wes is a highly professional and talented software developer. He tackled complex and difficult issues in more than ten distinctly different assignments and was successful in all of them. He came up to speed quickly on legacy software that was not well documented — a key need in our project. He listened well and quickly gained understanding of what we needed to accomplish, then developed creative solutions to our needs. He managed his time well and met schedule and was close to budget in an exploratory environment where the effort required was difficult to predict. Overall, Wes significantly exceeded our expectations. I would recommend him for any software development and management project that fits his background.", by: "Reed Hodgin, CAPARS" }
  } ,
  {
    id: "autoligo",
    title: "Autoligo: Non-Coding RNA Analysis",
    years: null,
    category: "scientific",
    featured: true,
    summary: "End-to-end research platform taking scientists from raw sequencing data through downstream analysis, annotation, and interpretation.",
    detail: [
      "Autoligo takes researchers from raw sequencing data through downstream analysis, annotation, and interpretation — replacing a patchwork of disconnected tools with a single reproducible platform.",
      "Built in collaboration with Kansas University graduate students, the system reduces manual analysis burden and makes non-coding RNA research accessible to domain scientists rather than only programmers."
    ],
    media: { type: "video", src: "/vid/autoligo.webm", interactive: true, poster: "/img/posters/autoligo.jpg" },
    quote: null
  } ,
  {
    id: "alphaact",
    title: "AlphaACT: Emergency Response Training",
    years: "2018–present",
    category: "modernization",
    featured: true,
    summary: "Primary developer since 2018 — maintaining, upgrading, and customizing this mission-critical training platform for multiple government and enterprise deployments.",
    detail: [
      "AlphaACT is an emergency-response training platform used by government and enterprise clients.",
      "Since 2018 I have served as the primary developer — maintaining, upgrading, and customizing the system for multiple deployments. The engagement spans legacy code stewardship, feature development, client-specific customization, and ongoing technical support across years."
    ],
    media: { type: "image", src: "/img/alphaact.gif" },
    quote: { text: "Wes is extremely proficient, diligent and highly competent. He quickly understands a task, finds effective solutions to simple or complex problems and implements on time and within budget. What more could you ask!", by: "Reed Hodgin, AlphaACT" }
  } ,
  {
    id: "solvere",
    title: "Solvere: IoT Fleet-Managed LC Detector",
    years: null,
    category: "realtime",
    featured: true,
    summary: "Electron-based application on Raspberry Pi interfacing with PID controllers, sensors, and actuators — fleet-managed with Balena OS.",
    detail: [
      "Solvere is an Electron-based application deployed on Raspberry Pi devices, interfacing directly with PID controllers, sensors, and actuators for real-time liquid chromatography detection.",
      "The fleet was managed and deployed remotely using Balena OS for over-the-air updates, health monitoring, and centralized fleet management across distributed hardware installations."
    ],
    media: { type: "image", src: "/img/solvere.jpg" },
    quote: null
  } ,
  // ── EARLIER WORK ─────────────────────────────────────────────
  {
    id: "skillsoverpaper",
    title: "Skills Over Paper",
    years: "2022–2024",
    category: "product",
    featured: false,
    summary: "Founded and solo-developed a developer–company matchmaking platform with Next.js, React, and PostgreSQL — structured, skill-based resumes capture nuanced developer capabilities.",
    media: { type: "video", src: "/vid/skillsoverpaper.webm", interactive: true, poster: "/img/posters/skillsoverpaper.jpg" },
    quote: null
  },
  {
    id: "healthiq",
    title: "HealthIQ: Cognitive Quiz",
    years: "2021",
    category: "product",
    featured: false,
    summary: "Delivered under an aggressive two-week timeline, compressing several months of planned work.",
    media: { type: "image", src: "/img/healthiq.png" },
    quote: { text: "Wes is talented, personable and overall a great person to work with. There's always a challenge in finding someone who can balance communication, skill, and productivity, but Wes really brings them all. I would definitely hire him again for my next project.", by: "Kurt Roots, HealthIQ" }
  },
  {
    id: "brainbreak",
    title: "Brain Break: Neurotherapeutic Game",
    years: "2020",
    category: "realtime",
    featured: false,
    summary: "3D game where a rotating glass cube continuously spins while the player throws balls to break panels of specific colors — real-time physics and rendering.",
    media: { type: "video", src: "/vid/brainbreak.mp4", interactive: true, poster: "/img/posters/brainbreak.jpg" },
    quote: { text: "Wesley did a great job on my mobile game, coming up with creative solutions to its challenges. He is easy to work with, consistent and responds quickly to feedback. Highly recommend!", by: "V, Relative Magnitude" }
  },
  {
    id: "igrad",
    title: "IGrad: Financial Management Platform",
    years: "2019–2021",
    category: "product",
    featured: false,
    summary: "Designed and implemented APIs, integrated ML-driven features, and built complex responsive React frontends.",
    media: { type: "image", src: "/img/igrad.png" },
    quote: { text: "Wes is a fantastic developer. Easy to work with and produces high quality code. He was able to handle everything we threw at him from legacy code updates to new technology PoCs. He worked well with our team and was very professional in dealing with our vendors.", by: "Danny Crinion, IGrad" }
  },
  {
    id: "casino",
    title: "Casino Poker Games",
    years: "2019",
    category: "product",
    featured: false,
    summary: "Extended JS prototypes into fully playable casino-style games with complete logic, refined UI/UX, and multiple variants.",
    media: { type: "video", src: "/vid/doubleballroulette.webm", interactive: true, poster: "/img/posters/doubleballroulette.jpg" },
    quote: { text: "Wes went above and beyond and his knowledge was above the rest of the pack. I will use Wes for other projects and tweaks in the future.", by: "Max, Vegas Games" }
  },
  {
    id: "dorger",
    title: "Dorger Software Architects",
    years: "2018–2019",
    category: "modernization",
    featured: false,
    summary: "Contributed to multiple medium-to-large state systems — built and extended APIs, maintained frontend components, fixed production bugs, and implemented supporting services.",
    media: { type: "image", src: "/img/dorger.png" },
    quote: null
  },
  {
    id: "cares",
    title: "CARES: Alabama Eligibility System",
    years: "2014–2015",
    category: "modernization",
    featured: false,
    summary: "Senior Developer on the Centralized Alabama Recipient Eligibility System, a large-scale web platform serving the state of Alabama.",
    media: { type: "image", src: "/img/cares.webp" },
    quote: null
  },
  {
    id: "envista",
    title: "Envista: Data Migration Tool",
    years: "2012–2014",
    category: "modernization",
    featured: false,
    summary: "Joined as the company's first intern after proactively reaching out and negotiating the role — built data migration tooling.",
    media: { type: "image", src: "/img/envista.jpg" },
    quote: null
  },
  {
    id: "mdad",
    title: "MDAD: Mississippi Damage Awards Database",
    years: "2011–2013",
    category: "product",
    featured: false,
    summary: "Co-founded and built from scratch using ASP.NET Web Forms — a database helping lawyers draw statistical conclusions about potential case outcomes.",
    media: { type: "image", src: "/img/mdad.png" },
    quote: null
  }
];
