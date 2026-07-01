/* ============================================================
   TAG System — FX engine
   Dependency-free motion/effects: particle network, live sparkline,
   scroll-reveal, count-up, 3D tilt, cursor glow, typewriter, marquees.
   All effects respect prefers-reduced-motion and degrade gracefully.
   Exposes window.FX.scan(root) so dynamically-rendered views can opt in.
   ============================================================ */
(function (global) {
  "use strict";

  // Mark the document as FX-capable. The reveal hidden-state is gated on this
  // class, so if this file ever fails to load, content stays fully visible.
  document.documentElement.classList.add("fx-ready");

  const reduce =
    global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = global.matchMedia && global.matchMedia("(pointer: fine)").matches;
  const raf = global.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---------- 1. Scroll reveal ---------- */
  let revealIO = null;
  function reveal(root) {
    const els = (root || document).querySelectorAll("[data-reveal]:not([data-fx-rv])");
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in global)) {
      els.forEach((e) => { e.setAttribute("data-fx-rv", "1"); e.classList.add("in"); });
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              const el = en.target;
              const d = el.getAttribute("data-reveal-delay");
              if (d) el.style.transitionDelay = d + "ms";
              el.classList.add("in");
              revealIO.unobserve(el);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
      );
    }
    els.forEach((e) => { e.setAttribute("data-fx-rv", "1"); revealIO.observe(e); });
  }

  /* ---------- 2. Count up ---------- */
  function animateCount(el) {
    const target = parseFloat(el.getAttribute("data-count")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const prefix = el.getAttribute("data-prefix") || "";
    const dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduce) { el.textContent = prefix + target.toFixed(dec) + suffix; return; }
    const dur = 1400; let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
      if (p < 1) raf(step);
    }
    raf(step);
  }
  let countIO = null;
  function countUp(root) {
    const els = (root || document).querySelectorAll("[data-count]:not([data-fx-ct])");
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in global)) {
      els.forEach((e) => { e.setAttribute("data-fx-ct", "1"); animateCount(e); });
      return;
    }
    if (!countIO) {
      countIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) { animateCount(en.target); countIO.unobserve(en.target); }
          });
        },
        { threshold: 0.6 }
      );
    }
    els.forEach((e) => { e.setAttribute("data-fx-ct", "1"); countIO.observe(e); });
  }

  /* ---------- 3. 3D tilt ---------- */
  function tilt(root) {
    if (reduce || !fine) return;
    const els = (root || document).querySelectorAll("[data-tilt]:not([data-fx-tl])");
    els.forEach((el) => {
      el.setAttribute("data-fx-tl", "1");
      const max = 9;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transform =
          "perspective(820px) rotateX(" + (py - 0.5) * -2 * max + "deg) rotateY(" +
          (px - 0.5) * 2 * max + "deg) translateY(-5px)";
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- 4. Cursor glow ---------- */
  function cursorGlow() {
    if (reduce || !fine) return;
    if (document.querySelector(".cursor-glow")) return;
    const g = document.createElement("div");
    g.className = "cursor-glow";
    g.setAttribute("aria-hidden", "true");
    document.body.appendChild(g);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      g.style.transform = "translate(" + (x - 160) + "px," + (y - 160) + "px)";
      raf(loop);
    })();
  }

  /* ---------- 5. Typewriter ---------- */
  function typewriter() {
    const el = document.querySelector("[data-typewriter]");
    if (!el) return;
    let words;
    try { words = JSON.parse(el.getAttribute("data-typewriter")); } catch (e) { return; }
    if (!words || !words.length) return;
    if (reduce) { el.textContent = words[0]; return; }
    let wi = 0, ci = 0, del = false;
    (function tick() {
      const w = words[wi];
      el.textContent = w.slice(0, ci);
      if (!del) { ci++; if (ci > w.length) { del = true; return setTimeout(tick, 1600); } }
      else { ci--; if (ci < 0) { del = false; wi = (wi + 1) % words.length; ci = 0; } }
      setTimeout(tick, del ? 40 : 85);
    })();
  }

  /* ---------- 6. Particle network ---------- */
  function particles() {
    const canvas = document.getElementById("fx-hero-canvas");
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    let W = 0, H = 0, nodes = [], rafId = 0;
    const mouse = { x: -9999, y: -9999 };

    function build() {
      const count = Math.max(24, Math.min(80, Math.floor((W * H) / 15000)));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45 });
      }
    }
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        const dxm = n.x - mouse.x, dym = n.y - mouse.y, dm = Math.hypot(dxm, dym);
        if (dm < 130 && dm > 0) { n.x += (dxm / dm) * 1.4; n.y += (dym / dm) * 1.4; }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < 132) {
            ctx.strokeStyle = "rgba(0,194,203," + (1 - d / 132) * 0.45 + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        ctx.fillStyle = "rgba(103,232,249,0.9)";
        ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 1.7, 0, 6.3); ctx.fill();
      }
      rafId = raf(frame);
    }
    addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(rafId); }
      else { rafId = raf(frame); }
    });
    resize(); frame();
  }

  /* ---------- 7. Live sparkline (hero console) ---------- */
  function sparkline() {
    const c = document.getElementById("fx-spark");
    if (!c || reduce) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    function size() { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener("resize", size);
    const data = [];
    for (let i = 0; i < 44; i++) data.push(Math.random() * 0.5 + 0.28);
    let t = 0;
    (function loop() {
      t++;
      if (t % 7 === 0) {
        data.push(Math.min(1, Math.max(0.12, data[data.length - 1] + (Math.random() - 0.5) * 0.3)));
        data.shift();
      }
      const W = c.clientWidth, H = c.clientHeight, step = W / (data.length - 1);
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      data.forEach((v, i) => { const x = i * step, y = H - v * H; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "#00c2cb"); grad.addColorStop(1, "#3b82f6");
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = "rgba(0,194,203,0.10)"; ctx.fill();
      raf(loop);
    })();
  }

  /* ---------- 8. Live operations ticker ---------- */
  function ticker() {
    const el = document.getElementById("fx-ticker");
    if (!el || el.getAttribute("data-fx-tk")) return;
    el.setAttribute("data-fx-tk", "1");
    let items = [];
    try {
      if (global.TAGDB) {
        TAGDB.Tickets.all().slice(0, 5).forEach((t) =>
          items.push("🎫 " + t.subject + " — " + t.status.replace("-", " ")));
        TAGDB.Quotes.all().slice(0, 2).forEach((q) =>
          items.push("📄 Quote · " + q.service + " (" + q.status + ")"));
      }
    } catch (e) {}
    if (!items.length) {
      items = ["🛡️ Threat blocked", "☁️ Microsoft 365 provisioned", "📶 Network survey scheduled",
        "✅ Backup verified", "🔐 Access control online", "🖥️ 42 endpoints monitored"];
    }
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const span = (s) => '<span class="fx-ticker__item">' + esc(s) + "</span>";
    const html = items.concat(items).map(span).join("");
    el.innerHTML = '<div class="fx-ticker__track' + (reduce ? " is-static" : "") + '">' + html + "</div>";
  }

  /* ---------- public API ---------- */
  function scan(root) { reveal(root); countUp(root); tilt(root); }

  function init() {
    scan(document);
    // cursorGlow();  // disabled — no mouse-follow glow
    typewriter();
    particles();
    sparkline();
    ticker();
  }

  global.FX = { scan, reveal, countUp, tilt };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
