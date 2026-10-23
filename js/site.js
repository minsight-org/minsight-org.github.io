// Shared page behaviour: loads navbar.html, then wires up the mobile menu,
// current page link, skip link and light/dark theme toggle.

(function () {
    const root = document.documentElement;
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Apply the saved theme straight away
    try {
        const saved = localStorage.getItem("theme");
        if (saved) root.setAttribute("data-theme", saved);
    } catch (e) {}

    fetch("/navbar.html")
        .then(r => r.text())
        .then(html => {
            document.getElementById("nav-placeholder").innerHTML = html;
            setUpSkipLink();
            setUpMenu();
            markCurrentPage();
            setUpThemeToggle();
        });

    // --- Skip link: pages without a <main id="main"> skip to whatever follows the nav ---
    function setUpSkipLink() {
        if (document.getElementById("main")) return;
        let target = document.getElementById("nav-placeholder").nextElementSibling;
        while (target && target.tagName === "SCRIPT") target = target.nextElementSibling;
        if (!target) return;
        target.id = target.id || "main";
        target.setAttribute("tabindex", "-1");
        document.querySelector(".skip-link").setAttribute("href", "#" + target.id);
    }

    // --- Mobile menu ---
    function setUpMenu() {
        const menuButton = document.querySelector(".menu-toggle");
        const menu = document.getElementById("site-menu");
        if (!menuButton || !menu) return;

        function setMenu(open) {
            menuButton.setAttribute("aria-expanded", String(open));
            menu.classList.toggle("open", open);
        }

        menuButton.addEventListener("click", () => {
            setMenu(menuButton.getAttribute("aria-expanded") !== "true");
        });
        menu.addEventListener("click", e => {
            if (e.target.closest("a")) setMenu(false);
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") setMenu(false);
        });
    }

    // --- Faint highlight on the link for the current page ---
    function markCurrentPage() {
        const path = location.pathname.replace(/\.html$/, "").replace(/\/$/, "");
        document.querySelectorAll(".nav-links a").forEach(link => {
            if (link.hostname !== location.hostname || link.hash) return;
            const linkPath = link.pathname.replace(/\.html$/, "").replace(/\/$/, "");
            if (linkPath === path) link.setAttribute("aria-current", "page");
        });
    }

    // --- Theme toggle ---
    function setUpThemeToggle() {
        const themeButton = document.getElementById("theme-toggle");
        if (!themeButton) return;

        function isDark() {
            const chosen = root.getAttribute("data-theme");
            return chosen ? chosen === "dark" : darkQuery.matches;
        }

        // Line icons drawn in the header text colour, so they match on every device (emoji do not)
        const ICONS = {
            sun: ["M12 4V2", "M12 22v-2", "M4 12H2", "M22 12h-2", "M5.6 5.6 4.2 4.2", "M19.8 19.8l-1.4-1.4",
                  "M5.6 18.4l-1.4 1.4", "M19.8 4.2l-1.4 1.4"],
            moon: ["M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"]
        };

        function themeIcon(name) {
            const ns = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(ns, "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("width", "20");
            svg.setAttribute("height", "20");
            svg.setAttribute("fill", "none");
            svg.setAttribute("stroke", "currentColor");
            svg.setAttribute("stroke-width", "2");
            svg.setAttribute("stroke-linecap", "round");
            svg.setAttribute("stroke-linejoin", "round");
            svg.setAttribute("aria-hidden", "true");
            if (name === "sun") {
                const circle = document.createElementNS(ns, "circle");
                circle.setAttribute("cx", "12");
                circle.setAttribute("cy", "12");
                circle.setAttribute("r", "4");
                svg.appendChild(circle);
            }
            ICONS[name].forEach(d => {
                const path = document.createElementNS(ns, "path");
                path.setAttribute("d", d);
                svg.appendChild(path);
            });
            return svg;
        }

        function updateThemeButton() {
            const dark = isDark();
            themeButton.replaceChildren(themeIcon(dark ? "sun" : "moon"));
            themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
        }

        themeButton.addEventListener("click", () => {
            const next = isDark() ? "light" : "dark";
            root.setAttribute("data-theme", next);
            try {
                localStorage.setItem("theme", next);
            } catch (e) {
                // Storage can be blocked. The theme still changes for this page.
            }
            updateThemeButton();
        });
        darkQuery.addEventListener("change", updateThemeButton);
        updateThemeButton();
    }
})();
