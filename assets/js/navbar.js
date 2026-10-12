const siteRoot = new URL("../../", import.meta.url);
const logoUrl = new URL("../images/guild-logo-joey.png", import.meta.url);

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const homeUrl = new URL("#top", siteRoot);
    const aboutUrl = new URL("#about", siteRoot);
    const eventsUrl = new URL("calendar.html", siteRoot);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; position: relative; z-index: 10; }
        * { box-sizing: border-box; }
        .bar {
          align-items: center;
          background: radial-gradient(ellipse at 45% 100%, #71301b, transparent 70%), linear-gradient(100deg, #191416, #351a18, #191416);
          border-bottom: 3px solid #d9a441;
          box-shadow: 0 3px 18px rgba(217, 164, 65, .18);
          color: #eee9df;
          display: flex;
          font-family: Arial, Helvetica, sans-serif;
          justify-content: space-between;
          min-height: 132px;
          padding: 0 max(22px, calc((100vw - 1064px) / 2));
        }
        a { color: inherit; text-decoration: none; }
        .brand { align-items: center; display: inline-flex; gap: 14px; }
        .brand__logo {
          display: block;
          filter: drop-shadow(0 0 12px rgba(185, 66, 45, .4));
          height: 108px;
          object-fit: contain;
          width: 108px;
        }
        .brand__name {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.3;
        }
        .brand__name span { color: #aaa69f; display: block; font-size: 10px; font-weight: 400; }
        nav { align-items: center; display: flex; gap: 26px; }
        nav a { border-bottom: 2px solid transparent; color: #eee9df; font-size: 16px; font-weight: 700; padding: 12px 2px; transition: color .15s ease, border-color .15s ease; }
        nav a:hover, nav a:focus-visible, nav a[aria-current="page"] { border-color: #d9a441; }
        a:focus-visible, button:focus-visible { outline: 2px solid #d9a441; outline-offset: 4px; }
        nav a:hover, nav a:focus-visible { color: #d9a441; }
        .menu-toggle {
          background: none;
          border: 1px solid #303138;
          border-radius: 6px;
          color: #eee9df;
          cursor: pointer;
          display: none;
          font: 600 12px Arial, Helvetica, sans-serif;
          padding: 9px 12px;
        }
        @media (max-width: 680px) {
          .bar { min-height: 96px; padding: 0 16px; }
          .brand { gap: 8px; }
          .brand__logo { width: 72px; height: 72px; }
          .brand__name { font-size: 12px; }
          .menu-toggle { display: block; }
          nav {
            align-items: stretch;
            background: #101114;
            border-bottom: 1px solid #303138;
            display: none;
            flex-direction: column;
            gap: 0;
            left: 0;
            padding: 8px 16px 14px;
            position: absolute;
            right: 0;
            top: 100%;
          }
          nav[data-open] { display: flex; }
          nav a { padding: 14px 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; }
        }
      </style>
      <header class="bar">
        <a class="brand" href="${homeUrl.href}" aria-label="Game Developers Guild, home">
          <img class="brand__logo" src="${logoUrl.href}" alt="">
          <span class="brand__name">Game Developers Guild<span>NKU · Student Org</span></span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-links">Menu</button>
        <nav id="site-links" aria-label="Main navigation">
          <a href="${homeUrl.href}">Home</a>
          <a href="${aboutUrl.href}">About</a>
          <a href="${eventsUrl.href}">Calendar &amp; Events</a>
        </nav>
      </header>
    `;

    const menuButton = this.shadowRoot.querySelector(".menu-toggle");
    const navigation = this.shadowRoot.querySelector("nav");
    navigation.querySelectorAll("a").forEach((link) => {
      const target = new URL(link.href);
      if (!target.hash && target.pathname === window.location.pathname) {
        link.setAttribute("aria-current", "page");
      }
    });

    menuButton.addEventListener("click", () => {
      const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isExpanded));
      navigation.toggleAttribute("data-open", !isExpanded);
    });

    navigation.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        menuButton.setAttribute("aria-expanded", "false");
        navigation.removeAttribute("data-open");
      }
    });
    this.shadowRoot.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        menuButton.setAttribute("aria-expanded", "false");
        navigation.removeAttribute("data-open");
        menuButton.focus();
      }
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
