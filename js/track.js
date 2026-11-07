// ===== ORDER TRACKER =====

const ORDERS_KEY = "pj_orders";
const MINUTE = 60 * 1000;
const REFRESH_MS = 15 * 1000;

const STAGES = [
    { key: "placed",    icon: "📝", title: "Order Placed",     desc: "Natanggap na namin ang order mo." },
    { key: "preparing", icon: "👨‍🍳", title: "Preparing",        desc: "Inihahanda na ang pagkain mo." },
    { key: "delivery",  icon: "🛵", title: "Out for Delivery", desc: "Papunta na ang rider sa'yo." },
    { key: "delivered", icon: "✅", title: "Delivered",        desc: "Naihatid na! Enjoy your meal!" }
];

let activeOrderNo = null;

// ---------- Data ----------
function placedFromNumber(no) {
    // PJ-YYMMDD-HHMMSS -> timestamp (para sa lumang orders na walang placedAt)
    const m = /^PJ-(\d{2})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(no);
    if (!m) return Date.now();
    return new Date(2000 + Number(m[1]), Number(m[2]) - 1, Number(m[3]),
        Number(m[4]), Number(m[5]), Number(m[6])).getTime();
}

function readTrackedOrders() {
    let list = [];
    try {
        const data = JSON.parse(localStorage.getItem(ORDERS_KEY));
        if (Array.isArray(data)) list = data.slice();
    } catch (e) { /* ignore */ }

    // Isama ang orders sa account (kung naka-login)
    if (typeof currentUser === "function") {
        const user = currentUser();
        if (user && Array.isArray(user.orders)) {
            user.orders.forEach(function (o) {
                const exists = list.some(function (x) { return x.orderNumber === o.orderNumber; });
                if (!exists) list.push(o);
            });
        }
    }

    list.forEach(function (o) {
        if (!o.placedAt) o.placedAt = placedFromNumber(o.orderNumber);
        if (!o.deliveryAt) o.deliveryAt = o.placedAt;
    });

    list.sort(function (a, b) { return b.placedAt - a.placedAt; });
    return list;
}

function findOrder(orderNo) {
    const wanted = orderNo.trim().toUpperCase();
    return readTrackedOrders().find(function (o) {
        return String(o.orderNumber).toUpperCase() === wanted;
    });
}

// ---------- Status (simulated) ----------
function getSchedule(o) {
    const placed = o.placedAt;
    const prep = placed + 1 * MINUTE;
    const out = Math.max(prep + 1 * MINUTE, o.deliveryAt - 20 * MINUTE);
    const done = Math.max(out + 1 * MINUTE, o.deliveryAt);
    return [placed, prep, out, done];
}

function currentStage(times, now) {
    let idx = 0;
    times.forEach(function (t, i) { if (now >= t) idx = i; });
    return idx;
}

function fmtTime(ms) {
    return new Date(ms).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

// ---------- Render ----------
function showTrackMsg(text, ok) {
    const box = document.getElementById("trackMsg");
    box.textContent = text;
    box.className = "small mt-2 mb-0 " + (ok ? "text-success" : "text-danger");
}

function renderRecent() {
    const box = document.getElementById("recentBox");
    const list = document.getElementById("recentOrders");
    const orders = readTrackedOrders().slice(0, 5);

    list.innerHTML = "";
    if (!orders.length) {
        box.classList.add("d-none");
        return;
    }
    box.classList.remove("d-none");

    const now = Date.now();
    orders.forEach(function (o) {
        const stage = STAGES[currentStage(getSchedule(o), now)];
        const btn = el("button", "recent-btn");
        btn.type = "button";
        btn.appendChild(el("span", "recent-no", o.orderNumber));
        btn.appendChild(el("span", "recent-meta",
            stage.icon + " " + stage.title + " • " + formatPeso(o.total)));
        btn.addEventListener("click", function () {
            document.getElementById("orderInput").value = o.orderNumber;
            trackOrder(o.orderNumber);
        });
        list.appendChild(btn);
    });
}

function renderResult(o, animate) {
    const box = document.getElementById("trackResult");
    box.innerHTML = "";

    const times = getSchedule(o);
    const idx = currentStage(times, Date.now());
    const delivered = idx === STAGES.length - 1;

    const card = el("div", "track-card mt-4" +
        (animate ? " track-enter" : ""));

    // Header
    const head = el("div", "d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3");
    const left = el("div");
    left.appendChild(el("small", "text-muted d-block", "Order No."));
    left.appendChild(el("strong", "fs-5", o.orderNumber));
    head.appendChild(left);
    head.appendChild(el("span", "badge status-badge status-" + STAGES[idx].key,
        STAGES[idx].icon + " " + STAGES[idx].title));
    card.appendChild(head);

    card.appendChild(el("p", "track-eta", delivered
        ? "Naihatid na ang order mo. Salamat sa pag-order!"
        : "Expected delivery: " + o.deliveryDate + ", " + o.deliveryTime));

    // Stepper
    const ol = el("ol", "stepper");
    STAGES.forEach(function (s, i) {
        const state = (i < idx || delivered) ? "done" : (i === idx ? "active" : "pending");
        const li = el("li", "step " + state);

        li.appendChild(el("div", "step-icon", s.icon));

        const text = el("div");
        text.appendChild(el("div", "step-title", s.title));
        text.appendChild(el("p", "step-desc", s.desc));
        if (i <= idx) {
            text.appendChild(el("small", "step-time", fmtTime(times[i])));
        } else if (i === STAGES.length - 1) {
            text.appendChild(el("small", "step-time", "Expected " + o.deliveryTime));
        }
        li.appendChild(text);
        ol.appendChild(li);
    });
    card.appendChild(ol);

    // Details
    card.appendChild(el("hr", "my-4"));
    const details = el("div", "track-details");
    details.appendChild(el("h2", "fw-bold mb-3", "Order Details"));
    details.appendChild(infoRow("Deliver to", o.location));
    details.appendChild(infoRow("Payment", o.paymentMethod || "Cash on Delivery"));

    const ul = el("ul", "small mt-2 mb-2");
    o.items.forEach(function (it) {
        ul.appendChild(el("li", "", it.qty + " x " + it.name));
    });
    details.appendChild(ul);

    const totalRow = el("div", "d-flex justify-content-between fs-5 fw-bold mt-2");
    totalRow.appendChild(el("span", "", "TOTAL"));
    totalRow.appendChild(el("span", "", formatPeso(o.total)));
    details.appendChild(totalRow);
    card.appendChild(details);

    box.appendChild(card);
}

// ---------- Actions ----------
function trackOrder(orderNo, silent) {
    const order = findOrder(orderNo || "");

    if (!order) {
        activeOrderNo = null;
        document.getElementById("trackResult").innerHTML = "";
        showTrackMsg(orderNo.trim()
            ? "Walang nahanap na order na may ganitong number sa device na ito."
            : "Ilagay muna ang order number.", false);
        return;
    }

    activeOrderNo = order.orderNumber;

    if (!silent) showTrackMsg("", true);
    renderResult(order, !silent); // walang animation kapag auto-refresh
    if (!silent) renderRecent();
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("trackForm");
    if (!form) return; // hindi sa track page

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        trackOrder(document.getElementById("orderInput").value);
    });

    renderRecent();

    // Galing sa "Track Order" button sa cart: track.html?order=PJ-...
    const fromUrl = new URLSearchParams(location.search).get("order");
    if (fromUrl) {
        document.getElementById("orderInput").value = fromUrl;
        trackOrder(fromUrl);
    }

    // Auto-update ng status
    setInterval(function () {
        if (activeOrderNo) trackOrder(activeOrderNo, true);
    }, REFRESH_MS);
});
