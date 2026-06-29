/* ============================================================
   TAG System — shared UI helpers
   ============================================================ */
(function (global) {
  "use strict";

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /** Escape user-supplied text before inserting into innerHTML. */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Truncate raw text to n chars (adds …), THEN escape — avoids cutting an entity. */
  function truncate(str, n) {
    const s = String(str == null ? "" : str);
    return esc(s.length > n ? s.slice(0, n) + "…" : s);
  }

  /** "22 Jun 2026" */
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  /** "22 Jun 2026, 10:14" */
  function fmtDateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  /** Relative-ish: "2 days ago" / falls back to date */
  function timeAgo(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + " min ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
    return fmtDate(iso);
  }

  function initials(name) {
    return String(name || "?")
      .trim().split(/\s+/).slice(0, 2)
      .map((s) => s[0]).join("").toUpperCase();
  }

  /** Toast notification */
  function toast(message, type) {
    let wrap = $(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const t = document.createElement("div");
    t.className = "toast" + (type ? " toast--" + type : "");
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    t.innerHTML = '<span class="ic">' + icon + "</span><span>" + esc(message) + "</span>";
    wrap.appendChild(t);
    setTimeout(() => {
      t.style.transition = "opacity .3s, transform .3s";
      t.style.opacity = "0";
      t.style.transform = "translateY(10px)";
      setTimeout(() => t.remove(), 300);
    }, 3200);
  }

  /** Status label prettifier: "in-progress" -> "In Progress" */
  function label(status) {
    return String(status || "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  /** Read ?key=value from the URL */
  function param(key) {
    return new URLSearchParams(location.search).get(key);
  }

  /** Simple modal control by element id */
  const modal = {
    open(id) { const m = document.getElementById(id); if (m) m.classList.add("open"); },
    close(id) { const m = document.getElementById(id); if (m) m.classList.remove("open"); },
  };

  global.UI = { $, $$, esc, truncate, fmtDate, fmtDateTime, timeAgo, initials, toast, label, param, modal };
})(window);
