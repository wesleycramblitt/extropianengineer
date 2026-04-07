    // use a script tag or an external JS file

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

