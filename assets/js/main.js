/* ============================================================
   Scroll choreography, 3D effects, data-driven sections
   ============================================================ */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- helpers ---------- */
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = "";
    text.split(/(\s+)/).forEach(function (chunk) {
      if (/^\s+$/.test(chunk)) { el.appendChild(document.createTextNode(" ")); return; }
      var w = document.createElement("span");
      w.className = "word";
      chunk.split("").forEach(function (ch) {
        var s = document.createElement("span");
        s.className = "char";
        s.textContent = ch;
        w.appendChild(s);
      });
      el.appendChild(w);
    });
    return el.querySelectorAll(".char");
  }

  function fmt(n) { return n.toLocaleString("en-US"); }

  /* ---------- nav + progress + dots (world-aware) ---------- */
  (function () {
    var nav = document.getElementById("site-nav");
    var world = document.getElementById("story");
    function onScroll() {
      var threshold = world && world.offsetHeight > 0
        ? world.offsetHeight - window.innerHeight * 1.05
        : window.innerHeight * 0.65;
      var past = (window.scrollY || 0) > threshold;
      document.body.classList.toggle("world-past", past);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (hasGSAP) {
      gsap.to("#progress-bar", {
        scaleX: 1, ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
      });
      document.querySelectorAll("#dot-nav a").forEach(function (dot) {
        var sec = document.querySelector(dot.getAttribute("href"));
        if (!sec) return;
        ScrollTrigger.create({
          trigger: sec, start: "top 55%", end: "bottom 55%",
          onToggle: function (self) { if (self.isActive) {
            document.querySelectorAll("#dot-nav a").forEach(function (d) { d.classList.remove("active"); });
            dot.classList.add("active");
          } }
        });
      });
    }
  })();

  /* ---------- section title 3D reveals ---------- */
  if (hasGSAP && !reducedMotion) {
    document.querySelectorAll(".section-title").forEach(function (t) {
      var chars = splitChars(t);
      gsap.from(chars, {
        opacity: 0, yPercent: 70, rotateX: -90, transformOrigin: "50% 100% -14px",
        stagger: 0.018, duration: 0.85, ease: "expo.out",
        scrollTrigger: { trigger: t, start: "top 86%" }
      });
    });
    gsap.utils.toArray(".section-index, .section-sub").forEach(function (el) {
      gsap.from(el, {
        opacity: 0, y: 22, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" }
      });
    });
    gsap.utils.toArray(".reveal").forEach(function (el) {
      gsap.from(el, {
        opacity: 0, y: 46, rotateX: -7, transformOrigin: "50% 0%",
        duration: 0.95, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
  }

  /* ---------- timeline ---------- */
  if (hasGSAP && !reducedMotion) {
    gsap.to("#timeline-line", {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: "#timeline-wrap", start: "top 75%", end: "bottom 60%", scrub: 0.4 }
    });
    document.querySelectorAll(".tl-item").forEach(function (item, i) {
      var fromLeft = item.matches(":nth-child(odd)");
      gsap.from(item.querySelector(".tl-card"), {
        opacity: 0, x: fromLeft ? -70 : 70, rotateY: fromLeft ? 24 : -24,
        transformOrigin: fromLeft ? "100% 50%" : "0% 50%",
        duration: 1.0, ease: "power3.out",
        scrollTrigger: { trigger: item, start: "top 84%" }
      });
      gsap.from(item.querySelector(".tl-node"), {
        scale: 0, duration: 0.5, ease: "back.out(3)",
        scrollTrigger: { trigger: item, start: "top 84%" }
      });
    });
  }

  /* ---------- projects: render + filter + tilt ---------- */
  (function () {
    var grid = document.getElementById("projects-grid");
    if (!grid || !window.PROJECTS) return;
    var CATS = { research: "Research & Open Source", industry: "Industry & Products", early: "Robotics, Games & Early Work" };

    function card(p) {
      var el = document.createElement("article");
      el.className = "proj-card";
      el.dataset.cat = p.cat;
      var links = (p.links || []).map(function (l) {
        return '<a href="' + l.u + '" target="_blank" rel="noopener">' + l.t + "</a>";
      }).join("");
      el.innerHTML =
        (p.img ? '<img class="proj-photo" src="' + p.img + '" alt="" loading="lazy">' : "") +
        '<div class="proj-top"><span class="proj-cat">' + CATS[p.cat] + '</span>' +
        '<span class="proj-years">' + p.years + "</span></div>" +
        '<h3 class="proj-name">' + p.name + "</h3>" +
        '<div class="proj-role">' + p.role + "</div>" +
        '<p class="proj-desc">' + p.desc + "</p>" +
        (p.award ? '<span class="proj-award">🏅 ' + p.award + "</span>" : "") +
        '<div class="proj-tags">' + p.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</div>" +
        (links ? '<div class="proj-links">' + links + "</div>" : "");
      return el;
    }

    window.PROJECTS.forEach(function (p) { grid.appendChild(card(p)); });

    /* filter buttons */
    var bar = document.getElementById("filter-bar");
    var counts = { all: window.PROJECTS.length };
    window.PROJECTS.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
    [["all", "All"], ["research", "Research & OSS"], ["industry", "Industry"], ["early", "Robotics & Early"]].forEach(function (f, i) {
      var b = document.createElement("button");
      b.className = "filter-btn" + (i === 0 ? " active" : "");
      b.dataset.f = f[0];
      b.innerHTML = f[1] + '<span class="count">' + (counts[f[0]] || 0) + "</span>";
      b.addEventListener("click", function () {
        bar.querySelectorAll(".filter-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        grid.querySelectorAll(".proj-card").forEach(function (c) {
          var show = f[0] === "all" || c.dataset.cat === f[0];
          if (hasGSAP && !reducedMotion) {
            if (show && c.style.display === "none") {
              c.style.display = "";
              gsap.fromTo(c, { opacity: 0, scale: 0.86, rotateX: -12 }, { opacity: 1, scale: 1, rotateX: 0, duration: 0.5, ease: "power3.out" });
            } else if (!show) { c.style.display = "none"; }
          } else {
            c.style.display = show ? "" : "none";
          }
        });
        if (hasGSAP) ScrollTrigger.refresh();
      });
      bar.appendChild(b);
    });

    /* entrance */
    if (hasGSAP && !reducedMotion) {
      ScrollTrigger.batch(".proj-card", {
        start: "top 90%",
        onEnter: function (batch) {
          gsap.from(batch, {
            opacity: 0, y: 70, rotateX: -18, z: -120, transformOrigin: "50% 0%",
            stagger: 0.07, duration: 1.0, ease: "power3.out", clearProps: "transform,opacity"
          });
        },
        once: true
      });
    }

    /* pointer tilt + glare */
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    if (finePointer && !reducedMotion) {
      grid.addEventListener("pointermove", function (e) {
        var c = e.target.closest(".proj-card");
        if (!c) return;
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", (px * 100) + "%");
        c.style.setProperty("--my", (py * 100) + "%");
        var rx = (0.5 - py) * 10, ry = (px - 0.5) * 12;
        c.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateZ(6px)";
      });
      grid.addEventListener("pointerout", function (e) {
        var c = e.target.closest(".proj-card");
        if (c && !c.contains(e.relatedTarget)) {
          c.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
          c.style.transform = "";
          setTimeout(function () { c.style.transition = ""; }, 500);
        }
      });
    }
  })();

  /* ---------- scholar data: counters + chart ---------- */
  (function () {
    var FALLBACK = {
      citations_all: 273, h_index: 9, i10_index: 9,
      graph: [
        { year: 2018, citations: 4 }, { year: 2019, citations: 2 }, { year: 2020, citations: 15 },
        { year: 2021, citations: 16 }, { year: 2022, citations: 38 }, { year: 2023, citations: 56 },
        { year: 2024, citations: 42 }, { year: 2025, citations: 63 }, { year: 2026, citations: 34 }
      ]
    };

    function counters(scope, data) {
      document.querySelectorAll("[data-count]").forEach(function (el) {
        var key = el.dataset.count;
        var target = key === "static" ? parseInt(el.dataset.value, 10) : data[key];
        if (typeof target !== "number") return;
        if (!hasGSAP || reducedMotion) { el.textContent = fmt(target); return; }
        var obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%" },
          onUpdate: function () { el.textContent = fmt(Math.round(obj.v)); }
        });
      });
    }

    function chart(data) {
      var wrap = document.getElementById("citation-chart");
      if (!wrap) return;
      var max = Math.max.apply(null, data.graph.map(function (g) { return g.citations; }));
      data.graph.forEach(function (g) {
        var col = document.createElement("div");
        col.className = "bar-col";
        var h = Math.max(6, (g.citations / max) * 100);
        col.innerHTML =
          '<div class="bar" style="height:' + h + '%"><span class="val">' + g.citations + "</span></div>" +
          '<span class="yr">’' + String(g.year).slice(2) + "</span>";
        wrap.appendChild(col);
      });
      if (hasGSAP && !reducedMotion) {
        gsap.to("#citation-chart .bar", {
          scaleY: 1, stagger: 0.09, duration: 1.0, ease: "expo.out",
          scrollTrigger: { trigger: wrap, start: "top 86%" }
        });
        gsap.from("#citation-chart .val", {
          opacity: 0, duration: 0.5, stagger: 0.09, delay: 0.4,
          scrollTrigger: { trigger: wrap, start: "top 86%" }
        });
      } else {
        document.querySelectorAll("#citation-chart .bar").forEach(function (b) { b.style.transform = "scaleY(1)"; });
      }
    }

    fetch("gscholar.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : FALLBACK; })
      .catch(function () { return FALLBACK; })
      .then(function (d) {
        d = d && d.graph ? d : FALLBACK;
        counters(document, d);
        chart(d);
        var st = document.getElementById("gscholar-stats");
        if (st) st.textContent = fmt(d.citations_all) + " citations · h-index " + d.h_index + " · i10 " + d.i10_index;
      });

    fetch("contrib.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) {
        var el = document.getElementById("gh-micro");
        if (el && d) el.textContent = fmt(d.totalCalendar || 0) + " GitHub contributions · past 12 months";
        var chip = document.getElementById("contrib-chip");
        if (chip && d && typeof d.totalCalendar === "number") {
          chip.dataset.count = "static";
          chip.dataset.value = d.totalCalendar;
          if (!hasGSAP || reducedMotion) { chip.textContent = fmt(d.totalCalendar); }
          else {
            var obj = { v: 0 };
            gsap.to(obj, {
              v: d.totalCalendar, duration: 1.8, ease: "power2.out",
              scrollTrigger: { trigger: chip, start: "top 92%" },
              onUpdate: function () { chip.textContent = fmt(Math.round(obj.v)); }
            });
          }
        }
      });
  })();

  /* ---------- honors 3D stagger ---------- */
  if (hasGSAP && !reducedMotion) {
    ScrollTrigger.batch(".honor-card", {
      start: "top 90%",
      onEnter: function (batch) {
        gsap.from(batch, {
          opacity: 0, y: 50, rotateY: -20, transformOrigin: "0% 50%",
          stagger: 0.08, duration: 0.9, ease: "power3.out", clearProps: "transform,opacity"
        });
      },
      once: true
    });
    ScrollTrigger.batch(".li-item, .teach-card, .pub-group, .quote-card", {
      start: "top 92%",
      onEnter: function (batch) {
        gsap.from(batch, { opacity: 0, y: 34, stagger: 0.06, duration: 0.8, ease: "power3.out", clearProps: "transform,opacity" });
      },
      once: true
    });
  }

  /* ---------- contact portrait parallax ---------- */
  (function () {
    var img = document.querySelector(".contact-cutout");
    if (!img || !hasGSAP || reducedMotion) return;
    gsap.fromTo(img, { yPercent: 46 }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: "#contact", start: "top bottom", end: "bottom bottom", scrub: true }
    });
  })();

  /* ---------- background videos: graceful fallback ---------- */
  document.querySelectorAll("video[data-bg]").forEach(function (v) {
    v.addEventListener("error", function () { v.style.display = "none"; }, true);
    v.playbackRate = 0.85;
    var src = v.querySelector("source");
    if (src) src.addEventListener("error", function () { v.style.display = "none"; });
  });
})();
