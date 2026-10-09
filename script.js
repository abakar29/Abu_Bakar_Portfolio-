// ---- Year in footer ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Nav: shrink on scroll ----
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// ---- Mobile menu ----
const toggle = document.getElementById("navToggle");
const links = document.querySelector(".nav__links");
const closeMenu = () => {
  links.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
};
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

// ---- Scroll reveal ----
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add("in");
          io.unobserve(el);
          // Clear stagger delays once the entrance is done so hovers feel instant
          setTimeout(() => el.classList.add("settled"), 1800);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  // Stagger items that share a parent for a nicer cascade; hero gets a slower sequence
  reveals.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
    const idx = Math.min(sibs.indexOf(el), 5);
    el.style.transitionDelay = el.closest(".hero") ? `${120 + idx * 130}ms` : `${idx * 80}ms`;
    io.observe(el);
  });
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

// ---- Scroll progress bar ----
const progress = document.getElementById("progress");
if (progress) {
  const setProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progress.style.transform = `scaleX(${p})`;
  };
  setProgress();
  window.addEventListener("scroll", setProgress, { passive: true });
  window.addEventListener("resize", setProgress, { passive: true });
}

// ---- Cursor spotlight on cards ----
const spotlights = document.querySelectorAll(".card, .timeline__body, .skills__group");
spotlights.forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

// ---- Active nav link highlighting ----
const navLinks = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);
if (sections.length && "IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === `#${id}`)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));
}

// ---- Motion helpers ----
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (n) => Math.min(1, Math.max(0, n));

// Index tags and contact buttons so CSS can stagger them
document.querySelectorAll(".tags, .contact__links").forEach((list) => {
  Array.from(list.children).forEach((c, i) => c.style.setProperty("--i", i));
});

// ---- Count-up numbers ----
const counters = document.querySelectorAll("[data-count]");
if (!reduceMotion && counters.length && "IntersectionObserver" in window) {
  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const isOrd = "ordinal" in el.dataset;
    const start = isOrd ? 1 : 0;
    const fmt = (n) => (isOrd ? ordinal(n) : String(n));
    const t0 = performance.now();
    const dur = 1400;
    const step = (t) => {
      const k = clamp01((t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(start + (target - start) * eased));
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(start);
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          cio.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => cio.observe(el));
}

// ---- Scroll-driven motion: glow parallax, timeline line, story band ----
if (!reduceMotion && "IntersectionObserver" in window) {
  const glow = document.querySelector(".bg-glow");
  const band = document.querySelector(".band");
  const timelines = Array.from(document.querySelectorAll(".timeline"));
  const visible = new Set();

  if (band) band.classList.add("band--motion");
  timelines.forEach((t) => t.style.setProperty("--tl", 0));

  const update = () => {
    const vh = window.innerHeight;
    if (glow) glow.style.transform = `translateX(-50%) translateY(${-Math.min(window.scrollY * 0.12, 220)}px)`;
    timelines.forEach((t) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--tl", clamp01((vh * 0.7 - r.top) / r.height).toFixed(3));
    });
    if (band && visible.has(band)) {
      const r = band.getBoundingClientRect();
      const p = clamp01((vh - r.top) / (vh + r.height));
      band.style.setProperty("--band-y", `${((p - 0.5) * 70).toFixed(1)}px`);
      band.style.setProperty("--band-s", (1.12 - p * 0.06).toFixed(3));
    }
  };

  let ticking = false;
  const queue = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };

  // Only measure the band while it is near the viewport
  const vio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      queue();
    },
    { rootMargin: "120px 0px" }
  );
  if (band) vio.observe(band);

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });
  update();
}
