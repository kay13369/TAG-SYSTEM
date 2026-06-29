/* ============================================================
   TAG System — login & registration
   ============================================================ */
(function () {
  "use strict";
  const { $, toast } = UI;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // If already signed in, skip straight to the right dashboard.
  const existing = TAGDB.Auth.current();
  if (existing) {
    location.href = existing.role === "admin" ? "admin.html" : "portal.html";
    return;
  }

  function go(user) {
    location.href = user.role === "admin" ? "admin.html" : "portal.html";
  }

  function markInvalid(input, condition) {
    const wrap = input.closest(".field");
    wrap.classList.toggle("invalid", !condition);
    return condition;
  }

  // ---- Password strength ----
  // Score 0-4 based on length + character-class variety.
  function pwScore(p) {
    if (!p) return 0;
    let classes = 0;
    if (/[a-z]/.test(p)) classes++;
    if (/[A-Z]/.test(p)) classes++;
    if (/\d/.test(p)) classes++;
    if (/[^A-Za-z0-9]/.test(p)) classes++;
    if (p.length < 8) return 1;            // too short → always weak
    if (classes <= 1) return 1;            // long but no variety → weak
    if (classes === 2) return 2;           // fair
    if (classes === 3) return 3;           // good
    return 4;                              // strong: 8+ chars, all 4 classes
  }
  // Acceptable to submit: at least 8 chars AND 3 of the 4 character classes (score ≥ 3).
  function pwStrong(p) { return pwScore(p) >= 3; }

  const PW_LABELS = {
    0: "Use 8+ characters with upper & lower case, a number and a symbol.",
    1: "Weak — add length and a mix of character types.",
    2: "Fair — add another character type (upper, lower, number or symbol).",
    3: "Good password.",
    4: "Strong password.",
  };

  // ---- View switching ----
  const loginView = $("#loginView");
  const registerView = $("#registerView");
  $("#toRegister").addEventListener("click", (e) => { e.preventDefault(); loginView.style.display = "none"; registerView.style.display = "block"; });
  $("#toLogin").addEventListener("click", (e) => { e.preventDefault(); registerView.style.display = "none"; loginView.style.display = "block"; });

  const forgot = $("#forgotLink");
  if (forgot) forgot.addEventListener("click", (e) => {
    e.preventDefault();
    toast("Password resets are handled by TAG support — call (+267) 398-1932 or email info@tag.co.bw.", "info");
  });

  // Clear invalid state on input everywhere
  document.querySelectorAll("input").forEach((el) =>
    el.addEventListener("input", () => el.closest(".field").classList.remove("invalid"))
  );

  // ---- Login ----
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#lEmail");
    const pass = $("#lPass");
    let ok = markInvalid(email, emailRe.test(email.value.trim()));
    ok = markInvalid(pass, pass.value.length > 0) && ok;
    if (!ok) return;

    const user = TAGDB.Auth.login(email.value.trim(), pass.value);
    if (!user) {
      toast("Incorrect email or password.", "error");
      return;
    }
    toast("Welcome back, " + user.name.split(" ")[0] + "!", "success");
    setTimeout(() => go(user), 500);
  });

  // ---- Register ----
  $("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#rName"), company = $("#rCompany"), email = $("#rEmail"),
          phone = $("#rPhone"), pass = $("#rPass");

    const confirm = $("#rConfirm");
    let ok = markInvalid(name, name.value.trim().length > 0);
    ok = markInvalid(company, company.value.trim().length > 0) && ok;
    ok = markInvalid(email, emailRe.test(email.value.trim())) && ok;
    ok = markInvalid(phone, phone.value.trim().length > 0) && ok;
    ok = markInvalid(pass, pwStrong(pass.value)) && ok;
    ok = markInvalid(confirm, confirm.value.length > 0 && confirm.value === pass.value) && ok;
    if (!ok) return;

    const result = TAGDB.Auth.register({
      name: name.value.trim(),
      company: company.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      password: pass.value,
    });

    if (result.error) {
      markInvalid(email, false);
      toast(result.error, "error");
      return;
    }
    toast("Account created — welcome to TAG!", "success");
    setTimeout(() => go(result.user), 500);
  });

  // ---- Live password-strength meter ----
  const rPass = $("#rPass"), pwMeter = $("#pwMeter"), pwLabel = $("#pwLabel"), rConfirm = $("#rConfirm");
  if (rPass && pwMeter) {
    rPass.addEventListener("input", () => {
      const score = pwScore(rPass.value);
      pwMeter.setAttribute("data-score", String(score));
      if (pwLabel) pwLabel.textContent = PW_LABELS[score];
      // if confirm was flagged, re-check the match as the password changes
      if (rConfirm && rConfirm.closest(".field").classList.contains("invalid")) {
        rConfirm.closest(".field").classList.toggle("invalid", rConfirm.value !== rPass.value);
      }
    });
  }

  // ---- Show / hide password (the padlock icon is the toggle) ----
  document.querySelectorAll('.auth-card input[type="password"]').forEach((input) => {
    const icon = input.closest(".input-wrap").querySelector(".in-ic");
    if (!icon) return;
    icon.classList.add("in-ic--toggle");
    icon.setAttribute("role", "button");
    icon.setAttribute("tabindex", "0");
    icon.setAttribute("aria-label", "Show password");
    icon.setAttribute("title", "Show password");

    function toggle() {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      icon.classList.toggle("revealed", show);
      const label = show ? "Hide password" : "Show password";
      icon.setAttribute("aria-label", label);
      icon.setAttribute("title", label);
    }
    icon.addEventListener("click", toggle);
    icon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
})();
