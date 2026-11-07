// ===== TABLE RESERVATIONS =====
// Stored on this device in localStorage ("pj_reservations").
// Edit the CONFIG block below to change opening hours, seating, etc.
(function () {
    "use strict";

    const CONFIG = {
        openHour: 10,          // first seating  (10:00 AM)
        lastSeatingHour: 20,   // last seating   (8:00 PM) — restaurant closes at 9:00 PM
        seatsPerSlot: 40,      // total seats that can be booked for one time slot
        maxParty: 20,
        minParty: 1,
        daysAhead: 60          // how far ahead guests can book
    };
    const KEY = "pj_reservations";

    // ---------- Storage ----------
    function readAll() {
        try {
            const d = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(d) ? d : [];
        } catch (e) { return []; }
    }
    function writeAll(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    }

    // ---------- Helpers ----------
    function two(n) { return String(n).padStart(2, "0"); }
    function ymd(d) { return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()); }
    function slotLabel(h) {
        const ap = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return h12 + ":00 " + ap;
    }
    function niceDate(s) {
        const p = s.split("-");
        return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("en-PH", {
            weekday: "short", month: "long", day: "numeric", year: "numeric"
        });
    }
    function makeCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let s = "";
        for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return "PJR-" + s;
    }
    function seatsTaken(date, hour) {
        return readAll().reduce(function (sum, r) {
            return (r.status === "confirmed" && r.date === date && r.hour === hour) ? sum + r.party : sum;
        }, 0);
    }
    function seatsLeft(date, hour) {
        return Math.max(0, CONFIG.seatsPerSlot - seatsTaken(date, hour));
    }
    function isPast(date, hour) {
        const now = new Date();
        if (date !== ymd(now)) return date < ymd(now);
        return hour <= now.getHours();      // slot already started
    }
    function mk(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    // ---------- State ----------
    const state = { party: 2, hour: null };
    let $ = {};

    // ---------- Slots ----------
    function renderSlots() {
        const date = $.date.value;
        $.slots.innerHTML = "";
        if (!date) {
            $.slots.appendChild(mk("div", "slots-empty", "Pick a date to see available times."));
            return;
        }
        let shown = 0, idx = 0;
        for (let h = CONFIG.openHour; h <= CONFIG.lastSeatingHour; h++) {
            const left = seatsLeft(date, h);
            const past = isPast(date, h);
            const full = left < state.party;
            const b = mk("button", "slot");
            b.type = "button";
            b.style.setProperty("--i", idx++);
            b.appendChild(mk("b", "", slotLabel(h)));
            const note = past ? "Passed" : (left === 0 ? "Fully booked" : (full ? "Only " + left + " left" : (left <= 10 ? left + " seats left" : "Available")));
            b.appendChild(mk("small", "", note));
            if (!past && !full && left <= 10) b.classList.add("low");
            if (past || full) b.disabled = true;
            if (state.hour === h && !b.disabled) b.classList.add("on");
            b.addEventListener("click", function () {
                state.hour = h;
                $.slots.querySelectorAll(".slot").forEach(function (x) { x.classList.remove("on"); });
                b.classList.add("on");
                setErr("slot", "");
            });
            if (!b.disabled) shown++;
            $.slots.appendChild(b);
        }
        if (state.hour !== null && (isPast(date, state.hour) || seatsLeft(date, state.hour) < state.party)) {
            state.hour = null;
        }
        if (!shown) {
            const msg = mk("div", "slots-empty", "No tables left for that date and party size. Try another day.");
            $.slots.appendChild(msg);
        }
    }

    // ---------- Validation ----------
    function setErr(field, msg) {
        const e = document.querySelector('[data-err="' + field + '"]');
        if (e) e.textContent = msg;
        const input = document.getElementById("res" + field.charAt(0).toUpperCase() + field.slice(1));
        if (input) input.classList.toggle("invalid", !!msg);
    }
    function validate() {
        let ok = true;
        const name = $.name.value.trim();
        const phone = $.phone.value.replace(/[^\d+]/g, "");
        const email = $.email.value.trim();
        const date = $.date.value;

        setErr("name", ""); setErr("phone", ""); setErr("email", ""); setErr("date", ""); setErr("slot", "");

        if (name.length < 2) { setErr("name", "Please enter your name."); ok = false; }
        if (phone.replace(/\D/g, "").length < 7) { setErr("phone", "Enter a phone number we can reach you on."); ok = false; }
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr("email", "That email doesn't look right."); ok = false; }
        if (!date) { setErr("date", "Choose a date."); ok = false; }
        else if (date < ymd(new Date())) { setErr("date", "That date has passed."); ok = false; }
        if (state.hour === null) { setErr("slot", "Choose a time."); ok = false; }
        else if (date && seatsLeft(date, state.hour) < state.party) { setErr("slot", "Not enough seats left at that time."); ok = false; }
        return ok;
    }

    // ---------- Submit ----------
    function submit(e) {
        e.preventDefault();
        if (!validate()) {
            const first = document.querySelector(".invalid, [data-err]:not(:empty)");
            if (first && first.scrollIntoView) first.scrollIntoView({ behavior: "smooth", block: "center" });
            if (typeof showToast === "function") showToast("Please check the highlighted fields.", "err");
            return;
        }
        const r = {
            code: makeCode(),
            name: $.name.value.trim(),
            phone: $.phone.value.trim(),
            email: $.email.value.trim(),
            date: $.date.value,
            hour: state.hour,
            party: state.party,
            occasion: $.occasion.value,
            notes: $.notes.value.trim(),
            status: "confirmed",
            createdAt: Date.now()
        };
        const all = readAll();
        all.push(r);
        writeAll(all);
        showConfirmation(r);
        renderMine();
        if (typeof showToast === "function") showToast("Table reserved — see you soon!", "ok");
    }

    function showConfirmation(r) {
        $.formWrap.hidden = true;
        $.done.hidden = false;
        $.done.innerHTML = "";

        const svg = '<svg class="check-ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="38"/><path d="M26 43l11 11 21-24"/></svg>';
        const wrap = mk("div", "res-done");
        wrap.innerHTML = svg;
        wrap.appendChild(mk("h2", "", "You're all set, " + r.name.split(" ")[0] + "!"));
        wrap.appendChild(mk("p", "text-muted mb-1", "Show this code when you arrive."));
        wrap.appendChild(mk("div", "res-code", r.code));

        const sum = mk("div", "res-summary");
        [["Date", niceDate(r.date)], ["Time", slotLabel(r.hour)], ["Guests", String(r.party)]]
            .concat(r.occasion ? [["Occasion", r.occasion]] : [])
            .forEach(function (p) {
                const row = mk("div");
                row.appendChild(mk("span", "", p[0]));
                row.appendChild(mk("b", "", p[1]));
                sum.appendChild(row);
            });
        wrap.appendChild(sum);

        const again = mk("button", "btn btn-warning", "Make another reservation");
        again.type = "button";
        again.addEventListener("click", resetForm);
        wrap.appendChild(again);
        $.done.appendChild(wrap);
        $.done.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function resetForm() {
        $.done.hidden = true;
        $.formWrap.hidden = false;
        $.form.reset();
        $.date.value = defaultDate();
        state.hour = null;
        state.party = 2;
        $.partyNum.textContent = state.party;
        prefill();
        renderSlots();
        syncParty();
    }

    // ---------- My reservations ----------
    function renderMine() {
        const box = $.mine;
        box.innerHTML = "";
        const today = ymd(new Date());
        const list = readAll()
            .filter(function (r) { return r.status === "confirmed" && r.date >= today; })
            .sort(function (a, b) { return (a.date + two(a.hour)).localeCompare(b.date + two(b.hour)); });

        if (!list.length) {
            box.appendChild(mk("div", "res-none", "No upcoming reservations on this device yet."));
            return;
        }
        list.forEach(function (r, i) {
            const item = mk("div", "res-item");
            item.style.animationDelay = (i * 60) + "ms";
            const top = mk("div", "top");
            top.appendChild(mk("code", "", r.code));
            top.appendChild(mk("small", "text-muted", r.party + (r.party === 1 ? " guest" : " guests")));
            item.appendChild(top);
            item.appendChild(mk("p", "", niceDate(r.date) + " • " + slotLabel(r.hour)));

            const btn = mk("button", "btn btn-outline-danger", "Cancel");
            btn.type = "button";
            let armed = false;
            btn.addEventListener("click", function () {
                if (!armed) {
                    armed = true;
                    btn.textContent = "Tap again to confirm";
                    setTimeout(function () { armed = false; btn.textContent = "Cancel"; }, 3000);
                    return;
                }
                const all = readAll();
                const m = all.find(function (x) { return x.code === r.code; });
                if (m) m.status = "cancelled";
                writeAll(all);
                renderMine();
                renderSlots();
                if (typeof showToast === "function") showToast("Reservation " + r.code + " cancelled.");
            });
            item.appendChild(btn);
            box.appendChild(item);
        });
    }

    // ---------- Party stepper ----------
    function syncParty() {
        $.partyNum.textContent = state.party;
        $.minus.disabled = state.party <= CONFIG.minParty;
        $.plus.disabled = state.party >= CONFIG.maxParty;
        $.partyHint.textContent = state.party >= 10
            ? "Large group — we'll set tables together for you."
            : (state.party === 1 ? "Table for one" : "Table for " + state.party);
    }

    function prefill() {
        if (typeof currentUser !== "function") return;
        const u = currentUser();
        if (!u) return;
        if (!$.name.value) $.name.value = u.name || "";
        if (!$.email.value) $.email.value = u.email || "";
    }

    function defaultDate() {
        const d = new Date();
        if (d.getHours() >= CONFIG.lastSeatingHour) d.setDate(d.getDate() + 1);
        return ymd(d);
    }

    // ---------- Init ----------
    document.addEventListener("DOMContentLoaded", function () {
        const form = document.getElementById("resForm");
        if (!form) return;
        $ = {
            form: form,
            formWrap: document.getElementById("resFormWrap"),
            done: document.getElementById("resDone"),
            name: document.getElementById("resName"),
            phone: document.getElementById("resPhone"),
            email: document.getElementById("resEmail"),
            date: document.getElementById("resDate"),
            occasion: document.getElementById("resOccasion"),
            notes: document.getElementById("resNotes"),
            slots: document.getElementById("resSlots"),
            minus: document.getElementById("partyMinus"),
            plus: document.getElementById("partyPlus"),
            partyNum: document.getElementById("partyNum"),
            partyHint: document.getElementById("partyHint"),
            mine: document.getElementById("myRes")
        };

        const today = new Date();
        const max = new Date(); max.setDate(max.getDate() + CONFIG.daysAhead);
        $.date.min = ymd(today);
        $.date.max = ymd(max);

        // default to today, or tomorrow once the last seating has gone
        $.date.value = defaultDate();

        $.minus.addEventListener("click", function () {
            if (state.party > CONFIG.minParty) { state.party--; syncParty(); renderSlots(); }
        });
        $.plus.addEventListener("click", function () {
            if (state.party < CONFIG.maxParty) { state.party++; syncParty(); renderSlots(); }
        });
        $.date.addEventListener("change", function () { setErr("date", ""); renderSlots(); });
        ["name", "phone", "email"].forEach(function (k) {
            $[k].addEventListener("input", function () { setErr(k, ""); });
        });
        form.addEventListener("submit", submit);

        // fill the hours list from CONFIG so the page never disagrees with the logic
        const hrs = document.getElementById("resHours");
        if (hrs) hrs.textContent = slotLabel(CONFIG.openHour) + " – " + slotLabel(CONFIG.lastSeatingHour + 1);
        const cap = document.getElementById("resMax");
        if (cap) cap.textContent = CONFIG.maxParty + " guests";

        prefill();
        syncParty();
        renderSlots();
        renderMine();

        // keep availability fresh if another tab books
        window.addEventListener("storage", function (e) {
            if (e.key === KEY) { renderSlots(); renderMine(); }
        });
    });
})();
