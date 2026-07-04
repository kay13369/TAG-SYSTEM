# TAG System — Build Log

A record of the design & build session for the **Technology Affiliates Group (TAG)** web system.

- **Live site:** https://kay13369.github.io/TAG-SYSTEM/
- **Repository:** https://github.com/kay13369/TAG-SYSTEM
- **Local path:** `C:\Users\karab\Documents\HTML-CSS-PHP\TAG-System\`
- **Reference:** [tag.co.bw](https://tag.co.bw)

---

## 1. What it is

A complete, front-end **business system** for TAG — a 100% citizen-owned ICT
solutions company in Gaborone, Botswana (est. 2014). Built with **plain
HTML/CSS/JS, no frameworks, no build step**. All data lives in the browser via
`localStorage` (seeded with demo content), so every flow works end-to-end with
no server.

> ⚠️ **Prototype note:** because data is per-browser localStorage, accounts,
> tickets, and orders are **not shared** between visitors/devices. It's ideal as
> a demo/portfolio. A production version would move auth + data to a real backend
> (PHP+MySQL, Firebase, Supabase, etc.).

---

## 2. Pages & structure

```
TAG-System/
├── index.html        Marketing site (hero, about, services, why, process, partners, contact, map)
├── about.html        Dedicated About Us page (vision, mission, values, team, map)
├── shop.html         Shop (catalogue, cart drawer, checkout) — cart is client-only
├── login.html        Sign in / register (centred card, password strength + show/hide)
├── portal.html       Client portal (dashboard, tickets, quotes, shop link, profile)
├── admin.html        Admin console (overview, tickets, quotes, orders, inquiries, clients)
├── css/styles.css    Design system + dark-glass theme + FX + responsive layers
├── js/
│   ├── db.js         localStorage "database": users, tickets, quotes, inquiries, orders, cart, auth
│   ├── ui.js         shared helpers (toast, modal, escaping, dates, truncate)
│   ├── fx.js         effects engine (particles, sparkline, reveal, count-up, tilt, typewriter, ticker)
│   ├── main.js       public-site interactions (nav, contact form, cart badge, login-aware nav)
│   ├── auth.js       login / registration / password strength / show-hide
│   ├── portal.js     client portal logic
│   ├── admin.js      admin console logic
│   └── shop.js       shop catalogue, cart, checkout
└── assets/
    ├── tag-logo-dark.png, favicon.png, tag-logo.png
    ├── *.jpg          looping tech backgrounds + provided wallpapers
    ├── shop/          9 product photos
    └── services/      8 service photos + team photo
```

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Client | `client@demo.com` | `client123` |
| Admin | `admin@tag.co.bw` | `admin123` |

---

## 3. Features

**Marketing site**
- Cinematic hero: interactive **particle-network canvas**, typewriter headline,
  live **sparkline** console card, animated **count-up** metrics, working-hours pill.
- Scroll-reveal, 3D-tilt cards, live-ops ticker, vendor marquee.
- Real content from the official TAG company profile (about, vision, mission,
  7 core values, why-choose-us).
- **Services** section with real photos; **About Us** page with team photo.
- Contact form (saves inquiries), **embedded OpenStreetMap** at TAG's exact
  coordinates, social links, operating hours.

**Client portal** (login required)
- Dashboard with count-up stats, support tickets (threaded replies), quote
  requests, profile, and a **Shop** link.

**Shop** (browse public, **cart client-only**)
- Product catalogue (Hardware / Networking / Security) with real images and
  category filters.
- Slide-in **cart drawer** + **checkout** that creates an order.
- Guests can browse but see "Sign in to order"; signed-in clients get the full cart.

**Admin console** (login required)
- Overview metrics, ticket management, quote pipeline, **orders**, website
  inquiries, client list, and demo-data reset.

**System-wide**
- Immersive **dark-glass theme** over a **looping tech-photo background**.
- Fully **responsive** down to 320px (off-canvas sidebar, scrolling tables).
- Reduced-motion aware; fail-safe reveal; `?v=N` cache-busting on assets.

---

## 4. Session history (what was requested, in order)

1. **Build a "perfect system"** for tag.co.bw → chose full business system, HTML/CSS/JS + localStorage. Built marketing site, client portal, admin console.
2. Use the **real TAG logo** (downloaded from the site).
3. **Debug & fix errors** — the six `js/*.js` files had vanished from disk (OneDrive sync issue); recreated them.
4. Make the UI **beautiful with tech themes / background pictures**.
5. **No white backgrounds** — flipped the whole system to an immersive dark-glass theme over tech photos.
6. **Remove the white box behind the logo** → rendered the logo white, then made a proper swirl **favicon**, fixed everywhere.
7. **Redesigned login/register** into a centred card (icons, remember-me, blue button).
8. "Back to website" → **"Back to home"**.
9. **Removed demo-account info** from the pages.
10. Explained how the logo sits above the title.
11. **Looping tech background** ("pic loops") — crossfade slideshow of tech wallpapers.
12. **Show-password** via the padlock icon (no eye icon); removed its focus box; cyan tint when hidden.
13. **Confirm-password + strength meter** (min 8 chars, strong validation) on sign-up.
14. **Responsive below 475px** (fixed nav overflow, gutters, etc.).
15. **Hosting** → set up a dedicated Git repo, pushed to **kay13369/TAG-SYSTEM**, enabled GitHub Pages.
16. **Dashboards made fully responsive** (scrolling tables, responsive stats, mobile drawer, cache-busting).
17. **Removed "Claude" as a contributor** (history rewrite + force push).
18. **Fixed the Pages deploy** (force-push orphaned the last-deployed commit; also a transient "Deploy" step hiccup — fixed by re-triggering).
19. **Fixed the mobile sidebar peeking** off-screen (`translateX(-100%)`).
20. **Cinematic UI redesign** — added `fx.js` (particles, sparkline, reveal, count-up, tilt, cursor glow, typewriter, ticker, marquee).
21. Centred **"Powered by world-class vendors"** and made it white.
22. **Disabled the mouse-follow cursor glow**.
23. **TAG Profile.docx** → replaced placeholder copy with the real company profile (about, vision, mission, values, partners incl. PeopleLink, correct email `admin@tag.co.bw`, socials).
24. Added a **Shop**, a dedicated **About Us page**, an **embedded map**, and **expanded operating hours**.
25. **Real product images** in the shop.
26. **Cart for logged-in clients**, portal→shop access, hero pill → working hours, removed Software & Licences from shop, real **service/about images**.
27. **Removed the cart from public pages** — cart is now **client-only** (guests browse, must sign in to order).
28. **Bug-scan & fixes pass** (cache-bust bumped `?v=10` → `?v=11`):
    - Fixed a crash when toggling **"Remember Me"** (the shared input-listener ran `.closest(".field")` on a checkbox that isn't in a `.field`).
    - Made **"Remember Me"** actually work — unchecked sessions now live in `sessionStorage` (this-tab-only) instead of always persisting in `localStorage`.
    - **"Reset demo data"** no longer signs the admin out (it wiped the session key); it now preserves the session if the account survives the re-seed.
    - Hardened the hero **particle canvas** against running two animation loops when the page first loads in a background/hidden tab.
    - **Scoped the shopping cart per user** (`tag_cart_<userId>`) so carts never leak between accounts sharing a browser; reset clears all per-user carts.

---

## 5. Deployment

Static site on **GitHub Pages** (deploy from `main`, root):

```bash
git add .
git commit -m "your change"
git push
```

Pages rebuilds in ~1–2 minutes. Assets use `?v=N` query strings, bumped on
change, so browsers fetch fresh files after each deploy.

**Gotchas learned this session**
- The project lives under OneDrive-synced `Documents`; files can occasionally
  fail to persist — re-verify writes on disk. (See `memory/tag-system-js-files.md`.)
- History rewrites / force-pushes on a Pages-connected repo can break the deploy
  (Pages tracks specific commit SHAs) — recover by pushing one fresh commit.
- The "Deploy to GitHub Pages" step occasionally fails transiently even when the
  build passes — just re-trigger with a new commit.

---

## 6. Open items / notes

- **Weekend hours** are set to *Sat 8AM–1PM, Sun closed* as a sensible default — confirm the real hours.
- **Shop products/prices** and some **service/product photos** are realistic placeholders (filenames map 1:1 to IDs, e.g. `assets/shop/ups-1500.jpg`, `assets/services/cloud.jpg`) — send exact product lists/photos to swap in.
- Google Maps refuses iframe embedding, so the map uses **OpenStreetMap** (with an "Open in Google Maps" link).
- Possible next steps: client **order history** in the portal, real backend, email notifications, connect the `app.tag.co.bw` subdomain.
