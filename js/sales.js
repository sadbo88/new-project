// ===== BEST-SELLER CHART =====
// Keeps a running tally of units sold per product in localStorage ("pj_sales_v1").
// checkout() in script.js calls PJSales.record(items); every chart on every open
// tab re-ranks and animates immediately.
//
// The tally starts from a small SAMPLE baseline so the chart is never empty on a
// fresh device. Real orders are added on top of it.
const PJSales = (function () {
    "use strict";

    const KEY = "pj_sales_v1";
    const SHOW = 6;      // rows in the chart
    const STEP = 60;     // row height + gap (px) — must match .rank-row height + 8

    // Starter data (units sold) — replace with real numbers whenever you like.
    const SEED = {
        "Classic Burger": 212, "Cheese Pizza": 187, "Chicken Adobo Rice": 174, "French Fries": 160,
        "Mango Shake": 141, "Halo-Halo": 133, "Chicken Wings": 128, "Creamy Pasta": 119,
        "Pork BBQ Rice Meal": 112, "Sinigang na Baboy": 98, "Fried Chicken": 96, "Iced Tea": 94,
        "Lumpiang Shanghai": 91, "Siomai": 88, "Beef Steak": 84, "Leche Flan": 80,
        "Chocolate Cake": 76, "Nachos": 72, "Mozzarella Sticks": 69, "Hot Coffee": 66,
        "Lemonade": 63, "Mango Float": 61, "Onion Rings": 58, "Banana Cue": 55,
        "Turon": 52, "Brownie": 49, "Fish Fillet": 47, "Cheese Sticks": 44,
        "Garlic Bread": 41, "Soda": 38, "Fish Ball": 35, "Ice Cream": 33
    };

    let metric = "units";
    let lastBest = null;
    let started = false;
    const rows = new Map();     // name -> {el, fill, val, no, shown}

    // ---------- Data ----------
    function load() {
        try {
            const o = JSON.parse(localStorage.getItem(KEY));
            if (o && typeof o === "object" && !Array.isArray(o)) return o;
        } catch (e) { /* ignore */ }
        return null;
    }
    function save(o) {
        try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* private mode */ }
    }
    function tally() {
        const t = load();
        if (t) return t;
        const fresh = Object.assign({}, SEED);
        save(fresh);
        return fresh;
    }

    function allItems() {
        const out = [];
        Object.keys(menuData).forEach(function (cat) {
            menuData[cat].items.forEach(function (it) {
                out.push({ name: it.name, price: it.price, img: it.img, emoji: it.emoji, cat: cat });
            });
        });
        return out;
    }

    function ranking() {
        const t = tally();
        const list = allItems().map(function (it) {
            const units = Number(t[it.name]) || 0;
            return Object.assign({}, it, { units: units, revenue: units * it.price });
        });
        list.sort(function (a, b) {
            return (b[metric] - a[metric]) || a.name.localeCompare(b.name);
        });
        return list;
    }

    function record(items) {
        if (!Array.isArray(items) || !items.length) return;
        const t = tally();
        items.forEach(function (it) {
            if (!it || !it.name) return;
            t[it.name] = (Number(t[it.name]) || 0) + Math.max(1, Number(it.qty) || 1);
        });
        save(t);
        window.dispatchEvent(new CustomEvent("pj:sales"));
    }

    // ---------- Formatting ----------
    function fmt(n) {
        return metric === "revenue" ? "₱" + n.toLocaleString("en-PH") : String(n);
    }
    function setNumber(node, from, to) {
        if (metric === "revenue") {
            node.textContent = fmt(to);   // currency text: no count-up
        } else if (typeof pjCountTo === "function") {
            pjCountTo(node, from, to, 900);
        } else {
            node.textContent = to;
        }
    }
    const CAT = { main: "Main", appetizer: "Appetizer", drink: "Drink", dessert: "Dessert", snack: "Snack" };

    // ---------- Render ----------
    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function updateSpotlight(best, total) {
        const sp = document.getElementById("spotlight");
        if (!sp) return;
        const img = sp.querySelector(".spotlight-img");
        const name = sp.querySelector("h4");
        const cat = sp.querySelector("small");
        const v1 = sp.querySelector("[data-s='value']");
        const l1 = sp.querySelector("[data-s='label']");
        const v2 = sp.querySelector("[data-s='share']");

        if (lastBest !== best.name) {
            if (lastBest !== null) {
                sp.classList.remove("swap");
                void sp.offsetWidth;
                sp.classList.add("swap");
                if (typeof showToast === "function") showToast("👑 New best seller: " + best.name);
            }
            img.style.backgroundImage = best.img ? 'url("' + best.img + '")' : "none";
            img.firstChild.nodeValue = best.emoji || "🍽️";
            img.style.color = best.img ? "transparent" : "";
            name.textContent = best.name;
            cat.textContent = CAT[best.cat] + " • ₱" + best.price;
            lastBest = best.name;
        }
        const old = Number(v1.dataset.v) || 0;
        v1.dataset.v = best[metric];
        if (metric === "revenue") v1.textContent = fmt(best.revenue); else setNumber(v1, old, best.units);
        l1.textContent = metric === "revenue" ? "revenue" : "units sold";
        v2.textContent = (total ? Math.round(best[metric] / total * 100) : 0) + "%";
    }

    function update() {
        const list = document.getElementById("rankList");
        if (!list) return;
        const rank = ranking();
        const top = rank.slice(0, SHOW);
        const max = top[0] ? top[0][metric] || 1 : 1;
        const total = rank.reduce(function (s, r) { return s + r[metric]; }, 0);

        list.style.height = (SHOW * STEP - 8) + "px";
        updateSpotlight(top[0], total);

        const keep = new Set();
        top.forEach(function (it, i) {
            keep.add(it.name);
            let r = rows.get(it.name);
            const y = "translateY(" + (i * STEP) + "px)";
            const pct = Math.max(3, Math.round(it[metric] / max * 100)) + "%";

            if (!r) {
                const row = el("div", "rank-row enter");
                row.style.transform = y;
                const no = el("div", "rank-no", String(i + 1));
                const main = el("div", "rank-main");
                const nm = el("div", "rank-name");
                nm.appendChild(el("span", "", it.name));
                nm.appendChild(el("small", "", CAT[it.cat]));
                const track = el("div", "rank-track");
                const fill = el("div", "rank-fill");
                track.appendChild(fill);
                main.appendChild(nm);
                main.appendChild(track);
                const val = el("div", "rank-val", "0");
                val.dataset.v = 0;
                row.appendChild(no); row.appendChild(main); row.appendChild(val);
                list.appendChild(row);
                r = { el: row, fill: fill, val: val, no: no };
                rows.set(it.name, r);
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () { row.classList.remove("enter"); });
                });
            }

            const prev = Number(r.val.dataset.v) || 0;
            r.el.style.transform = y;
            r.el.classList.toggle("first", i === 0);
            r.no.textContent = String(i + 1);
            r.fill.style.width = pct;
            r.val.dataset.v = it[metric];
            setNumber(r.val, prev, it[metric]);
            if (it[metric] > prev && prev > 0) {
                r.el.classList.remove("bump");
                void r.el.offsetWidth;
                r.el.classList.add("bump");
            }
        });

        rows.forEach(function (r, name) {
            if (keep.has(name)) return;
            r.el.classList.add("enter");          // fade out
            rows.delete(name);
            setTimeout(function () { r.el.remove(); }, 500);
        });

        const note = document.getElementById("salesTotal");
        if (note) {
            const units = rank.reduce(function (s, r) { return s + r.units; }, 0);
            note.textContent = units.toLocaleString("en-PH") + " items sold in total";
        }
    }

    // ---------- Demo order (random) ----------
    function demoOrder() {
        const rank = ranking();
        const pool = rank.slice(0, 10);      // bias to popular items
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const qty = 1 + Math.floor(Math.random() * 4);
        record([{ name: pick.name, qty: qty }]);
        if (typeof showToast === "function") showToast("Demo order: " + qty + " × " + pick.name, "ok");
    }

    // ---------- Init ----------
    function init() {
        const box = document.getElementById("salesChart");
        if (!box) return;

        const live = document.getElementById("liveDot");
        if (live) live.hidden = false;

        document.querySelectorAll("#metricSeg button").forEach(function (b) {
            b.addEventListener("click", function () {
                if (metric === b.dataset.m) return;
                metric = b.dataset.m;
                document.querySelectorAll("#metricSeg button").forEach(function (x) {
                    x.classList.toggle("on", x === b);
                });
                rows.forEach(function (r) { r.val.dataset.v = 0; });
                const sp = document.querySelector("#spotlight [data-s='value']");
                if (sp) sp.dataset.v = 0;
                update();
            });
        });

        const demo = document.getElementById("demoOrder");
        if (demo) demo.addEventListener("click", demoOrder);

        window.addEventListener("pj:sales", update);
        window.addEventListener("storage", function (e) { if (e.key === KEY) update(); });

        // draw once visible so the bars animate in as the user scrolls to them
        const start = function () { if (!started) { started = true; update(); } };
        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver(function (es) {
                if (es[0].isIntersecting) { start(); io.disconnect(); }
            }, { threshold: 0.2 });
            io.observe(box);
        } else {
            start();
        }
        // layout shell right away so the section has its final height
        const list = document.getElementById("rankList");
        if (list) list.style.height = (SHOW * STEP - 8) + "px";
    }

    document.addEventListener("DOMContentLoaded", init);

    return { record: record, ranking: ranking };
})();
