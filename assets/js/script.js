'use strict';



/**
 * theme toggle
 *
 * The <html data-theme> attribute is already set by the bootstrap script in
 * <head> (before first paint, so there is no flash). This wires the button,
 * persists the choice, and swaps the artwork that ships in two variants.
 *
 * Precedence: stored choice > prefers-color-scheme > dark (the default).
 */

const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeMeta = document.querySelector('meta[name="theme-color"]');

const THEME_META = { dark: "#0b1020", light: "#f7f8fb" };

/* <img> elements that ship a light counterpart via data-src-light */
const themedImages = [];

document.querySelectorAll("[data-src-light]").forEach(function (img) {
  themedImages.push({ el: img, dark: img.getAttribute("src"), light: img.dataset.srcLight });
});

const applyTheme = function (theme) {
  root.setAttribute("data-theme", theme);

  for (let i = 0; i < themedImages.length; i++) {
    const it = themedImages[i];
    it.el.src = theme === "light" ? it.light : it.dark;
  }

  if (themeMeta) themeMeta.setAttribute("content", THEME_META[theme]);

  if (themeToggle) {
    const next = theme === "light" ? "dark" : "light";
    themeToggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    if (themeLabel) themeLabel.textContent = "Switch to " + next + " theme";
    themeToggle.setAttribute("aria-label", "Switch to " + next + " theme");
  }
};

// sync everything to whatever the bootstrap script decided
applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";

    // cross-fade, but never fight a reduced-motion preference
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!still) {
      root.classList.add("theme-transition");
      window.setTimeout(function () { root.classList.remove("theme-transition"); }, 400);
    }

    applyTheme(next);
    try { localStorage.setItem("theme", next); } catch (e) { }
  });
}



/**
 * navbar toggle
 */

const header = document.querySelector("[data-header]");
const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");

navToggleBtn.addEventListener("click", function () {
  header.classList.toggle("nav-active");
  this.classList.toggle("active");
});

/**
 * toggle the navbar when click any navbar link
 */

const navbarLinks = document.querySelectorAll("[data-nav-link]");

for (let i = 0; i < navbarLinks.length; i++) {
  navbarLinks[i].addEventListener("click", function () {
    header.classList.toggle("nav-active");
    navToggleBtn.classList.toggle("active");
  });
}





/**
 * back to top & header
 */

const backTopBtn = document.querySelector("[data-back-to-top]");

window.addEventListener("scroll", function () {
  if (window.scrollY >= 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
});





/**
 * active nav state
 *
 * Marks the nav link for the section currently in view, so the teal
 * "action" colour also signals where you are.
 */

const spySections = [];

for (let i = 0; i < navbarLinks.length; i++) {
  const href = navbarLinks[i].getAttribute("href") || "";
  if (href.charAt(0) !== "#" || href === "#") continue;
  const section = document.querySelector(href);
  if (section) spySections.push({ link: navbarLinks[i], section: section });
}

if (spySections.length && "IntersectionObserver" in window) {
  const visible = new Set();

  const setActive = function () {
    let current = null;

    // topmost section currently intersecting wins
    for (let i = 0; i < spySections.length; i++) {
      if (visible.has(spySections[i].section)) { current = spySections[i]; break; }
    }

    for (let i = 0; i < spySections.length; i++) {
      spySections[i].link.classList.toggle("active", spySections[i] === current);
    }
  };

  const observer = new IntersectionObserver(function (entries) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) visible.add(entries[i].target);
      else visible.delete(entries[i].target);
    }
    setActive();
  }, { rootMargin: "-45% 0px -45% 0px" });

  for (let i = 0; i < spySections.length; i++) observer.observe(spySections[i].section);
}





/**
 * project detail dialog
 *
 * Each portfolio card is a <button data-project="...">. Opening reads the
 * card's own title/tag/artwork and clones the matching <template id="detail-...">
 * so the long-form copy only ever lives in the HTML.
 */

const modal = document.querySelector("[data-modal]");
const modalDialog = document.querySelector("[data-modal-dialog]");
const modalArt = document.querySelector("[data-modal-art]");
const modalTag = document.querySelector("[data-modal-tag]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalDetail = document.querySelector("[data-modal-detail]");
const modalContact = document.querySelector("[data-modal-contact]");
const projectCards = document.querySelectorAll("[data-project]");

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

// the card that opened the dialog, so focus can be handed back on close
let lastFocused = null;

const getFocusable = function () {
  return Array.prototype.filter.call(
    modalDialog.querySelectorAll(FOCUSABLE),
    function (el) { return el.offsetParent !== null; }
  );
};

const openModal = function (card) {
  lastFocused = card;

  const title = card.querySelector("[data-card-title]");
  const subtitle = card.querySelector("[data-card-subtitle]");

  modalTitle.textContent = title ? title.textContent.trim() : "";
  modalTag.textContent = subtitle ? subtitle.textContent.trim() : "";

  const lightTheme = root.getAttribute("data-theme") === "light";
  modalArt.src = (lightTheme && card.dataset.artLight) || card.dataset.art || "";
  // the artwork repeats the title visually, so keep it out of the a11y tree
  modalArt.alt = "";

  modalDetail.innerHTML = "";
  const template = document.getElementById("detail-" + card.dataset.project);
  if (template) modalDetail.appendChild(template.content.cloneNode(true));

  modal.hidden = false;
  document.body.classList.add("modal-open");

  // first stop is the close button — predictable for screen reader users
  const focusable = getFocusable();
  if (focusable.length) focusable[0].focus();
};

const closeModal = function () {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  modalDialog.scrollTop = 0;

  if (lastFocused) {
    lastFocused.focus();
    lastFocused = null;
  }
};

for (let i = 0; i < projectCards.length; i++) {
  projectCards[i].addEventListener("click", function () {
    openModal(this);
  });
}

const closeTriggers = document.querySelectorAll("[data-modal-close]");

for (let i = 0; i < closeTriggers.length; i++) {
  closeTriggers[i].addEventListener("click", closeModal);
}

// the in-dialog contact link should close the dialog, then jump to #contact
if (modalContact) modalContact.addEventListener("click", closeModal);

document.addEventListener("keydown", function (event) {
  if (modal.hidden) return;

  if (event.key === "Escape") {
    closeModal();
    return;
  }

  // focus trap
  if (event.key === "Tab") {
    const focusable = getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!modalDialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }
});