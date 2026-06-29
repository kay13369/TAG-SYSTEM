# TAG — Technology Affiliates Group

A complete front-end business system for **tag.co.bw**, an IT solutions company in
Gaborone, Botswana. Built with plain HTML, CSS, and JavaScript — no build step and
no server required. All data is stored in the browser via `localStorage`, seeded with
demo content on first load.

## What's included

| Page | Purpose |
| --- | --- |
| `index.html` | Public marketing site — hero, 8 services, why-TAG, process, partners, contact form |
| `login.html` | Sign in / register (clients) |
| `portal.html` | **Client portal** — dashboard, support tickets (with threaded replies), quote requests, profile |
| `admin.html` | **Admin console** — overview metrics, all tickets, quotes, website inquiries, clients |

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Client | `client@demo.com` | `client123` |
| Admin | `admin@tag.co.bw` | `admin123` |

You can also register a brand-new client account from the login page.

## How it works end-to-end

- The **contact form** on the website creates an *inquiry* → shows up under **Inquiries** in the admin console.
- A **client** logs a *ticket* in the portal → the **admin** sees it, replies, and changes its status/priority → the client sees the reply and updated status.
- A client (or the site) requests a *quote* → the admin moves it through `new → reviewing → sent → won/lost`.
- The admin's **"Reset demo data"** button restores the original seeded state at any time.

## Running it

It's a static site — open `index.html` directly, or serve the folder:

```bash
# Python
python -m http.server 4178 --directory TAG-System

# or Node
npx http-server TAG-System -p 4178
```

Then visit <http://localhost:4178>.

## File structure

```
TAG-System/
├── index.html          marketing site
├── login.html          auth
├── portal.html         client portal shell
├── admin.html          admin console shell
├── css/
│   └── styles.css       design system (tokens, components, layouts, responsive)
└── js/
    ├── db.js            localStorage "database" + seed data + auth
    ├── ui.js            shared helpers (toast, modal, escaping, dates)
    ├── main.js          marketing site interactions
    ├── auth.js          login / registration
    ├── portal.js        client portal logic
    └── admin.js         admin console logic
```

## Notes

This is a front-end demo: passwords are stored in plain text in `localStorage` purely
so the system is self-contained and works with no backend. For production you'd move
authentication, data, and ticketing to a real server (e.g. PHP + MySQL) — the UI and
data model here map cleanly onto that.
