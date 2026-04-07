document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll(".section.horizontal").forEach((section) => {
      const cards = gsap.utils.toArray(section.querySelectorAll(".article-content"));
      if (!cards.length) return;

      const articles = gsap.utils.toArray(section.querySelectorAll(".article"));
      const totalSteps = Math.max(cards.length - 1, 1);
      const transition = 0.34; // small = quick animation

      gsap.set(articles, {
        position: "absolute",
        inset: 0
      });

      function hideCard(card) {
        gsap.set(card, {
          opacity: 0,
          scale: 0.42,
          z: -1400,
          rotationX: 6,
          filter: "blur(6px)",
          zIndex: 1
        });
      }

      function showCard(card) {
        gsap.set(card, {
          opacity: 1,
          scale: 1,
          z: 0,
          rotationX: 0,
          filter: "blur(0px)",
          zIndex: 20
        });
      }
    function render(raw) {
      const maxIndex = cards.length - 1;
      const clamped = Math.max(0, Math.min(raw, maxIndex));
      const base = Math.floor(clamped);
      const local = clamped - base;

      cards.forEach(hideCard);

      if (clamped === 0) {
        showCard(cards[0]);
        return;
      }

      if (clamped === maxIndex) {
        showCard(cards[maxIndex]);
        return;
      }

      if (local <= transition) {
        const t = local / transition;
        const current = cards[base];
        const next = cards[base + 1];

        gsap.set(current, {
          opacity: 1 - t,
          scale: 1 + (0.12 * t),
          z: 320 * t,
          rotationX: -6 * t,
          filter: `blur(${6 * t}px)`,
          zIndex: 20
        });

        gsap.set(next, {
          opacity: t,
          scale: 0.42 + ((1 - 0.42) * t),
          z: -1400 + (1400 * t),
          rotationX: 6 - (6 * t),
          filter: `blur(${6 - 6 * t}px)`,
          zIndex: 21
        });

        return;
      }
      // after transition completes, next card stays solid
      showCard(cards[base + 1]);
    }

  const st = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${cards.length * 120}`,
    scrub: 0.01,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    snap: {
      snapTo: (value, self) => {
        const totalSteps = Math.max(cards.length - 1, 1);

        const scaled = value * totalSteps;

        const snapped = self.direction > 0
          ? Math.ceil(scaled)   // scrolling down → next card
          : Math.floor(scaled); // scrolling up → previous card

        return snapped / totalSteps;
      },
      duration: 0.15,
      ease: "power1.out"
    },
    onUpdate: (self) => {
      const raw = self.progress * totalSteps;
      render(raw);
    },
      onEnter: () => {
          render(0);
      },
    onEnterBack: (self) => render(self.progress * totalSteps),
      onRefresh: (self) => {
            const raw = self.progress * totalSteps;
          render(raw);
      }
  });

  // make first card visible before any scrolling in the section
  render(0);
  });
});


