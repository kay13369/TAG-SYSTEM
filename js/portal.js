/* ============================================================
   TAG System — Client Portal
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, esc, truncate, fmtDate, fmtDateTime, timeAgo, initials, toast, label, modal } = UI;

  // Require a logged-in client
  const user = TAGDB.Auth.requireRole("client", "login.html");
  if (!user) return;

  // ---- Chrome ----
  $("#userAvatar").textContent = initials(user.name);
  $("#userName").textContent = user.name;
  $("#userRole").textContent = user.company || "client";
  $("#logoutBtn").addEventListener("click", () => { TAGDB.Auth.logout(); location.href = "login.html"; });

  const sidebar = $("#sidebar");
  $("#menuBtn").addEventListener("click", () => sidebar.classList.toggle("open"));
  // tap outside the drawer to close it on mobile
  document.addEventListener("click", (e) => {
    if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !e.target.closest("#menuBtn")) {
      sidebar.classList.remove("open");
    }
  });

  const content = $("#content");
  const pageTitle = $("#pageTitle");
  const pageSub = $("#pageSub");

  const TITLES = {
    dashboard: ["Dashboard", "Welcome back, " + user.name.split(" ")[0]],
    tickets: ["My Tickets", "Track and manage your support requests"],
    quotes: ["Quotes", "Your quote requests and their status"],
    profile: ["Profile", "Your account details"],
  };

  // ---- Routing ----
  function setActive(view) {
    $$("#sideNav a").forEach((a) => a.classList.toggle("active", a.dataset.view === view));
  }
  function navigate(view, arg) {
    sidebar.classList.remove("open");
    if (TITLES[view]) { pageTitle.textContent = TITLES[view][0]; pageSub.textContent = TITLES[view][1]; }
    setActive(view);
    ({
      dashboard: renderDashboard,
      tickets: renderTickets,
      quotes: renderQuotes,
      profile: renderProfile,
      ticket: renderTicketDetail,
    }[view] || renderDashboard)(arg);
    if (window.FX) FX.scan(content);
  }

  $$("#sideNav a").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); navigate(a.dataset.view); })
  );

  // ---- Views ----
  function statCard(tone, icon, num, lbl) {
    return `<div class="stat"><div class="stat__top"><div class="stat__icon ${tone}">${icon}</div></div>
      <div class="num" data-count="${num}">${num}</div><div class="lbl">${lbl}</div></div>`;
  }

  function renderDashboard() {
    const tickets = TAGDB.Tickets.byUser(user.id);
    const quotes = TAGDB.Quotes.byUser(user.id);
    const open = tickets.filter((t) => t.status === "open" || t.status === "in-progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

    const recent = tickets.slice().sort(byNewest).slice(0, 4);

    content.innerHTML = `
      <div class="stats">
        ${statCard("tone-blue", "🎫", tickets.length, "Total tickets")}
        ${statCard("tone-amber", "⏳", open, "Open / in progress")}
        ${statCard("tone-green", "✓", resolved, "Resolved")}
        ${statCard("tone-cyan", "📄", quotes.length, "Quote requests")}
      </div>

      <div class="panel">
        <div class="panel__head">
          <h3>Recent tickets</h3>
          <a href="#" class="pill-link" id="viewAllTickets">View all →</a>
        </div>
        ${recent.length ? ticketTable(recent) : emptyState("🎫", "No tickets yet", "Log your first support request to get started.")}
      </div>

      <div class="panel">
        <div class="panel__head">
          <h3>Need something new?</h3>
        </div>
        <div class="panel__body" style="display:flex;gap:14px;flex-wrap:wrap">
          <button class="btn btn-primary" id="dashNewTicket">+ Log a support ticket</button>
          <button class="btn btn-ghost" id="dashNewQuote">📄 Request a quote</button>
        </div>
      </div>`;

    $("#viewAllTickets").addEventListener("click", (e) => { e.preventDefault(); navigate("tickets"); });
    $("#dashNewTicket").addEventListener("click", openTicketModal);
    $("#dashNewQuote").addEventListener("click", openQuoteModal);
    wireTicketRows();
  }

  function renderTickets() {
    const tickets = TAGDB.Tickets.byUser(user.id).slice().sort(byNewest);
    content.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <div class="toolbar">
            <input class="search" id="ticketSearch" type="search" placeholder="Search tickets…" />
            <select id="statusFilter">
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="listNewTicket">+ New Ticket</button>
        </div>
        <div id="ticketTableWrap">
          ${tickets.length ? ticketTable(tickets) : emptyState("🎫", "No tickets yet", "Log your first support request to get started.")}
        </div>
      </div>`;

    $("#listNewTicket").addEventListener("click", openTicketModal);
    const search = $("#ticketSearch"), filter = $("#statusFilter");
    function apply() {
      const q = search.value.toLowerCase().trim();
      const s = filter.value;
      const filtered = tickets.filter((t) =>
        (!s || t.status === s) &&
        (!q || (t.subject + " " + t.category).toLowerCase().includes(q))
      );
      $("#ticketTableWrap").innerHTML = filtered.length
        ? ticketTable(filtered)
        : emptyState("🔍", "No matches", "Try a different search or filter.");
      wireTicketRows();
    }
    search.addEventListener("input", apply);
    filter.addEventListener("change", apply);
    wireTicketRows();
  }

  function ticketTable(tickets) {
    return `<table class="table"><thead><tr>
        <th>Subject</th><th>Category</th><th>Priority</th><th>Status</th><th>Updated</th>
      </tr></thead><tbody>
      ${tickets.map((t) => `
        <tr class="row-link" data-ticket="${t.id}">
          <td><div class="t-title">${esc(t.subject)}</div><div class="t-sub">#${t.id.slice(-6)}</div></td>
          <td>${esc(t.category)}</td>
          <td><span class="badge badge--${t.priority.toLowerCase()}">${esc(t.priority)}</span></td>
          <td><span class="badge badge--${t.status}">${label(t.status)}</span></td>
          <td class="text-muted">${timeAgo(t.updatedAt)}</td>
        </tr>`).join("")}
      </tbody></table>`;
  }

  function wireTicketRows() {
    $$(".row-link[data-ticket]").forEach((row) =>
      row.addEventListener("click", () => navigate("ticket", row.dataset.ticket))
    );
  }

  function renderTicketDetail(id) {
    const t = TAGDB.Tickets.byId(id);
    if (!t || t.userId !== user.id) { navigate("tickets"); return; }
    pageTitle.textContent = "Ticket #" + t.id.slice(-6);
    pageSub.textContent = t.subject;
    setActive("tickets");

    const thread = [{ author: user.name, role: "client", message: t.description, at: t.createdAt }]
      .concat(t.replies);

    content.innerHTML = `
      <a href="#" class="back-link" id="backToTickets">← Back to tickets</a>
      <div class="detail-grid">
        <div class="panel">
          <div class="panel__head"><h3>${esc(t.subject)}</h3><span class="badge badge--${t.status}">${label(t.status)}</span></div>
          <div class="panel__body">
            <div class="thread">
              ${thread.map((m) => `
                <div class="msg msg--${m.role}">
                  <div class="msg__head">
                    <div class="avatar" style="width:30px;height:30px;font-size:12px">${initials(m.author)}</div>
                    <span class="who">${esc(m.author)}</span>
                    ${m.role === "admin" ? '<span class="badge badge--medium">TAG</span>' : ""}
                    <span class="when">${fmtDateTime(m.at)}</span>
                  </div>
                  <p>${esc(m.message)}</p>
                </div>`).join("")}
            </div>
            ${t.status === "closed" ? '<p class="text-muted" style="margin-top:18px">This ticket is closed. Open a new ticket if you need further help.</p>' : `
            <form id="replyForm" style="margin-top:22px">
              <div class="field" style="margin-bottom:12px"><label for="replyMsg">Add a reply</label><textarea id="replyMsg" placeholder="Type your message…"></textarea></div>
              <button type="submit" class="btn btn-primary">Send Reply</button>
            </form>`}
          </div>
        </div>
        <div class="panel">
          <div class="panel__head"><h3>Details</h3></div>
          <div class="panel__body">
            <ul class="meta-list">
              <li><span class="k">Status</span><span class="v"><span class="badge badge--${t.status}">${label(t.status)}</span></span></li>
              <li><span class="k">Priority</span><span class="v"><span class="badge badge--${t.priority.toLowerCase()}">${esc(t.priority)}</span></span></li>
              <li><span class="k">Category</span><span class="v">${esc(t.category)}</span></li>
              <li><span class="k">Created</span><span class="v">${fmtDate(t.createdAt)}</span></li>
              <li><span class="k">Last update</span><span class="v">${fmtDate(t.updatedAt)}</span></li>
              <li><span class="k">Ticket ID</span><span class="v">#${t.id.slice(-6)}</span></li>
            </ul>
          </div>
        </div>
      </div>`;

    $("#backToTickets").addEventListener("click", (e) => { e.preventDefault(); navigate("tickets"); });
    const replyForm = $("#replyForm");
    if (replyForm) {
      replyForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const msg = $("#replyMsg").value.trim();
        if (!msg) { toast("Please type a message.", "error"); return; }
        TAGDB.Tickets.addReply(t.id, { author: user.name, role: "client", message: msg });
        if (t.status === "resolved") TAGDB.Tickets.update(t.id, { status: "open" });
        toast("Reply sent.", "success");
        navigate("ticket", t.id);
      });
    }
  }

  function renderQuotes() {
    const quotes = TAGDB.Quotes.byUser(user.id).slice().sort(byNewest);
    content.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h3>Your quote requests</h3>
          <button class="btn btn-primary btn-sm" id="listNewQuote">+ Request a quote</button>
        </div>
        ${quotes.length ? `
        <table class="table"><thead><tr><th>Service</th><th>Budget</th><th>Status</th><th>Requested</th></tr></thead>
        <tbody>${quotes.map((q) => `
          <tr><td><div class="t-title">${esc(q.service)}</div><div class="t-sub">${truncate(q.details, 60)}</div></td>
          <td>${esc(q.budget)}</td>
          <td><span class="badge badge--${q.status}">${label(q.status)}</span></td>
          <td class="text-muted">${fmtDate(q.createdAt)}</td></tr>`).join("")}
        </tbody></table>` : emptyState("📄", "No quote requests yet", "Tell us what you need and we'll scope it for you.")}
      </div>`;
    $("#listNewQuote").addEventListener("click", openQuoteModal);
  }

  function renderProfile() {
    content.innerHTML = `
      <div class="panel" style="max-width:560px">
        <div class="panel__head"><h3>Account details</h3></div>
        <div class="panel__body">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
            <div class="avatar" style="width:64px;height:64px;font-size:24px">${initials(user.name)}</div>
            <div><div style="font-size:20px;font-weight:800">${esc(user.name)}</div><div class="text-muted">${esc(user.company || "")}</div></div>
          </div>
          <ul class="meta-list">
            <li><span class="k">Email</span><span class="v">${esc(user.email)}</span></li>
            <li><span class="k">Phone</span><span class="v">${esc(user.phone || "—")}</span></li>
            <li><span class="k">Company</span><span class="v">${esc(user.company || "—")}</span></li>
            <li><span class="k">Member since</span><span class="v">${fmtDate(user.createdAt)}</span></li>
          </ul>
        </div>
      </div>`;
  }

  // ---- Helpers ----
  function emptyState(ico, title, sub) {
    return `<div class="empty"><div class="ico">${ico}</div><h3>${esc(title)}</h3><p>${esc(sub)}</p></div>`;
  }
  function byNewest(a, b) { return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt); }

  // ---- Modals ----
  function openTicketModal() { modal.open("ticketModal"); }
  function openQuoteModal() { modal.open("quoteModal"); }
  $("#newTicketBtn").addEventListener("click", openTicketModal);
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => modal.close(b.dataset.close)));
  $$(".modal-overlay").forEach((o) =>
    o.addEventListener("click", (e) => { if (e.target === o) o.classList.remove("open"); })
  );

  $("#ticketForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = $("#tSubject"), desc = $("#tDesc");
    let ok = true;
    [subject, desc].forEach((el) => {
      const valid = el.value.trim().length > 0;
      el.closest(".field").classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) return;

    TAGDB.Tickets.create({
      userId: user.id,
      subject: subject.value.trim(),
      category: $("#tCategory").value,
      priority: $("#tPriority").value,
      description: desc.value.trim(),
    });
    modal.close("ticketModal");
    $("#ticketForm").reset();
    toast("Ticket submitted — we'll be in touch shortly.", "success");
    navigate("tickets");
  });

  $("#quoteForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const details = $("#qDetails");
    const valid = details.value.trim().length > 0;
    details.closest(".field").classList.toggle("invalid", !valid);
    if (!valid) return;

    TAGDB.Quotes.create({
      userId: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      service: $("#qService").value,
      budget: $("#qBudget").value,
      details: details.value.trim(),
    });
    modal.close("quoteModal");
    $("#quoteForm").reset();
    toast("Quote request sent — we'll get back to you within 24 hours.", "success");
    navigate("quotes");
  });

  document.querySelectorAll(".modal input, .modal textarea").forEach((el) =>
    el.addEventListener("input", () => el.closest(".field").classList.remove("invalid"))
  );

  // Show menu button on small screens
  function syncMenuBtn() {
    $("#menuBtn").style.display = window.matchMedia("(max-width: 980px)").matches ? "inline-flex" : "none";
  }
  syncMenuBtn();
  window.addEventListener("resize", syncMenuBtn);

  navigate("dashboard");
})();
