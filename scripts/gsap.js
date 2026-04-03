    // use a script tag or an external JS file
document.addEventListener("DOMContentLoaded", (event) => {
    gsap.registerPlugin(Draggable,DrawSVGPlugin,EaselPlugin,Flip,GSDevTools,InertiaPlugin,MotionPathHelper,MotionPathPlugin,MorphSVGPlugin,Observer,Physics2DPlugin,PhysicsPropsPlugin,PixiPlugin,ScrambleTextPlugin,ScrollTrigger,ScrollSmoother,ScrollToPlugin,SplitText,TextPlugin,RoughEase,ExpoScaleEase,SlowMo,CustomEase,CustomBounce,CustomWiggle)

      //Scramble header
    gsap.to(document.getElementById("hero"), {duration: 1, scrambleText: "Wes Cramblitt"});

    gsap.to(document.getElementById("hero2"), {duration: 1, scrambleText: "Scientific Software Engineer"});
         
    gsap.to(document.getElementById("hero3"), {duration: 1, scrambleText: "C++ | OpenGL | Javascript | Python"});
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


 function updateTabs() {
      var whatidotab = document.getElementById("whatidotab") 
      var introtab = document.getElementById("introtab") 
      var engagementtab = document.getElementById("engagementtab") 
      var pastworktab = document.getElementById("pastworktab")
      var testimonialtab = document.getElementById("testimonialtab")

      var tabs = [];
      tabs.push(introtab);
      tabs.push(whatidotab);
      tabs.push(engagementtab);
      tabs.push(pastworktab);
      tabs.push(testimonialtab);
      var selected = 0;

      if (window.scrollY >= document.getElementById("testimonials").offsetTop) {
           testimonialtab.classList.add("selected-tab")
           selected = 4; 
      }
     else if (window.scrollY >= document.getElementById("pastwork").offsetTop) {
           pastworktab.classList.add("selected-tab")
           selected = 3; 
      }
      else if (window.scrollY >= document.getElementById("engagement").offsetTop) {
           engagementtab.classList.add("selected-tab")
          selected = 2;
      }
      else if (window.scrollY >= document.getElementById("whatido").offsetTop) {
           whatidotab.classList.add("selected-tab")
          selected = 1;
      }
      else {
          introtab.classList.add("selected-tab")
          selected = 0;
      }

      for (var i = 0; i < tabs.length; i++) {
            if (i == selected) continue;
           tabs[i].classList.remove("selected-tab")
      }

 }

window.addEventListener('scroll', updateTabs );
window.addEventListener("load", () => ScrollTrigger.refresh());
window.addEventListener("resize", () => ScrollTrigger.refresh());

