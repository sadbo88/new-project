// ===== SHARED UI: toasts, scroll-reveal, count-up, page transitions =====
(function () {
    "use strict";

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- Toast ----------
    var box;
    window.showToast = function (message, type) {
        if (!box) {
            box = document.createElement("div");
            box.className = "toasts";
            box.setAttribute("role", "status");
            box.setAttribute("aria-live", "polite");
            document.body.appendChild(box);
        }
        var t = document.createElement("div");
        t.className = "toast-pj" + (type ? " " + type : "");
        t.textContent = message;
        box.appendChild(t);
        setTimeout(function () {
            t.classList.add("out");
            setTimeout(function () { t.remove(); }, 450);
        }, 3200);
    };

    // ---------- Scroll reveal ----------
    function initReveal() {
        var items = document.querySelectorAll(".reveal");
        if (!items.length) return;
        if (!("IntersectionObserver" in window) || reduced) {
            items.forEach(function (i) { i.classList.add("in"); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add("in");
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        items.forEach(function (i) { io.observe(i); });
    }

    // ---------- Count-up numbers: <b data-count="32"> ----------
    function countUp(node, to, ms) {
        if (reduced) { node.textContent = to; return; }
        var start = null;
        function tick(ts) {
            if (start === null) start = ts;
            var p = Math.min(1, (ts - start) / ms);
            var eased = 1 - Math.pow(1 - p, 3);
            node.textContent = Math.round(to * eased);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }
    function initCounters() {
        var nodes = document.querySelectorAll("[data-count]");
        nodes.forEach(function (n) {
            var to = Number(n.getAttribute("data-count"));
            if (!("IntersectionObserver" in window)) { n.textContent = to; return; }
            var io = new IntersectionObserver(function (es) {
                if (es[0].isIntersecting) { countUp(n, to, 1400); io.disconnect(); }
            });
            io.observe(n);
        });
    }
    window.pjCountTo = function (node, from, to, ms) {
        if (reduced || from === to) { node.textContent = to; return; }
        var start = null;
        function tick(ts) {
            if (start === null) start = ts;
            var p = Math.min(1, (ts - start) / ms);
            var eased = 1 - Math.pow(1 - p, 3);
            node.textContent = Math.round(from + (to - from) * eased);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    };

    // ---------- Smooth fade-out between pages ----------
    function initTransitions() {
        if (reduced) return;
        document.addEventListener("click", function (e) {
            var a = e.target.closest && e.target.closest("a[href]");
            if (!a || e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (a.target && a.target !== "_self") return;
            var href = a.getAttribute("href");
            if (!href || href.charAt(0) === "#" || /^(mailto|tel|javascript):/i.test(href)) return;
            if (a.origin !== location.origin) return;
            e.preventDefault();
            document.body.classList.add("leaving");
            setTimeout(function () { location.href = a.href; }, 220);
        });
        window.addEventListener("pageshow", function () {
            document.body.classList.remove("leaving");
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initReveal();
        initCounters();
        initTransitions();
    });
})();
