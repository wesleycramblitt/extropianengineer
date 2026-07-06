document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const ids = ["whatido", "intro", "engage", "contact", "demos", "casestudies", "pastwork", "whyworkwithme"];
  const THRESHOLD = 200;

  const sections = ids
    .map(id => document.getElementById(id))
    .filter(Boolean);

  let snapPoints = [];
  let maxScroll = 0;
/*
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
  });*/
});

  function updateTabs() {
      var whatidotab = document.getElementById("whatidotab") 
      var introtab = document.getElementById("introtab") 
      var engagetab = document.getElementById("engagetab") 
      var casestudiestab = document.getElementById("casestudiestab")
      var demostab = document.getElementById("demostab")
      var pastworktab = document.getElementById("pastworktab")
      var whyworkwithmetab = document.getElementById("whyworkwithmetab")
      var contacttab = document.getElementById("contacttab")

      var tabs = [
        ["intro", introtab],
        ["whatido", whatidotab],
        ["casestudies", casestudiestab],
        ["pastwork", pastworktab],
        ["demos", demostab],
        ["whyworkwithme", whyworkwithmetab],
        ["engage", engagetab],
        ["contact", contacttab]

      ];
      var selected = 0;

      tabThreshold = 20;
      for (var i = tabs.length-1; i >= 0; i--) {
          if (window.scrollY >= (document.getElementById(tabs[i][0]).offsetTop - tabThreshold)) {
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
