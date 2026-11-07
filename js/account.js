const USERS_KEY = "pj_users";
const SESSION_KEY = "pj_currentUser";
const MAX_SAVED_ORDERS = 50;

// ---------- Storage ----------
function getUsers() {
    try {
        const u = JSON.parse(localStorage.getItem(USERS_KEY));
        return u && typeof u === "object" && !Array.isArray(u) ? u : {};
    } catch (e) {
        return {};
    }
}

function setUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function currentUser() {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    return getUsers()[email] || null;
}

// ---------- Password ----------
function randomSalt() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function hashPassword(password, salt) {
    const text = salt + password;
    if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(function (b) {
            return b.toString(16).padStart(2, "0");
        }).join("");
    }
    // Fallback 
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    return "f" + h;
}

// ---------- Actions ----------
async function registerUser(name, email, password, address) {
    email = email.trim().toLowerCase();
    const users = getUsers();
    if (users[email]) {
        return { ok: false, msg: "May account na gamit ang email na ito." };
    }
    const salt = randomSalt();
    users[email] = {
        name: name.trim(),
        email: email,
        address: (address || "").trim(),
        salt: salt,
        hash: await hashPassword(password, salt),
        orders: [],
        createdAt: Date.now()
    };
    setUsers(users);
    localStorage.setItem(SESSION_KEY, email);
    return { ok: true };
}

async function loginUser(email, password) {
    email = email.trim().toLowerCase();
    const user = getUsers()[email];
    if (!user) return { ok: false, msg: "Mali ang email o password." };
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.hash) return { ok: false, msg: "Mali ang email o password." };
    localStorage.setItem(SESSION_KEY, email);
    return { ok: true };
}

function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
}

function updateProfile(name, address) {
    const user = currentUser();
    if (!user) return false;
    const users = getUsers();
    users[user.email].name = name.trim();
    users[user.email].address = address.trim();
    setUsers(users);
    return true;
}

// Tawagin sa checkout() pagkatapos mabuo ang order.
// Kapag hindi naka-login, walang mangyayari.
function saveOrderToAccount(order) {
    const user = currentUser();
    if (!user) return false;
    const users = getUsers();
    users[user.email].orders.unshift(order);
    users[user.email].orders = users[user.email].orders.slice(0, MAX_SAVED_ORDERS);
    setUsers(users);
    return true;
}

// ---------- Navbar ----------
function updateAccountNav() {
    const nav = document.querySelector("#mainNav .navbar-nav");
    if (!nav || document.getElementById("accountLink")) return;

    const user = currentUser();
    const label = user ? user.name.split(" ")[0] : "Login";

    // Kung may sariling link na sa navbar (login.html / account.html), iyon ang gagamitin
    let link = nav.querySelector('a[href="login.html"], a[href="account.html"]');
    if (!link) {
        link = document.createElement("a");
        link.href = "account.html";
        link.className = "nav-link";
        nav.appendChild(link);
    }
    link.id = "accountLink";
    // may icon + text para pareho sa ibang links sa sidebar
    link.textContent = "";
    const ico = document.createElement("span");
    ico.className = "nav-ico";
    ico.setAttribute("aria-hidden", "true");
    ico.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
    const txt = document.createElement("span");
    txt.className = "nav-text";
    txt.textContent = label;
    link.append(ico, txt);
    if (/(account|login)\.html$/.test(location.pathname)) link.classList.add("active");
}

// ---------- Prefill sa cart page ----------
function prefillDelivery() {
    const input = document.getElementById("deliveryLocation");
    const user = currentUser();
    if (input && user && user.address && !input.value) {
        input.value = user.address;
    }
}

// ---------- Account page ----------
function showMsg(id, text, ok) {
    const box = document.getElementById(id);
    if (!box) return;
    box.textContent = text;
    box.className = "small mt-2 " + (ok ? "text-success" : "text-danger");
}

function renderOrders(user) {
    const box = document.getElementById("orderHistory");
    box.innerHTML = "";
    if (!user.orders.length) {
        box.appendChild(el("p", "text-muted", "Wala ka pang orders."));
        return;
    }
    user.orders.forEach(function (o) {
        const card = el("div", "");

        const top = el("div", "d-flex justify-content-between flex-wrap gap-2");
        top.appendChild(el("strong", "", o.orderNumber));
        top.appendChild(el("strong", "", formatPeso(o.total)));
        card.appendChild(top);

        card.appendChild(el("small", "text-muted d-block", o.orderedAt));
        card.appendChild(el("small", "text-muted d-block mb-2",
            "Deliver to: " + o.location + " • " + o.deliveryDate + ", " + o.deliveryTime));

        card.appendChild(el("small", "text-muted d-block mb-2",
            "Payment: " + (o.paymentMethod || "Cash on Delivery")));

        const ul = el("ul", "mb-0 small");
        o.items.forEach(function (it) {
            ul.appendChild(el("li", "", it.qty + " x " + it.name));
        });
        card.appendChild(ul);
        box.appendChild(card);
    });
}

function renderAccountPage() {
    const user = currentUser();
    const authBox = document.getElementById("authBox");
    const profileBox = document.getElementById("profileBox");
    if (!authBox || !profileBox) return;

    if (!user) {
        authBox.classList.remove("d-none");
        profileBox.classList.add("d-none");
        return;
    }

    authBox.classList.add("d-none");
    profileBox.classList.remove("d-none");
    document.getElementById("welcomeName").textContent = user.name;
    document.getElementById("profName").value = user.name;
    document.getElementById("profEmail").value = user.email;
    document.getElementById("profAddress").value = user.address || "";
    renderOrders(user);
}

function initAccountPage() {
    if (!document.getElementById("accountPage")) return;

    document.getElementById("loginForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const res = await loginUser(
            document.getElementById("loginEmail").value,
            document.getElementById("loginPassword").value
        );
        if (!res.ok) return showMsg("authMsg", res.msg, false);
        location.reload();
    });

    document.getElementById("registerForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const pw = document.getElementById("regPassword").value;
        if (pw.length < 6) {
            return showMsg("authMsg", "Dapat at least 6 characters ang password.", false);
        }
        const res = await registerUser(
            document.getElementById("regName").value,
            document.getElementById("regEmail").value,
            pw,
            document.getElementById("regAddress").value
        );
        if (!res.ok) return showMsg("authMsg", res.msg, false);
        location.reload();
    });

    document.getElementById("profileForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("profName").value;
        if (!name.trim()) return showMsg("profileMsg", "Ilagay ang pangalan.", false);
        updateProfile(name, document.getElementById("profAddress").value);
        document.getElementById("welcomeName").textContent = name.trim();
        showMsg("profileMsg", "Na-save na!", true);
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
        logoutUser();
        location.reload();
    });

    renderAccountPage();
}

document.addEventListener("DOMContentLoaded", function () {
    updateAccountNav();
    prefillDelivery();
    initAccountPage();
});
