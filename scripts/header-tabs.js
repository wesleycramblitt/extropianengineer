document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const ids = ["whatido", "intro", "engagement", "demos", "pastwork", "testimonials"];
  const THRESHOLD = 200;

  const sections = ids
    .map(id => document.getElementById(id))
    .filter(Boolean);

  let snapPoints = [];
  let maxScroll = 0;

  function computeSnapPoints() {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    snapPoints = sections.map(el => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      return top / maxScroll;
    });
  }

  computeSnapPoints();

  ScrollTrigger.addEventListener("refreshInit", computeSnapPoints);
  window.addEventListener("resize", () => {
    computeSnapPoints();
    ScrollTrigger.refresh();
  });

  ScrollTrigger.create({
    start: 0,
    end: () => document.documentElement.scrollHeight - window.innerHeight,

    snap: {
      snapTo: (progress, self) => {
        const scroll = self.scroll();
        const scrollProgress = maxScroll > 0 ? scroll / maxScroll : 0;

        let candidates = [];

        candidates = snapPoints;

        if (!candidates.length) return progress;

        let closest = progress;
        let minDistPx = Infinity;

        for (const point of candidates) {
          const distPx = Math.abs(point - scrollProgress) * maxScroll;
          if (distPx < minDistPx) {
            minDistPx = distPx;
            closest = point;
          }
        }

        return minDistPx <= THRESHOLD ? closest : progress;
      },

      duration: 0.05,
      delay: 0.01,
      ease: "power1.out"
    }
  });
});

 function updateTabs() {
      var whatidotab = document.getElementById("whatidotab") 
      var introtab = document.getElementById("introtab") 
      var engagementtab = document.getElementById("engagementtab") 
      var pastworktab = document.getElementById("pastworktab")
      var testimonialtab = document.getElementById("testimonialtab")
      var demotab = document.getElementById("demostab")

      var tabs = [
        ["intro", introtab],
        ["whatido", whatidotab],
        ["demos", demotab],
        ["pastwork", pastworktab],  
        ["testimonials", testimonialtab],
        ["engagement", engagementtab]

      ];
      var selected = 0;

      for (var i = tabs.length-1; i >= 0; i--) {
          if (window.scrollY >= document.getElementById(tabs[i][0]).offsetTop) {
               tabs[i][1].classList.add("selected-tab")
               selected = i; 
              break;
          }
      }

      for (var i = 0; i < tabs.length; i++) {
           if (i == selected) continue;
           tabs[i][1].classList.remove("selected-tab")
      }

 }

window.addEventListener('scroll', updateTabs );
window.addEventListener("load", () => ScrollTrigger.refresh());
window.addEventListener("resize", () => ScrollTrigger.refresh());

