/* ============================================================
   TAG System — Admin Console
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, esc, truncate, fmtDate, fmtDateTime, timeAgo, initials, toast, label } = UI;

  const user = TAGDB.Auth.requireRole("admin", "login.html");
  if (!user) return;

  $("#userAvatar").textContent = initials(user.name);
  $("#userName").textContent = user.name;
  $("#logoutBtn").addEventListener("click", () => { TAGDB.Auth.logout(); location.href = "login.html"; });
  $("#resetBtn").addEventListener("click", () => {
    if (confirm("Reset all demo data back to its original seeded state?")) {
      TAGDB.reset();
      toast("Demo data reset.", "success");
      navigate("dashboard");
    }
  });

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
    dashboard: ["Overview", "Operations at a glance"],
    tickets: ["Tickets", "Every client support request"],
    quotes: ["Quotes", "Manage quote requests"],
    inquiries: ["Inquiries", "Messages from the website contact form"],
    clients: ["Clients", "Registered client accounts"],
  };

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
      inquiries: renderInquiries,
      clients: renderClients,
      ticket: renderTicketDetail,
    }[view] || renderDashboard)(arg);
  }
  $$("#sideNav a").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); navigate(a.dataset.view); })
  );

  const clientName = (id) => { const u = TAGDB.Users.byId(id); return u ? u.name : "Unknown"; };
  const clientCompany = (id) => { const u = TAGDB.Users.byId(id); return u ? u.company : ""; };
  function byNewest(a, b) { return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt); }
  function emptyState(ico, title, sub) {
    return `<div class="empty"><div class="ico">${ico}</div><h3>${esc(title)}</h3><p>${esc(sub)}</p></div>`;
  }
  function statCard(tone, icon, num, lbl) {
    return `<div class="stat"><div class="stat__top"><div class="stat__icon ${tone}">${icon}</div></div>
      <div class="num">${num}</div><div class="lbl">${lbl}</div></div>`;
  }

  // ---- Overview ----
  function renderDashboard() {
    const tickets = TAGDB.Tickets.all();
    const quotes = TAGDB.Quotes.all();
    const inquiries = TAGDB.Inquiries.all();
    const clients = TAGDB.Users.all().filter((u) => u.role === "client");

    const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in-progress");
    const critical = tickets.filter((t) => t.priority === "Critical" && t.status !== "closed" && t.status !== "resolved");
    const unread = inquiries.filter((i) => !i.read);
    const newQuotes = quotes.filter((q) => q.status === "new" || q.status === "reviewing");

    const queue = openTickets.slice().sort(byNewest).slice(0, 5);

    content.innerHTML = `
      <div class="stats">
        ${statCard("tone-amber", "🎫", openTickets.length, "Open tickets")}
        ${statCard("tone-red", "🚨", critical.length, "Critical & unresolved")}
        ${statCard("tone-cyan", "📄", newQuotes.length, "Quotes to action")}
        ${statCard("tone-blue", "✉️", unread.length, "Unread inquiries")}
      </div>
      <div class="stats stats--3">
        ${statCard("tone-green", "✓", tickets.filter((t)=>t.status==="resolved"||t.status==="closed").length, "Resolved tickets")}
        ${statCard("tone-purple", "🏢", clients.length, "Active clients")}
        ${statCard("tone-blue", "📊", tickets.length, "Tickets all-time")}
      </div>

      <div class="panel">
        <div class="panel__head"><h3>Work queue · open tickets</h3><a href="#" class="pill-link" id="allTickets">View all →</a></div>
        ${queue.length ? adminTicketTable(queue) : emptyState("✓", "All clear", "No open tickets right now.")}
      </div>`;

    $("#allTickets").addEventListener("click", (e) => { e.preventDefault(); navigate("tickets"); });
    wireTicketRows();
  }

  // ---- Tickets ----
  function renderTickets() {
    const tickets = TAGDB.Tickets.all().slice().sort(byNewest);
    content.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <div class="toolbar">
            <input class="search" id="search" type="search" placeholder="Search subject or client…" />
            <select id="statusFilter">
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select id="priFilter">
              <option value="">All priorities</option>
              <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
        </div>
        <div id="wrap">${tickets.length ? adminTicketTable(tickets) : emptyState("🎫", "No tickets", "Tickets logged by clients appear here.")}</div>
      </div>`;

    const search = $("#search"), sf = $("#statusFilter"), pf = $("#priFilter");
    function apply() {
      const q = search.value.toLowerCase().trim();
      const filtered = tickets.filter((t) =>
        (!sf.value || t.status === sf.value) &&
        (!pf.value || t.priority === pf.value) &&
        (!q || (t.subject + " " + clientName(t.userId) + " " + clientCompany(t.userId)).toLowerCase().includes(q))
      );
      $("#wrap").innerHTML = filtered.length ? adminTicketTable(filtered) : emptyState("🔍", "No matches", "Adjust your search or filters.");
      wireTicketRows();
    }
    [search, sf, pf].forEach((el) => el.addEventListener("input", apply));
    wireTicketRows();
  }

  function adminTicketTable(tickets) {
    return `<table class="table"><thead><tr>
      <th>Subject</th><th>Client</th><th>Priority</th><th>Status</th><th>Updated</th>
    </tr></thead><tbody>
    ${tickets.map((t) => `
      <tr class="row-link" data-ticket="${t.id}">
        <td><div class="t-title">${esc(t.subject)}</div><div class="t-sub">${esc(t.category)} · #${t.id.slice(-6)}</div></td>
        <td><div class="t-title" style="font-weight:600">${esc(clientName(t.userId))}</div><div class="t-sub">${esc(clientCompany(t.userId))}</div></td>
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
    if (!t) { navigate("tickets"); return; }
    const c = TAGDB.Users.byId(t.userId);
    pageTitle.textContent = "Ticket #" + t.id.slice(-6);
    pageSub.textContent = t.subject;
    setActive("tickets");

    const thread = [{ author: c ? c.name : "Client", role: "client", message: t.description, at: t.createdAt }]
      .concat(t.replies);
    const statuses = ["open", "in-progress", "resolved", "closed"];

    content.innerHTML = `
      <a href="#" class="back-link" id="back">← Back to tickets</a>
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
            <form id="replyForm" style="margin-top:22px">
              <div class="field" style="margin-bottom:12px"><label for="replyMsg">Reply to client</label><textarea id="replyMsg" placeholder="Type your response…"></textarea></div>
              <button type="submit" class="btn btn-primary">Send Reply</button>
            </form>
          </div>
        </div>
        <div class="panel">
          <div class="panel__head"><h3>Manage</h3></div>
          <div class="panel__body">
            <div class="field"><label for="statusSel">Status</label>
              <select id="statusSel">${statuses.map((s) => `<option value="${s}" ${s === t.status ? "selected" : ""}>${label(s)}</option>`).join("")}</select>
            </div>
            <div class="field"><label for="priSel">Priority</label>
              <select id="priSel">${["Low","Medium","High","Critical"].map((p) => `<option ${p === t.priority ? "selected" : ""}>${p}</option>`).join("")}</select>
            </div>
            <button class="btn btn-dark btn-block" id="saveBtn" style="margin-bottom:18px">Save changes</button>
            <ul class="meta-list">
              <li><span class="k">Client</span><span class="v">${esc(c ? c.name : "—")}</span></li>
              <li><span class="k">Company</span><span class="v">${esc(c ? c.company : "—")}</span></li>
              <li><span class="k">Email</span><span class="v">${esc(c ? c.email : "—")}</span></li>
              <li><span class="k">Category</span><span class="v">${esc(t.category)}</span></li>
              <li><span class="k">Created</span><span class="v">${fmtDate(t.createdAt)}</span></li>
            </ul>
          </div>
        </div>
      </div>`;

    $("#back").addEventListener("click", (e) => { e.preventDefault(); navigate("tickets"); });
    $("#saveBtn").addEventListener("click", () => {
      TAGDB.Tickets.update(t.id, { status: $("#statusSel").value, priority: $("#priSel").value });
      toast("Ticket updated.", "success");
      navigate("ticket", t.id);
    });
    $("#replyForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = $("#replyMsg").value.trim();
      if (!msg) { toast("Please type a reply.", "error"); return; }
      TAGDB.Tickets.addReply(t.id, { author: user.name, role: "admin", message: msg });
      if (t.status === "open") TAGDB.Tickets.update(t.id, { status: "in-progress" });
      toast("Reply sent to client.", "success");
      navigate("ticket", t.id);
    });
  }

  // ---- Quotes ----
  function renderQuotes() {
    const quotes = TAGDB.Quotes.all().slice().sort(byNewest);
    const statuses = ["new", "reviewing", "sent", "won", "lost"];
    content.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h3>Quote requests</h3></div>
        ${quotes.length ? `
        <table class="table"><thead><tr><th>Client</th><th>Service</th><th>Budget</th><th>Status</th><th>Requested</th></tr></thead>
        <tbody>${quotes.map((q) => `
          <tr>
            <td><div class="t-title">${esc(q.name)}</div><div class="t-sub">${esc(q.company || q.email)}</div></td>
            <td><div>${esc(q.service)}</div><div class="t-sub">${truncate(q.details, 50)}</div></td>
            <td>${esc(q.budget)}</td>
            <td><select class="quote-status" data-id="${q.id}">${statuses.map((s)=>`<option value="${s}" ${s===q.status?"selected":""}>${label(s)}</option>`).join("")}</select></td>
            <td class="text-muted">${fmtDate(q.createdAt)}</td>
          </tr>`).join("")}
        </tbody></table>` : emptyState("📄", "No quote requests", "Requests from clients and the website appear here.")}
      </div>`;
    $$(".quote-status").forEach((sel) =>
      sel.addEventListener("change", () => {
        TAGDB.Quotes.update(sel.dataset.id, { status: sel.value });
        toast("Quote status updated.", "success");
      })
    );
  }

  // ---- Inquiries ----
  function renderInquiries() {
    const inquiries = TAGDB.Inquiries.all();
    content.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h3>Website inquiries</h3></div>
        ${inquiries.length ? `<div class="panel__body" style="display:flex;flex-direction:column;gap:14px">
          ${inquiries.map((i) => `
            <div class="msg ${i.read ? "" : "msg--admin"}" data-inq="${i.id}">
              <div class="msg__head">
                <div class="avatar" style="width:30px;height:30px;font-size:12px">${initials(i.name)}</div>
                <span class="who">${esc(i.name)}</span>
                ${i.read ? "" : '<span class="badge badge--new">New</span>'}
                <span class="when">${timeAgo(i.createdAt)}</span>
              </div>
              <p style="font-weight:700;margin-bottom:4px">${esc(i.subject)}</p>
              <p>${esc(i.message)}</p>
              <div style="margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                <a class="btn btn-ghost btn-sm" href="mailto:${esc(i.email)}">Reply by email</a>
                ${i.read ? "" : `<button class="btn btn-dark btn-sm mark-read" data-id="${i.id}">Mark as read</button>`}
                <span class="text-muted" style="font-size:13px">${esc(i.email)}</span>
              </div>
            </div>`).join("")}
        </div>` : emptyState("✉️", "No inquiries", "Messages sent from the website contact form land here.")}
      </div>`;
    $$(".mark-read").forEach((b) =>
      b.addEventListener("click", () => { TAGDB.Inquiries.update(b.dataset.id, { read: true }); renderInquiries(); })
    );
  }

  // ---- Clients ----
  function renderClients() {
    const clients = TAGDB.Users.all().filter((u) => u.role === "client");
    content.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h3>Client accounts</h3></div>
        ${clients.length ? `
        <table class="table"><thead><tr><th>Name</th><th>Company</th><th>Contact</th><th>Tickets</th><th>Joined</th></tr></thead>
        <tbody>${clients.map((c) => {
          const tk = TAGDB.Tickets.byUser(c.id).length;
          return `<tr>
            <td><div style="display:flex;align-items:center;gap:11px"><div class="avatar" style="width:34px;height:34px;font-size:13px">${initials(c.name)}</div><span class="t-title">${esc(c.name)}</span></div></td>
            <td>${esc(c.company || "—")}</td>
            <td><div>${esc(c.email)}</div><div class="t-sub">${esc(c.phone || "")}</div></td>
            <td>${tk}</td>
            <td class="text-muted">${fmtDate(c.createdAt)}</td>
          </tr>`;
        }).join("")}</tbody></table>` : emptyState("🏢", "No clients yet", "Registered clients appear here.")}
      </div>`;
  }

  function syncMenuBtn() {
    $("#menuBtn").style.display = window.matchMedia("(max-width: 980px)").matches ? "inline-flex" : "none";
  }
  syncMenuBtn();
  window.addEventListener("resize", syncMenuBtn);

  navigate("dashboard");
})();
