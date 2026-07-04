/* ============================================================
   TAG System — Shop (catalog · cart · checkout)
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, esc, toast, modal } = UI;

  /* ---------- product catalogue (prices in BWP) ---------- */
  const PRODUCTS = [
    { id: "hpe-server", name: "HPE ProLiant Server", cat: "Hardware", icon: "🖥️", price: 45000, desc: "Enterprise rack server for virtualisation and business-critical workloads." },
    { id: "biz-laptop", name: "HP Business Laptop", cat: "Hardware", icon: "💻", price: 8500, desc: "14\" business laptop, i7 / 16GB / 512GB SSD, with 3-year warranty." },
    { id: "nas-8tb", name: "Backup NAS · 8TB", cat: "Hardware", icon: "💾", price: 7500, desc: "Network-attached storage for automated, tested backups and recovery." },
    { id: "ups-1500", name: "UPS 1500VA", cat: "Hardware", icon: "🔋", price: 1500, desc: "Line-interactive UPS to keep critical systems online through outages." },
    { id: "wifi-ap", name: "Wi-Fi 6 Access Point", cat: "Networking", icon: "📶", price: 2200, desc: "High-density access point for seamless office and warehouse coverage." },
    { id: "switch-24", name: "24-Port Managed Switch", cat: "Networking", icon: "🔌", price: 4200, desc: "Gigabit managed switch with VLAN and PoE for scalable networks." },
    { id: "vc-bar", name: "Video Conferencing Bar", cat: "Networking", icon: "🎥", price: 12000, desc: "All-in-one 4K camera, mic and speaker bar for hybrid boardrooms." },
    { id: "access-kit", name: "Biometric Access Control Kit", cat: "Security", icon: "🔐", price: 6500, desc: "Fingerprint + card door controller with management software." },
    { id: "ip-camera", name: "IP CCTV Camera", cat: "Security", icon: "📹", price: 1800, desc: "4MP IP camera with night vision and 30-day cloud retention option." },
  ];

  const CATS = ["All"].concat(PRODUCTS.map((p) => p.cat).filter((c, i, a) => a.indexOf(c) === i));
  let activeCat = "All";

  const money = (n) => "P" + Number(n).toLocaleString("en-US");

  // The cart & ordering are for signed-in clients only.
  const canShop = !!TAGDB.Auth.current();

  /* ---------- year in footer ---------- */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- guests: hide cart, show a sign-in note ---------- */
  if (!canShop) {
    const cartToggle = $("#cartToggle");
    if (cartToggle) cartToggle.style.display = "none";
    const head = document.querySelector(".page-head .container");
    if (head) {
      const note = document.createElement("p");
      note.className = "shop-guest-note";
      note.innerHTML = '🔒 <a href="login.html">Sign in</a> as a client to add items to your cart and place orders.';
      head.appendChild(note);
    }
  }

  /* ---------- render filters ---------- */
  const filters = $("#shopFilters");
  filters.innerHTML = CATS.map((c) =>
    `<button data-cat="${esc(c)}"${c === activeCat ? ' class="active"' : ""}>${esc(c)}</button>`).join("");
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-cat]");
    if (!b) return;
    activeCat = b.dataset.cat;
    $$("#shopFilters button").forEach((x) => x.classList.toggle("active", x.dataset.cat === activeCat));
    renderProducts();
  });

  /* ---------- render products ---------- */
  const grid = $("#productGrid");
  function renderProducts() {
    const list = activeCat === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === activeCat);
    grid.innerHTML = list.map((p, i) => `
      <div class="card product" data-reveal data-reveal-delay="${(i % 4) * 60}">
        <div class="product__media"><img src="assets/shop/${p.id}.jpg" alt="${esc(p.name)}" loading="lazy" /></div>
        <span class="product__cat">${esc(p.cat)}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="product__foot">
          <span class="product__price">${money(p.price)}</span>
          ${canShop
            ? `<button class="btn btn-primary btn-sm" data-add="${p.id}">Add to cart</button>`
            : `<a class="btn btn-ghost btn-sm" href="login.html">Sign in to order</a>`}
        </div>
      </div>`).join("");
    grid.querySelectorAll("[data-add]").forEach((btn) =>
      btn.addEventListener("click", () => addToCart(btn.dataset.add)));
    if (window.FX) FX.scan(grid);
  }

  function addToCart(id) {
    if (!TAGDB.Auth.current()) { location.href = "login.html"; return; }
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return;
    TAGDB.Cart.add(Object.assign({}, product, { img: "assets/shop/" + product.id + ".jpg" }));
    if (window.updateCartBadge) updateCartBadge();
    renderCart();
    toast(product.name + " added to cart", "success");
    openCart();
  }

  /* ---------- cart drawer ---------- */
  const overlay = $("#cartOverlay"), drawer = $("#cartDrawer");
  function openCart() { overlay.classList.add("open"); drawer.classList.add("open"); }
  function closeCart() { overlay.classList.remove("open"); drawer.classList.remove("open"); }
  $("#cartToggle").addEventListener("click", () => { renderCart(); openCart(); });
  $("#cartClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  function renderCart() {
    const items = TAGDB.Cart.all();
    const body = $("#cartBody"), foot = $("#cartFoot");
    if (!items.length) {
      body.innerHTML = `<div class="cart-empty"><div class="ico">🛒</div><p>Your cart is empty.</p></div>`;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = items.map((i) => `
      <div class="cart-line">
        <div class="cart-line__icon">${i.img ? `<img src="${esc(i.img)}" alt="" />` : (i.icon || "📦")}</div>
        <div class="cart-line__info">
          <b>${esc(i.name)}</b>
          <span>${money(i.price)} each</span>
        </div>
        <div class="qty">
          <button data-dec="${i.id}" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button data-inc="${i.id}" aria-label="Increase">+</button>
        </div>
        <button class="cart-line__rm" data-rm="${i.id}" aria-label="Remove">🗑️</button>
      </div>`).join("");
    foot.innerHTML = `
      <div class="cart-total"><span class="lbl">Subtotal</span><span class="val">${money(TAGDB.Cart.total())}</span></div>
      <button class="btn btn-primary btn-block" id="checkoutBtn">Proceed to Checkout</button>`;

    body.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
    body.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
    body.querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", () => { TAGDB.Cart.remove(b.dataset.rm); afterCartChange(); }));
    $("#checkoutBtn").addEventListener("click", openCheckout);
  }
  function changeQty(id, delta) {
    const item = TAGDB.Cart.all().find((i) => i.id === id);
    if (!item) return;
    TAGDB.Cart.setQty(id, item.qty + delta);
    afterCartChange();
  }
  function afterCartChange() {
    if (window.updateCartBadge) updateCartBadge();
    renderCart();
  }

  /* ---------- checkout ---------- */
  function openCheckout() {
    if (!TAGDB.Cart.count()) return;
    $("#checkoutTotal").textContent = money(TAGDB.Cart.total());
    const user = TAGDB.Auth.current();
    if (user) {
      $("#oName").value = user.name || "";
      $("#oEmail").value = user.email || "";
      $("#oPhone").value = user.phone || "";
      $("#oCompany").value = user.company || "";
    }
    modal.open("checkoutModal");
  }
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => modal.close(b.dataset.close)));
  $("#checkoutModal").addEventListener("click", (e) => { if (e.target.id === "checkoutModal") modal.close("checkoutModal"); });
  document.querySelectorAll("#checkoutForm input, #checkoutForm textarea").forEach((el) =>
    el.addEventListener("input", () => el.closest(".field").classList.remove("invalid")));

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  $("#checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#oName"), phone = $("#oPhone"), email = $("#oEmail");
    let ok = true;
    [[name, name.value.trim().length > 0], [phone, phone.value.trim().length > 0], [email, emailRe.test(email.value.trim())]]
      .forEach(([el, valid]) => { el.closest(".field").classList.toggle("invalid", !valid); if (!valid) ok = false; });
    if (!ok) return;
    if (!TAGDB.Cart.count()) { toast("Your cart is empty.", "error"); return; }

    const user = TAGDB.Auth.current();
    const order = TAGDB.Orders.create({
      userId: user ? user.id : null,
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      company: $("#oCompany").value.trim(),
      notes: $("#oNotes").value.trim(),
      items: TAGDB.Cart.all(),
      total: TAGDB.Cart.total(),
    });
    TAGDB.Cart.clear();
    if (window.updateCartBadge) updateCartBadge();
    renderCart();
    modal.close("checkoutModal");
    closeCart();
    $("#checkoutForm").reset();
    toast("Order #" + order.id.slice(-6) + " placed — we'll confirm within 24 hours!", "success");
  });

  /* ---------- init ---------- */
  renderProducts();
  renderCart();
  if (window.updateCartBadge) updateCartBadge();
})();
