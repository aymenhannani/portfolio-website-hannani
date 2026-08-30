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

    // the label names the theme you would switch TO, so it depends on state as
    // well as language, and script.js owns it rather than a static data-i18n key
    const label = window.I18N
      ? I18N.t(next === "light" ? "nav.switch-to-light-theme" : "nav.switch-to-dark-theme")
      : "Switch to " + next + " theme";

    if (themeLabel) themeLabel.textContent = label;
    themeToggle.setAttribute("aria-label", label);
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
 * language toggle
 *
 * <html lang> and <html data-lang> are already set by the bootstrap script in
 * <head>, and i18n.js has swapped the strings before this runs. This wires the
 * button and keeps the state-dependent labels in step.
 *
 * Independent of the theme: switching language never touches data-theme, and
 * switching theme never touches data-lang.
 */

const langToggle = document.querySelector("[data-lang-toggle]");
const langLabel = document.querySelector("[data-lang-label]");
const langFlag = document.querySelector("[data-lang-flag]");

const applyLangUi = function (lang) {
  if (!langToggle) return;

  // the button offers the OTHER language, mirroring the theme toggle
  const other = lang === "fr" ? "en" : "fr";

  if (langLabel) langLabel.textContent = other.toUpperCase();

  // decorative, so the src is all that changes: it stays alt="" and hidden
  if (langFlag) langFlag.src = "./assets/images/flag-" + other + ".svg";
  langToggle.setAttribute("aria-pressed", lang === "fr" ? "true" : "false");
  langToggle.setAttribute(
    "aria-label",
    window.I18N
      ? I18N.t(other === "fr" ? "nav.attr.switch-to-french" : "nav.attr.switch-to-english")
      : "Switch to " + (other === "fr" ? "French" : "English")
  );
};

if (langToggle && window.I18N) {
  applyLangUi(I18N.lang());

  langToggle.addEventListener("click", function () {
    I18N.set(I18N.lang() === "fr" ? "en" : "fr");
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
 *
 * The same dialog is the second entry point for Work Experience: a role
 * carrying data-related-projects opens the detail view of its one project, or
 * a picker listing them when a role has several.
 */

const modal = document.querySelector("[data-modal]");
const modalDialog = document.querySelector("[data-modal-dialog]");
const modalArtFigure = document.querySelector("[data-modal-art-figure]");
const modalArt = document.querySelector("[data-modal-art]");
const modalBack = document.querySelector("[data-modal-back]");
const modalTag = document.querySelector("[data-modal-tag]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalDetail = document.querySelector("[data-modal-detail]");
const modalContact = document.querySelector("[data-modal-contact]");
const projectCards = document.querySelectorAll("[data-project]");

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

// the control that opened the dialog, so focus can be handed back on close
let lastFocused = null;

// set while a detail view was reached through a picker; re-renders that picker
let goBack = null;

// re-runs whichever dialog view is on screen, so a language switch reaches the
// title and tag that script.js writes itself
let currentView = null;

const getFocusable = function () {
  return Array.prototype.filter.call(
    modalDialog.querySelectorAll(FOCUSABLE),
    function (el) { return el.offsetParent !== null; }
  );
};

/* the portfolio card is the single source of title, tag and artwork, whether
   the project is reached from the grid or from a role in the timeline */
const cardFor = function (id) {
  return document.querySelector('[data-project="' + id.replace(/^detail-/, "") + '"]');
};

const showDialog = function () {
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalDialog.scrollTop = 0;

  // first stop is the close button — predictable for screen reader users
  const focusable = getFocusable();
  if (focusable.length) focusable[0].focus();
};

/* view 1 — the full case study for one project */
const renderDetail = function (card) {
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
  if (template) {
    modalDetail.appendChild(template.content.cloneNode(true));
    // <template> content sits outside the document, so it is still English
    if (window.I18N) I18N.apply(modalDetail);
  }

  modalArtFigure.hidden = false;
  modalContact.hidden = false;
  modalBack.hidden = !goBack;

  currentView = function () { renderDetail(card); };
};

/* the role heading carries data-i18n, so reading it back gives the right
   language without the picker having to cache a label */
const roleLabelOf = function (roleEl) {
  if (roleEl) return roleEl.textContent.trim();
  return window.I18N ? I18N.t("modal.related-projects") : "Related projects";
};

/* view 2 — the shortlist shown when one role covers several projects */
const renderPicker = function (cards, roleEl) {
  modalTag.textContent = window.I18N ? I18N.t("modal.related-projects") : "Related projects";
  modalTitle.textContent = roleLabelOf(roleEl);

  modalDetail.innerHTML = "";

  const list = document.createElement("ul");
  list.className = "portfolio-list modal-picker";

  for (let i = 0; i < cards.length; i++) {
    const item = document.createElement("li");
    const clone = cards[i].cloneNode(true);
    const source = cards[i];

    clone.addEventListener("click", function () {
      goBack = function () { renderPicker(cards, roleEl); };
      renderDetail(source);
      modalDialog.scrollTop = 0;
      const focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    });

    item.appendChild(clone);
    list.appendChild(item);
  }

  modalDetail.appendChild(list);

  // no single project to illustrate or enquire about at this level
  modalArtFigure.hidden = true;
  modalContact.hidden = true;
  modalBack.hidden = true;

  currentView = function () { renderPicker(cards, roleEl); };
};

const openModal = function (card, trigger) {
  lastFocused = trigger || card;
  goBack = null;
  renderDetail(card);
  showDialog();
};

const openRelated = function (trigger) {
  const item = trigger.closest("[data-related-projects]");
  if (!item) return;

  const cards = (item.dataset.relatedProjects || "")
    .split(/\s+/).filter(Boolean).map(cardFor).filter(Boolean);

  if (!cards.length) return;

  // the experience entry always lands on the related-projects list first —
  // even for a single project — so the flow is consistent: role → list → detail
  const role = item.querySelector(".timeline-role");

  lastFocused = trigger;
  goBack = null;
  renderPicker(cards, role);
  showDialog();
};

const closeModal = function () {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  modalDialog.scrollTop = 0;
  goBack = null;
  currentView = null;
  modalBack.hidden = true;

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

/**
 * work grid — the Portfolio section's filterable tiles
 *
 * A tile is a second entry point into a project's existing dialog: it names a
 * template through data-target and the card behind that template still supplies
 * the title, tag and artwork, so nothing is duplicated per entry point.
 */

const workTiles = document.querySelectorAll("[data-target]");

for (let i = 0; i < workTiles.length; i++) {
  workTiles[i].addEventListener("click", function () {
    const card = cardFor(this.dataset.target);
    if (card) openModal(card, this);
  });
}

const workFilters = document.querySelectorAll("[data-filter]");
const workCount = document.querySelector("[data-work-count]");
const workEmpty = document.querySelector("[data-work-empty]");

const applyFilter = function (value) {
  let shown = 0;

  for (let i = 0; i < workTiles.length; i++) {
    const cats = (workTiles[i].dataset.cats || "").split(/\s+/);
    const match = value === "all" || cats.indexOf(value) !== -1;

    // the <li> carries the hidden state so the grid closes the gap
    workTiles[i].closest("li").hidden = !match;
    if (match) shown++;
  }

  for (let i = 0; i < workFilters.length; i++) {
    const on = workFilters[i].dataset.filter === value;
    workFilters[i].setAttribute("aria-pressed", on ? "true" : "false");
  }

  if (workCount) {
    workCount.textContent = window.I18N
      ? I18N.count(shown)
      : shown + (shown === 1 ? " project" : " projects");
  }
  if (workEmpty) workEmpty.hidden = shown !== 0;
};

// remembered so a language switch can re-render the count in the new language
let currentFilter = "all";

for (let i = 0; i < workFilters.length; i++) {
  workFilters[i].addEventListener("click", function () {
    currentFilter = this.dataset.filter;
    applyFilter(currentFilter);
  });
}

const relatedTriggers = document.querySelectorAll("[data-related-trigger]");

for (let i = 0; i < relatedTriggers.length; i++) {
  relatedTriggers[i].addEventListener("click", function () {
    openRelated(this);
  });
}

// step back to the picker rather than out of the dialog altogether
const stepBack = function () {
  if (!goBack) return false;
  const back = goBack;
  goBack = null;
  back();
  modalDialog.scrollTop = 0;
  const focusable = getFocusable();
  if (focusable.length) focusable[0].focus();
  return true;
};

modalBack.addEventListener("click", stepBack);

const closeTriggers = document.querySelectorAll("[data-modal-close]");

for (let i = 0; i < closeTriggers.length; i++) {
  closeTriggers[i].addEventListener("click", closeModal);
}

// the in-dialog contact link should close the dialog, then jump to #contact
if (modalContact) modalContact.addEventListener("click", closeModal);

document.addEventListener("keydown", function (event) {
  if (modal.hidden) return;

  if (event.key === "Escape") {
    // from a picker-opened detail, the first Escape only steps back
    if (!stepBack()) closeModal();
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




/**
 * language switch: re-sync the strings script.js owns
 *
 * i18n.js has already swapped every data-i18n element by the time this runs.
 * What is left is the handful of labels built in JS: the two toggles, the work
 * count, and the dialog title/tag, which are copied out of the cards.
 *
 * Deliberately does not touch data-theme: the two systems stay independent.
 */

window.onLangChange = function (lang) {
  applyLangUi(lang);

  // re-derives its label from the current theme, now in the new language
  applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  applyFilter(currentFilter);

  if (!modal.hidden && currentView) currentView();
};