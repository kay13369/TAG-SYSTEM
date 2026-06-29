/* ============================================================
   TAG System — Data Layer
   A tiny localStorage-backed "database" so the whole system
   works end-to-end with no server. Namespaced under "tag_".
   ============================================================ */
(function (global) {
  "use strict";

  const KEYS = {
    users: "tag_users",
    tickets: "tag_tickets",
    quotes: "tag_quotes",
    inquiries: "tag_inquiries",
    session: "tag_session",
    seeded: "tag_seeded_v1",
  };

  /* ---------- low-level helpers ---------- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid(prefix) {
    return (
      (prefix || "id") +
      "_" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7)
    );
  }
  function now() {
    return new Date().toISOString();
  }

  /* ---------- seed demo data on first run ---------- */
  function seed() {
    if (localStorage.getItem(KEYS.seeded)) return;

    const adminId = "usr_admin";
    const clientId = "usr_demo";

    write(KEYS.users, [
      {
        id: adminId,
        name: "TAG Administrator",
        email: "admin@tag.co.bw",
        password: "admin123",
        company: "Technology Affiliates Group",
        phone: "+267 398 1932",
        role: "admin",
        createdAt: now(),
      },
      {
        id: clientId,
        name: "Kabo Moeng",
        email: "client@demo.com",
        password: "client123",
        company: "Kalahari Logistics (Pty) Ltd",
        phone: "+267 711 22 333",
        role: "client",
        createdAt: now(),
      },
    ]);

    write(KEYS.tickets, [
      {
        id: uid("tkt"),
        userId: clientId,
        subject: "Office Wi-Fi keeps dropping in the warehouse",
        category: "IT Infrastructure & Support",
        priority: "High",
        status: "in-progress",
        description:
          "Staff in the warehouse lose connectivity every few minutes. Started after we added the new racking. Roughly 12 devices affected.",
        createdAt: "2026-06-22T08:14:00.000Z",
        updatedAt: "2026-06-23T10:02:00.000Z",
        replies: [
          {
            author: "TAG Administrator",
            role: "admin",
            message:
              "Thanks Kabo — looks like a coverage gap. We'll bring a survey kit on Wednesday and quote an access point if needed.",
            at: "2026-06-23T10:02:00.000Z",
          },
        ],
      },
      {
        id: uid("tkt"),
        userId: clientId,
        subject: "Request: Microsoft 365 licences for 5 new staff",
        category: "Cloud & Microsoft Solutions",
        priority: "Medium",
        status: "open",
        description:
          "We've hired 5 new people in finance. Need Business Standard mailboxes and Teams set up before month-end.",
        createdAt: "2026-06-25T13:40:00.000Z",
        updatedAt: "2026-06-25T13:40:00.000Z",
        replies: [],
      },
      {
        id: uid("tkt"),
        userId: clientId,
        subject: "Suspicious phishing email reported by reception",
        category: "Cybersecurity",
        priority: "Critical",
        status: "resolved",
        description:
          "Reception received an email pretending to be from the bank asking to reset card details. Did anyone click it?",
        createdAt: "2026-06-18T07:05:00.000Z",
        updatedAt: "2026-06-18T15:20:00.000Z",
        replies: [
          {
            author: "TAG Administrator",
            role: "admin",
            message:
              "Confirmed phishing. No clicks detected in the mail logs. We've blocked the sender domain and added a banner rule for external mail.",
            at: "2026-06-18T15:20:00.000Z",
          },
        ],
      },
    ]);

    write(KEYS.quotes, [
      {
        id: uid("qte"),
        userId: clientId,
        name: "Kabo Moeng",
        email: "client@demo.com",
        company: "Kalahari Logistics (Pty) Ltd",
        service: "Security & Access Control",
        budget: "P50,000 – P150,000",
        details:
          "Want biometric access control on 3 doors plus 6 IP cameras with 30-day cloud retention.",
        status: "reviewing",
        createdAt: "2026-06-24T09:00:00.000Z",
      },
    ]);

    write(KEYS.inquiries, [
      {
        id: uid("inq"),
        name: "Lesego Tau",
        email: "lesego@brightschools.ac.bw",
        subject: "Computer lab setup for a school",
        message:
          "We're opening a new campus and need 40 workstations, networking and a server room. Can you advise?",
        createdAt: "2026-06-20T11:30:00.000Z",
        read: false,
      },
    ]);

    localStorage.setItem(KEYS.seeded, "1");
  }

  /* ---------- collections ---------- */
  const Users = {
    all: () => read(KEYS.users, []),
    byId: (id) => Users.all().find((u) => u.id === id) || null,
    byEmail: (email) =>
      Users.all().find(
        (u) => u.email.toLowerCase() === String(email).toLowerCase()
      ) || null,
    create(data) {
      const users = Users.all();
      const user = {
        id: uid("usr"),
        role: "client",
        createdAt: now(),
        ...data,
      };
      users.push(user);
      write(KEYS.users, users);
      return user;
    },
  };

  const Tickets = {
    all: () => read(KEYS.tickets, []),
    byUser: (userId) => Tickets.all().filter((t) => t.userId === userId),
    byId: (id) => Tickets.all().find((t) => t.id === id) || null,
    create(data) {
      const tickets = Tickets.all();
      const ticket = {
        id: uid("tkt"),
        status: "open",
        priority: "Medium",
        replies: [],
        createdAt: now(),
        updatedAt: now(),
        ...data,
      };
      tickets.unshift(ticket);
      write(KEYS.tickets, tickets);
      return ticket;
    },
    update(id, changes) {
      const tickets = Tickets.all();
      const idx = tickets.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      tickets[idx] = { ...tickets[idx], ...changes, updatedAt: now() };
      write(KEYS.tickets, tickets);
      return tickets[idx];
    },
    addReply(id, reply) {
      const ticket = Tickets.byId(id);
      if (!ticket) return null;
      const replies = ticket.replies.concat([{ ...reply, at: now() }]);
      return Tickets.update(id, { replies });
    },
  };

  const Quotes = {
    all: () => read(KEYS.quotes, []),
    byUser: (userId) => Quotes.all().filter((q) => q.userId === userId),
    byId: (id) => Quotes.all().find((q) => q.id === id) || null,
    create(data) {
      const quotes = Quotes.all();
      const quote = {
        id: uid("qte"),
        status: "new",
        createdAt: now(),
        ...data,
      };
      quotes.unshift(quote);
      write(KEYS.quotes, quotes);
      return quote;
    },
    update(id, changes) {
      const quotes = Quotes.all();
      const idx = quotes.findIndex((q) => q.id === id);
      if (idx === -1) return null;
      quotes[idx] = { ...quotes[idx], ...changes };
      write(KEYS.quotes, quotes);
      return quotes[idx];
    },
  };

  const Inquiries = {
    all: () => read(KEYS.inquiries, []),
    create(data) {
      const list = Inquiries.all();
      const item = { id: uid("inq"), read: false, createdAt: now(), ...data };
      list.unshift(item);
      write(KEYS.inquiries, list);
      return item;
    },
    update(id, changes) {
      const list = Inquiries.all();
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...changes };
      write(KEYS.inquiries, list);
      return list[idx];
    },
  };

  /* ---------- auth / session ---------- */
  const Auth = {
    login(email, password) {
      const user = Users.byEmail(email);
      if (!user || user.password !== password) return null;
      write(KEYS.session, { userId: user.id, role: user.role });
      return user;
    },
    register(data) {
      if (Users.byEmail(data.email)) {
        return { error: "An account with that email already exists." };
      }
      const user = Users.create({ ...data, role: "client" });
      write(KEYS.session, { userId: user.id, role: user.role });
      return { user };
    },
    logout() {
      localStorage.removeItem(KEYS.session);
    },
    current() {
      const s = read(KEYS.session, null);
      return s ? Users.byId(s.userId) : null;
    },
    /** Redirects to login if not authed (or wrong role). Returns the user. */
    requireRole(role, loginUrl) {
      const user = Auth.current();
      if (!user || (role && user.role !== role)) {
        location.href = loginUrl || "login.html";
        return null;
      }
      return user;
    },
  };

  /* ---------- expose ---------- */
  global.TAGDB = {
    KEYS,
    seed,
    Users,
    Tickets,
    Quotes,
    Inquiries,
    Auth,
    uid,
    now,
    /** wipe everything and re-seed (used by the demo "reset" button) */
    reset() {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
      seed();
    },
  };

  seed();
})(window);
