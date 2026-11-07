// ===== CART DATA =====
const MAX_QTY = 99; 

function normalizeCart(data) {
    const merged = [];
    data.forEach(function (it) {
        if (!it || typeof it.name !== "string") return;
        const price = Number(it.price);
        if (isNaN(price)) return;
        const qty = Math.min(MAX_QTY, Math.max(1, parseInt(it.qty, 10) || 1));

        const existing = merged.find(function (m) {
            return m.name === it.name && m.price === price;
        });
        if (existing) {
            existing.qty = Math.min(MAX_QTY, existing.qty + qty);
        } else {
            merged.push({ name: it.name, price: price, qty: qty });
        }
    });
    return merged;
}

function loadCart() {
    try {
        const data = JSON.parse(localStorage.getItem("cart"));
        return Array.isArray(data) ? normalizeCart(data) : [];
    } catch (e) {
        return [];
    }
}

let cart = loadCart();

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
}

// Kabuuang bilang ng pagkain sa cart (kasama ang quantity)
function cartTotalQty() {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
}

// Bilang ng items sa navbar (may id="cartCount")
function updateCartBadge() {
    const badge = document.getElementById("cartCount");
    if (badge) {
        const next = String(cartTotalQty());
        if (badge.textContent !== next) {
            badge.textContent = next;
            badge.classList.remove("pop");
            void badge.offsetWidth;
            badge.classList.add("pop");
        }
    }
}

// Toast if ui.js is loaded, plain alert otherwise
function notify(message, type) {
    if (typeof showToast === "function") showToast(message, type);
    else alert(message);
}

// ===== MENU PAGE =====
function addToCart(name, price, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);

    const existing = cart.find(function (item) {
        return item.name === name && item.price === price;
    });

    if (existing) {
        existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    } else {
        cart.push({ name: name, price: price, qty: Math.min(MAX_QTY, qty) });
    }

    saveCart();
    notify(qty + " × " + name + " added to your cart", "ok");
}

// ===== MENU DATA =====
const menuData = {
    main: {
        title: "Main Menu",
        items: [
            { name: "Classic Burger",     desc: "Juicy beef burger with vegetables.",        price: 129, img: "files/burger.jpg",   emoji: "🍔" },
            { name: "Cheese Pizza",       desc: "Fresh pizza loaded with cheese.",           price: 249, img: "files/pizza.jpg",    emoji: "🍕" },
            { name: "Creamy Pasta",       desc: "Creamy and delicious pasta.",               price: 159, img: "files/pasta.jpg",    emoji: "🍝" },
            { name: "Fried Chicken",      desc: "Crispy chicken with special seasoning.",    price: 149, img: "files/chicken.jpg",  emoji: "🍗" },
            { name: "Chicken Adobo Rice", desc: "Classic Filipino adobo served with rice.",  price: 119, img: "files/adobo.jpg",    emoji: "🍛" },
            { name: "Pork BBQ Rice Meal", desc: "Grilled pork BBQ skewers with rice.",       price: 139, img: "files/bbq.jpg",      emoji: "🍢" },
            { name: "Sinigang na Baboy",  desc: "Sour tamarind soup with tender pork.",      price: 189, img: "files/sinigang.jpg", emoji: "🍲" },
            { name: "Beef Steak",         desc: "Tender beef steak with gravy and veggies.", price: 299, img: "files/steak.jpg",    emoji: "🥩" },
            { name: "Fish Fillet",        desc: "Crispy golden dory fillet in garlic butter lemon cream sauce.", price: 160, img: "files/fish.jpg",    emoji: "🥩" }

        ]
    },
    appetizer: {
        title: "Appetizer Menu",
        items: [
            { name: "Chicken Wings",     desc: "Crispy wings tossed in sweet spicy sauce.",  price: 159, img: "files/wings.jpg",       emoji: "🍗" },
            { name: "Onion Rings",       desc: "Golden battered onion rings.",               price: 99,  img: "files/onion.jpg",  emoji: "🧅" },
            { name: "Mozzarella Sticks", desc: "Cheesy sticks with marinara dip.",           price: 119, img: "files/mozzarella.jpg",  emoji: "🧀" },
            { name: "Lumpiang Shanghai", desc: "Crispy pork spring rolls with sweet chili.", price: 99,  img: "files/shanghai.jpg",      emoji: "🥟" },
            { name: "Garlic Bread",      desc: "Toasted bread with garlic butter.",          price: 79,  img: "files/garlic.jpg", emoji: "🥖" },
            { name: "Nachos",            desc: "Crunchy nachos with cheese sauce.",          price: 129, img: "files/nacho.jpg",      emoji: "🌮" }
        ]
    },
    drink: {
        title: "Drink Menu",
        items: [
            { name: "Iced Tea",     desc: "Chilled house-blend iced tea.",            price: 59, img: "files/icedtea.jpg",    emoji: "🧋" },
            { name: "Lemonade",     desc: "Freshly squeezed and sweet-tangy.",        price: 65, img: "files/lemonade.jpg",   emoji: "🍋" },
            { name: "Mango Shake",  desc: "Creamy shake made from ripe mangoes.",     price: 89, img: "files/shake.jpg", emoji: "🥭" },
            { name: "Hot Coffee",   desc: "Freshly brewed rich coffee.",              price: 79, img: "files/coffee.jpg",     emoji: "☕" },
            { name: "Soda",         desc: "Ice-cold canned soda of your choice.",     price: 49, img: "files/soda.jpg",       emoji: "🥫" }
        ]
    },
    dessert: {
        title: "Dessert Menu",
        items: [
            { name: "Halo-Halo",      desc: "Classic mix of shaved ice, fruits and leche flan.", price: 99,  img: "files/halohalo.jpg",   emoji: "🍧" },
            { name: "Leche Flan",     desc: "Smooth and creamy caramel custard.",                price: 79,  img: "files/pudding.jpg",  emoji: "🍮" },
            { name: "Chocolate Cake", desc: "Moist chocolate cake with ganache.",                price: 119, img: "files/cake.jpg",       emoji: "🍰" },
            { name: "Ice Cream",      desc: "Two scoops of your favorite flavor.",               price: 69,  img: "files/icecream.jpg",   emoji: "🍨" },
            { name: "Brownie",        desc: "Fudgy chocolate brownie.",                          price: 89,  img: "files/brownie.jpg",    emoji: "🍫" },
            { name: "Mango Float",    desc: "Layers of graham, cream and sweet mango.",          price: 99,  img: "files/float.jpg", emoji: "🥭" }
        ]
    },
    snack: {
        title: "Snack Menu",
        items: [
            { name: "French Fries",  desc: "Crispy golden french fries.",               price: 89, img: "files/fries.jpg",        emoji: "🍟" },
            { name: "Siomai",        desc: "Steamed pork siomai with chili garlic.",    price: 79, img: "files/siomai.jpg",       emoji: "🥟" },
            { name: "Banana Cue",    desc: "Caramelized fried saging na saba.",         price: 49, img: "files/bananacue.jpg",    emoji: "🍌" },
            { name: "Turon",         desc: "Banana and langka in crispy wrapper.",      price: 49, img: "files/turon.jpg",        emoji: "🥠" },
            { name: "Cheese Sticks", desc: "Crispy fried cheese sticks.",               price: 59, img: "files/cheesesticks.jpg", emoji: "🧀" },
            { name: "Fish Ball",     desc: "Street-style fish balls with sweet sauce.", price: 39, img: "files/fishball.jpg",     emoji: "🍡" }
        ]
    }
};

// ===== MENU RENDER =====
function buildMenuCard(item, index) {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-lg-4";
    col.style.setProperty("--i", index || 0);

    const card = document.createElement("div");
    card.className = "menu-card card h-100";
    card.style.setProperty("--i", index || 0);

    // Emoji pamalit kapag wala pang picture file
    const showEmoji = function () {
        const ph = document.createElement("div");
        ph.className = "menu-card-placeholder";
        ph.textContent = item.emoji || "🍽️";
        card.insertBefore(ph, card.firstChild);
    };

    if (item.img) {
        const img = document.createElement("img");
        img.src = item.img;
        img.alt = item.name;
        img.className = "card-img-top";
        img.addEventListener("error", function () {
            img.remove();
            showEmoji();
        });
        card.appendChild(img);
    } else {
        showEmoji();
    }

    const body = document.createElement("div");
    body.className = "card-body text-center d-flex flex-column";

    const title = document.createElement("h3");
    title.className = "h5";
    title.textContent = item.name;

    const desc = document.createElement("p");
    desc.className = "text-muted";
    desc.textContent = item.desc;

    const price = document.createElement("strong");
    price.className = "price mt-auto";
    price.textContent = "₱" + item.price;

    // Quantity selector
    let qty = 1;
    const qtyRow = el("div", "qty");
    const minusBtn = el("button", "btn btn-outline-dark btn-sm", "−");
    minusBtn.type = "button";
    minusBtn.setAttribute("aria-label", "Decrease quantity");
    const qtyLabel = el("span", "qty-num", "1");
    const plusBtn = el("button", "btn btn-outline-dark btn-sm", "+");
    plusBtn.type = "button";
    plusBtn.setAttribute("aria-label", "Increase quantity");

    const refreshQty = function () {
        qtyLabel.textContent = qty;
        minusBtn.disabled = qty <= 1;
        plusBtn.disabled = qty >= MAX_QTY;
    };
    minusBtn.addEventListener("click", function () {
        if (qty > 1) { qty--; refreshQty(); }
    });
    plusBtn.addEventListener("click", function () {
        if (qty < MAX_QTY) { qty++; refreshQty(); }
    });
    refreshQty();

    qtyRow.appendChild(minusBtn);
    qtyRow.appendChild(qtyLabel);
    qtyRow.appendChild(plusBtn);

    const btn = document.createElement("button");
    btn.className = "btn btn-warning w-100 fw-bold";
    btn.textContent = "Add to Cart";
    btn.addEventListener("click", function () {
        addToCart(item.name, item.price, qty);
        qty = 1; // balik sa 1 pagkatapos mag-add
        refreshQty();
    });

    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(price);
    body.appendChild(qtyRow);
    body.appendChild(btn);
    card.appendChild(body);
    col.appendChild(card);
    return col;
}

function showMenu(category, btn) {
    const data = menuData[category];
    const container = document.getElementById("menuItems");
    if (!data || !container) return;

    // Active button
    document.querySelectorAll(".category-btn").forEach(function (b) {
        b.classList.remove("active");
    });
    if (btn) btn.classList.add("active");

    // Title + items (fade out, swap, fade in)
    const draw = function () {
        const title = document.getElementById("categoryTitle");
        title.textContent = data.title;
        title.style.animation = "none"; void title.offsetWidth; title.style.animation = "";
        container.innerHTML = "";
        data.items.forEach(function (item, i) {
            container.appendChild(buildMenuCard(item, i));
        });
        container.classList.remove("swapping");
    };
    if (container.children.length) {
        container.classList.add("swapping");
        setTimeout(draw, 220);
    } else {
        draw();
    }
}

// ===== CART PAGE =====
function displayCart() {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    // Wala sa cart page, skip
    if (!cartItems) return;

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty">Your cart is empty.<br><a href="menu.html">Browse the menu →</a></div>';
        cartTotal.textContent = "0";
        return;
    }

    let total = 0;

    cart.forEach(function (item, index) {
        const subtotal = item.price * item.qty;
        total += subtotal;

        const row = document.createElement("div");
        row.className = "cart-item";
        row.style.setProperty("--i", index);

        // Pangalan + presyo bawat isa
        const info = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = item.name;
        const price = document.createElement("p");
        price.className = "mb-0 text-muted";
        price.textContent = "₱" + item.price + " each";
        info.appendChild(title);
        info.appendChild(price);

        // Quantity controls
        const qtyBox = document.createElement("div");
        qtyBox.className = "qty";

        const minus = el("button", "btn btn-outline-dark btn-sm", "−");
        minus.type = "button";
        minus.disabled = item.qty <= 1;
        minus.setAttribute("aria-label", "Decrease quantity of " + item.name);
        minus.addEventListener("click", function () { changeQty(index, -1); });

        const qtyText = el("span", "qty-num", String(item.qty));

        const plus = el("button", "btn btn-outline-dark btn-sm", "+");
        plus.type = "button";
        plus.disabled = item.qty >= MAX_QTY;
        plus.setAttribute("aria-label", "Increase quantity of " + item.name);
        plus.addEventListener("click", function () { changeQty(index, 1); });

        qtyBox.appendChild(minus);
        qtyBox.appendChild(qtyText);
        qtyBox.appendChild(plus);

        // Subtotal
        const sub = el("strong", "", "₱" + subtotal);
        sub.style.minWidth = "70px";
        sub.className = "text-end";

        const btn = document.createElement("button");
        btn.className = "btn btn-outline-danger btn-sm";
        btn.textContent = "Remove";
        btn.addEventListener("click", function () {
            removeItem(index);
        });

        row.appendChild(info);
        row.appendChild(qtyBox);
        row.appendChild(sub);
        row.appendChild(btn);
        cartItems.appendChild(row);
    });

    cartTotal.textContent = total;
}

// Dagdag o bawas ng quantity 
function changeQty(index, delta) {
    const item = cart[index];
    if (!item) return;
    const next = item.qty + delta;
    if (next < 1 || next > MAX_QTY) return;
    item.qty = next;
    saveCart();
    displayCart();
}

// Tanggalin ang buong item (kahit ilan ang quantity)
function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    displayCart();
}

// Local date (YYYY-MM-DD)
function todayString() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
}

// ===== RECEIPT =====
function formatPeso(amount) {
    return "₱" + Number(amount).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Gawing madaling basahin: "2026-10-06" -> "October 6, 2026"
function formatDateNice(dateStr) {
    const parts = dateStr.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric", weekday: "long"
    });
}

// "14:30" -> "2:30 PM"
function formatTimeNice(timeStr) {
    const parts = timeStr.split(":");
    const d = new Date();
    d.setHours(parts[0], parts[1], 0, 0);
    return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

// Order number: PJ-YYMMDD-HHMMSS
function generateOrderNumber(now) {
    const p = function (n) { return String(n).padStart(2, "0"); };
    return "PJ-" + String(now.getFullYear()).slice(2) + p(now.getMonth() + 1) + p(now.getDate()) +
        "-" + p(now.getHours()) + p(now.getMinutes()) + p(now.getSeconds());
}


function groupCartItems(items) {
    return items.map(function (item) {
        return {
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.price * item.qty
        };
    });
}

function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
}

// Print styles for the receipt live in css/theme.css

function infoRow(label, value) {
    const row = el("div", "d-flex justify-content-between mb-1");

    const lab = el("span", "text-muted", label);
    lab.style.whiteSpace = "nowrap";   // hindi na mag-wrap ang label
    lab.style.marginRight = "12px";
    row.appendChild(lab);

    const v = el("span", "text-end fw-semibold", value);
    v.style.maxWidth = "60%";
    v.style.wordBreak = "break-word";
    row.appendChild(v);
    return row;
}

function buildReceipt(order) {
    const box = el("div", "receipt");
    box.id = "receipt";

    // Header
    const header = el("div", "text-center mb-3");
    header.appendChild(el("h4", "mb-0", "P&J Restaurant"));
    header.appendChild(el("small", "text-muted", "Official Order Receipt"));
    box.appendChild(header);
    box.appendChild(el("hr"));

    // Order info
    box.appendChild(infoRow("Order No.", order.orderNumber));
    box.appendChild(infoRow("Ordered on", order.orderedAt));
    box.appendChild(infoRow("Deliver to", order.location));
    box.appendChild(infoRow("Delivery date", order.deliveryDate));
    box.appendChild(infoRow("Delivery time", order.deliveryTime));
    box.appendChild(el("hr"));

    // Items table (nasa loob ng wrapper para hindi lumampas sa resibo)
    const tableWrap = el("div", "table-responsive");
    const table = el("table", "table table-sm mb-0 w-100");
    table.style.fontFamily = "'Courier New', monospace";
    table.style.fontSize = "0.85rem";

    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["Item", "Qty", "Price", "Subtotal"].forEach(function (h, i) {
        hr.appendChild(el("th", i === 0 ? "" : "text-end", h));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    order.items.forEach(function (it) {
        const tr = document.createElement("tr");
        tr.appendChild(el("td", "", it.name));
        tr.appendChild(el("td", "text-end", String(it.qty)));
        tr.appendChild(el("td", "text-end", formatPeso(it.price)));
        tr.appendChild(el("td", "text-end", formatPeso(it.subtotal)));
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    box.appendChild(tableWrap);
    box.appendChild(el("hr"));

    // Totals
    box.appendChild(infoRow("Total items", String(order.totalQty)));
    const totalRow = el("div", "d-flex justify-content-between fs-5 fw-bold mt-2");
    totalRow.appendChild(el("span", "", "TOTAL"));
    totalRow.appendChild(el("span", "", formatPeso(order.total)));
    box.appendChild(totalRow);
    box.appendChild(el("hr"));

    // Footer
    box.appendChild(el("p", "text-center mb-2", "Thank you for ordering from P&J Restaurant!"));
    box.appendChild(el("p", "text-center text-muted small mb-3", "Please keep this receipt for your reference."));

    const printBtn = el("button", "btn btn-outline-dark btn-sm d-block mx-auto no-print", "🖨️ Print Receipt");
    printBtn.type = "button";
    printBtn.addEventListener("click", function () {
        window.print();
    });
    box.appendChild(printBtn);

    return box;
}


function showReceipt(order, afterElement) {
    const old = document.getElementById("receipt");
    if (old) old.remove();

    const receipt = buildReceipt(order);
    afterElement.insertAdjacentElement("afterend", receipt);
    receipt.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ===== CHECKOUT =====
function checkout() {
    const checkoutBtn = document.getElementById("checkoutBtn");
    const againBtn = document.getElementById("orderAgainBtn");
    const msg = document.getElementById("checkoutMsg");

    const loc = document.getElementById("deliveryLocation").value.trim();
    const date = document.getElementById("deliveryDate").value;
    const time = document.getElementById("deliveryTime").value;

    if (cart.length === 0) {
        notify("Your cart is empty!", "err");
        return;
    }

    if (!loc || !date || !time) {
        notify("Paki-fill up muna ang Location, Date at Time.", "err");
        ["deliveryLocation", "deliveryDate", "deliveryTime"].forEach(function (id) {
            const f = document.getElementById(id);
            if (f) f.classList.toggle("invalid", !f.value.trim());
        });
        return;
    }

    // before reset
    const now = new Date();
    const items = groupCartItems(cart);
    const order = {
        orderNumber: generateOrderNumber(now),
        orderedAt: now.toLocaleString("en-PH", {
            year: "numeric", month: "short", day: "numeric",
            hour: "numeric", minute: "2-digit"
        }),
        location: loc,
        deliveryDate: formatDateNice(date),
        deliveryTime: formatTimeNice(time),
        items: items,
        totalQty: items.reduce(function (sum, it) { return sum + it.qty; }, 0),
        total: items.reduce(function (sum, it) { return sum + it.subtotal; }, 0)
    };

    // I-save sa account (kung naka-login at naka-load ang account.js)
    const savedToAccount = typeof saveOrderToAccount === "function" && saveOrderToAccount(order);

    // Feed the best-seller chart (sales.js)
    if (typeof PJSales !== "undefined") PJSales.record(items);

    notify("Thank you for ordering from P&J Restaurant!", "ok");

    // Linisin ang cart
    cart = [];
    localStorage.removeItem("cart");
    updateCartBadge();
    displayCart();

    // Confirmation + resibo
    msg.textContent = "✅ Order placed! Order No. " + order.orderNumber +
        (savedToAccount ? " (Naka-save sa Order History mo)" : " — Mag-login para ma-save sa account mo.");
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Order Placed ✓";
    againBtn.style.display = "block";

    showReceipt(order, msg);
}

function orderAgain() {
    // Bumalik sa menu para makapili ulit
    window.location.href = "menu.html";
}

// ===== CONTACT FORM =====
function sendMessage(event) {
    event.preventDefault();
    notify("Thank you! Your message has been sent!", "ok");
    event.target.reset();
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();
    displayCart();

    // Menu page lang
    if (document.getElementById("menuItems")) {
        showMenu("main", document.querySelector(".category-btn.active"));
    }

    // Cart page lang
    const dateInput = document.getElementById("deliveryDate");
    if (dateInput) dateInput.min = todayString();

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

    const againBtn = document.getElementById("orderAgainBtn");
    if (againBtn) againBtn.addEventListener("click", orderAgain);
});
