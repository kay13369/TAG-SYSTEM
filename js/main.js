/* ============================================================
   TAG System — marketing site interactions
   ============================================================ */
(function () {
  "use strict";
  const { $, toast } = UI;

  // Year in footer
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const nav = $("#nav");
  const toggle = $("#navToggle");
  if (toggle) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    $(".nav__links").addEventListener("click", (e) => {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }

  // Contact form -> saves an inquiry, visible in the admin dashboard
  const form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = ["cName", "cEmail", "cSubject", "cMessage"];
      let ok = true;
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      fields.forEach((id) => {
        const input = $("#" + id);
        const wrap = input.closest(".field");
        let valid = input.value.trim().length > 0;
        if (id === "cEmail" && valid) valid = emailRe.test(input.value.trim());
        wrap.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });

      if (!ok) {
        toast("Please fix the highlighted fields.", "error");
        return;
      }

      TAGDB.Inquiries.create({
        name: $("#cName").value.trim(),
        email: $("#cEmail").value.trim(),
        subject: $("#cSubject").value.trim(),
        message: $("#cMessage").value.trim(),
      });

      form.reset();
      toast("Thanks! Your message has reached TAG — we'll reply within 24 hours.", "success");
    });

    // Clear the invalid state as the user types
    form.querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("input", () => el.closest(".field").classList.remove("invalid"));
    });
  }
})();
