document.addEventListener("DOMContentLoaded", () => {
    initAllSectionSliders();  
});

function initAllSectionSliders(root = document) {
  const sections = root.querySelectorAll(".section");

  sections.forEach(section => {
    if (section.dataset.sliderInitialized === "true") return;

    const articles = section.querySelectorAll(".article");

    if (articles.length > 1) {
      initSectionSlider(section);
    }
  });
}

function initSectionSlider(section) {
  if (!section) return;

  if (section.dataset.sliderInitialized === "true") return;
  section.dataset.sliderInitialized = "true";

  const articles = Array.from(section.querySelectorAll(".article"));
  if (articles.length <= 1) return;

  section.classList.add("slider-enabled");

  // Wrap articles in a viewport
  const viewport = document.createElement("div");
  viewport.className = "section-slider-viewport";

  // Insert viewport after .section-top if it exists
  const sectionTop = section.querySelector(".section-top");
  if (sectionTop) {
    section.insertBefore(viewport, sectionTop.nextSibling);
  } else {
    section.prepend(viewport);
  }

  articles.forEach(article => viewport.appendChild(article));

  // Nav
  const nav = document.createElement("div");
  nav.className = "section-slider-nav";
  nav.innerHTML = `
    <button class="section-slider-btn prev" type="button" aria-label="Previous testimonial">←</button>
    <button class="section-slider-btn next" type="button" aria-label="Next testimonial">→</button>
  `;
  section.appendChild(nav);

  // Footer with dots + count
  const footer = document.createElement("div");
  footer.className = "section-slider-footer";

  const count = document.createElement("div");
  count.className = "section-slider-count";

  const dotsWrap = document.createElement("div");
  dotsWrap.className = "section-slider-dots";

  const dots = articles.map((_, i) => {
    const dot = document.createElement("button");
    dot.className = "section-slider-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
    dot.dataset.index = i;
    dotsWrap.appendChild(dot);
    return dot;
  });

  footer.appendChild(count);
  footer.appendChild(dotsWrap);
  section.appendChild(footer);

  const prevBtn = nav.querySelector(".prev");
  const nextBtn = nav.querySelector(".next");

  let current = 0;
  let isAnimating = false;

  let pointerDown = false;
  let startX = 0;
  let deltaX = 0;
  const swipeThreshold = 70;
  const dragFactor = 0.35;

  function updateViewportHeight() {
    const active = articles[current];
    const h = active.offsetHeight;
    viewport.style.height = h + "px";
  }

  function updateUI() {
    count.textContent = `${current + 1} / ${articles.length}`;

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
    });

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === articles.length - 1;
  }

  function setInitialState() {
    articles.forEach((article, i) => {
      article.classList.toggle("is-active", i === 0);
      gsap.set(article, {
        x: i === 0 ? 0 : 80,
        opacity: i === 0 ? 1 : 0
      });
    });

    updateUI();
    requestAnimationFrame(updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
  }

  function goTo(index, direction = 1) {
    if (isAnimating) return;
    if (index < 0 || index >= articles.length || index === current) return;

    isAnimating = true;

    const outgoing = articles[current];
    const incoming = articles[index];

    incoming.classList.add("is-active");

    gsap.set(incoming, {
      x: direction > 0 ? 100 : -100,
      opacity: 0
    });

    gsap.killTweensOf([outgoing, incoming, viewport]);

    const tl = gsap.timeline({
      defaults: {
        duration: 0.4,
        ease: "power2.out"
      },
      onComplete: () => {
        outgoing.classList.remove("is-active");
        current = index;
        updateUI();
        updateViewportHeight();
        isAnimating = false;
      }
    });

    tl.to(outgoing, {
      x: direction > 0 ? -100 : 100,
      opacity: 0
    }, 0);

    tl.to(incoming, {
      x: 0,
      opacity: 1
    }, 0);

    tl.to(viewport, {
      height: incoming.offsetHeight
    }, 0);
  }

  function snapBack() {
    const currentArticle = articles[current];
    const leftNeighbor = articles[current - 1];
    const rightNeighbor = articles[current + 1];

    gsap.to(currentArticle, {
      x: 0,
      opacity: 1,
      duration: 0.2,
      ease: "power2.out"
    });

    if (leftNeighbor) {
      gsap.to(leftNeighbor, {
        x: -100,
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => leftNeighbor.classList.remove("is-active")
      });
    }

    if (rightNeighbor) {
      gsap.to(rightNeighbor, {
        x: 100,
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => rightNeighbor.classList.remove("is-active")
      });
    }
  }

  function onPointerDown(e) {
    if (isAnimating) return;

    pointerDown = true;
    startX = e.clientX;
    deltaX = 0;
    viewport.classList.add("is-dragging");

    if (viewport.setPointerCapture) {
      viewport.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e) {
    if (!pointerDown || isAnimating) return;

    deltaX = e.clientX - startX;

    const currentArticle = articles[current];
    gsap.set(currentArticle, {
      x: deltaX * dragFactor,
      opacity: 1 - Math.min(Math.abs(deltaX) / 400, 0.35)
    });

    const targetIndex = deltaX < 0 ? current + 1 : current - 1;
    const neighbor = articles[targetIndex];

    if (!neighbor) return;

    neighbor.classList.add("is-active");

    const neighborStart = deltaX < 0 ? 100 : -100;
    gsap.set(neighbor, {
      x: neighborStart + deltaX * dragFactor,
      opacity: Math.min(Math.abs(deltaX) / 180, 1)
    });
  }

  function onPointerUp() {
    if (!pointerDown || isAnimating) return;

    pointerDown = false;
    viewport.classList.remove("is-dragging");

    if (deltaX <= -swipeThreshold && current < articles.length - 1) {
      cleanupNeighborStates();
      goTo(current + 1, 1);
      return;
    }

    if (deltaX >= swipeThreshold && current > 0) {
      cleanupNeighborStates();
      goTo(current - 1, -1);
      return;
    }

    snapBack();
  }

  function cleanupNeighborStates() {
    articles.forEach((article, i) => {
      gsap.killTweensOf(article);

      if (i === current) {
        gsap.set(article, { x: 0, opacity: 1 });
        article.classList.add("is-active");
      } else {
        gsap.set(article, { x: i > current ? 100 : -100, opacity: 0 });
        article.classList.remove("is-active");
      }
    });
  }

  prevBtn.addEventListener("click", () => goTo(current - 1, -1));
  nextBtn.addEventListener("click", () => goTo(current + 1, 1));

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.index);
      const direction = index > current ? 1 : -1;
      goTo(index, direction);
    });
  });

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", onPointerUp);
  viewport.addEventListener("pointercancel", onPointerUp);
  viewport.addEventListener("pointerleave", () => {
    if (pointerDown) onPointerUp();
  });

  setInitialState();
}
