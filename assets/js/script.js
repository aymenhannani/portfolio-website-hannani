'use strict';



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

  modalArt.src = card.dataset.art || "";
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