/* Transform.cx — shared behaviors: icon sprite, dialogs, drawers, toasts, tabs, chips */
(function () {
  "use strict";

  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    '<symbol id="i-logo" viewBox="0 0 24 24"><path d="M4 7c0-1.7 1.3-3 3-3h10c1.7 0 3 1.3 3 3v7c0 1.7-1.3 3-3 3h-6l-4 4v-4H7c-1.7 0-3-1.3-3-3V7z"/><path d="m9 11 2 2 4-4"/></symbol>' +
    '<symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></symbol>' +
    '<symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-8M2 20h20"/></symbol>' +
    '<symbol id="i-flow" viewBox="0 0 24 24"><rect x="3" y="4" width="6" height="4.5" rx="1.2"/><rect x="15" y="4" width="6" height="4.5" rx="1.2"/><rect x="9" y="15.5" width="6" height="4.5" rx="1.2"/><path d="M6 8.5v3a2 2 0 0 0 2 2h1M18 8.5v3a2 2 0 0 1-2 2h-1M12 13.5v2"/></symbol>' +
    '<symbol id="i-code" viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"/></symbol>' +
    '<symbol id="i-plug" viewBox="0 0 24 24"><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7z"/><path d="M12 16v5"/></symbol>' +
    '<symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.2 3.4-5 6.5-5s5.9 1.8 6.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M18 15.2c2 .4 3 1.9 3.5 3.8"/></symbol>' +
    '<symbol id="i-scroll" viewBox="0 0 24 24"><path d="M7 3h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7"/><path d="M7 3a2 2 0 0 1 2 2v13a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2z"/><path d="M11 8h6M11 12h6M11 16h3"/></symbol>' +
    '<symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></symbol>' +
    '<symbol id="i-out" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="m4.5 12.5 5 5 10-11"/></symbol>' +
    '<symbol id="i-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>' +
    '<symbol id="i-chevr" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>' +
    '<symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></symbol>' +
    '<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.6-4.6"/></symbol>' +
    '<symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v12m0 0 5-5m-5 5-5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></symbol>' +
    '<symbol id="i-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></symbol>' +
    '<symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></symbol>' +
    '<symbol id="i-x" viewBox="0 0 24 24"><path d="m5 5 14 14M19 5 5 19"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></symbol>' +
    '<symbol id="i-warn" viewBox="0 0 24 24"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></symbol>' +
    '<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".7" fill="currentColor"/></symbol>' +
    '<symbol id="i-db" viewBox="0 0 24 24"><ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13"/><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8"/></symbol>' +
    '<symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z"/></symbol>' +
    '<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></symbol>' +
    '<symbol id="i-filter" viewBox="0 0 24 24"><path d="M3 5h18l-7 8v5.5L10 21v-8L3.5 5z"/></symbol>' +
    '<symbol id="i-ext" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4 11 13"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></symbol>' +
    '<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></symbol>' +
    '<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6L12 3z"/><path d="m9 11.5 2 2 4-4"/></symbol>' +
    '<symbol id="i-sync" viewBox="0 0 24 24"><path d="M20 4.5v5h-5"/><path d="M4 19.5v-5h5"/><path d="M20 9.5a8 8 0 0 0-14.9-3M4 14.5a8 8 0 0 0 14.9 3"/></symbol>' +
    '<symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></symbol>' +
    '<symbol id="i-file" viewBox="0 0 24 24"><path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5L14 2.5z"/><path d="M14 2.5v5h5"/></symbol>' +
    '<symbol id="i-branch" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="9" r="2.6"/><path d="M6 8.6v6.8M18 11.6c0 5-6 3.4-9.6 4.9"/></symbol>' +
    '<symbol id="i-rocket" viewBox="0 0 24 24"><path d="M5 16c-1.5 1.2-2 5-2 5s3.8-.5 5-2M15 3.5c3.5-2 8.5 2 6.5 6-2.5 5-8 8-8 8s-2.5 0-4-1.5c-1-1-1.5-2.6-1.5-2.6s3-5.5 8-8z"/><circle cx="14.5" cy="9.5" r="1.8"/></symbol>' +
    '<symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="14" r="4.5"/><path d="m11.2 10.8 8-8M16 4l3 3M13.5 6.5l2.5 2.5"/></symbol>' +
    '<symbol id="i-play" viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5-12-7.5z"/></symbol>' +
    '<symbol id="i-pause" viewBox="0 0 24 24"><path d="M7 4.5h3v15H7zM14 4.5h3v15h-3z"/></symbol>' +
    '<symbol id="i-arrowr" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></symbol>' +
    '<symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>' +
    '<symbol id="i-dot" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></symbol>' +
    '<symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></symbol>' +
    '<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.3 3.8 5.6 3.8 9s-1.3 6.7-3.8 9c-2.5-2.3-3.8-5.6-3.8-9S9.5 5.3 12 3z"/></symbol>' +
    '<symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7M6 7l1 12.8A1.2 1.2 0 0 0 8.2 21h7.6A1.2 1.2 0 0 0 17 19.8L18 7"/><path d="M10 11v6M14 11v6"/></symbol>' +
    '<symbol id="i-edit" viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14.5 6.5l3 3"/></symbol>' +
    '<symbol id="i-robot" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4.5V8M9 14h.01M15 14h.01M8.5 20v1.4M15.5 20v1.4"/></symbol>' +
    '<symbol id="i-send" viewBox="0 0 24 24"><path d="M4 12 20 4l-3 8 3 8-16-8z"/><path d="M11 12h9"/></symbol>' +
    '<symbol id="i-flag" viewBox="0 0 24 24"><path d="M5 21.5V3.5M5 4.5h12l-2 4 2 4H5"/></symbol>' +
    '<symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></symbol>' +
    '<symbol id="i-cloud" viewBox="0 0 24 24"><path d="M7 18.5A4.2 4.2 0 0 1 6.7 10 5.4 5.4 0 0 1 17 9.4a3.83 3.83 0 0 1-.4 9.1H7z"/></symbol>' +
    '<symbol id="i-merge" viewBox="0 0 24 24"><path d="M7 4v4a4 4 0 0 0 4 4h6M7 20v-4a4 4 0 0 1 4-4M17 8l-3-3M17 8l-3 3M17 16l-3-3M17 16l-3 3"/></symbol>' +
    '</svg>';

  function injectSprite() {
    var d = document.createElement("div");
    d.innerHTML = SPRITE;
    document.body.appendChild(d.firstChild);
  }

  /* ---------- overlay helpers ---------- */
  function getOverlay() {
    return document.querySelector("[data-overlay]");
  }
  var lastFocus = null;
  function focusables(root) {
    return root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }
  function openLayer(id) {
    var el = document.getElementById(id);
    var ov = getOverlay();
    if (!el) return;
    lastFocus = document.activeElement;
    el.classList.add("open");
    if (ov) ov.classList.add("open");
    /* move focus into the layer so keyboard + screen-reader users land inside it */
    var f = focusables(el);
    if (f.length) { try { f[0].focus({ preventScroll: true }); } catch (e) {} }
  }
  function closeLayers() {
    var any = false;
    document.querySelectorAll(".dialog.open, .drawer.open").forEach(function (el) {
      el.classList.remove("open");
      any = true;
    });
    var ov = getOverlay();
    if (ov) ov.classList.remove("open");
    if (any && lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
    lastFocus = null;
  }
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open]");
    if (opener) { openLayer(opener.getAttribute("data-open")); return; }
    if (e.target.closest("[data-close]")) { closeLayers(); return; }
    if (e.target.matches("[data-overlay]")) { closeLayers(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeLayers(); return; }
    /* modal dialogs are a deliberate focus trap (WCAG 2.1.2 — not a keyboard trap) */
    if (e.key !== "Tab") return;
    var layer = document.querySelector(".dialog.open, .drawer.open");
    if (!layer) return;
    var f = focusables(layer);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- toasts ---------- */
  function toast(msg, icon) {
    var wrap = document.querySelector(".toasts");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toasts";
      wrap.setAttribute("role", "status");
      wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<svg class="i"><use href="#' + (icon || "i-check") + '"/></svg><span></span>';
    t.querySelector("span").textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .25s ease, transform .25s ease";
      t.style.opacity = "0";
      t.style.transform = "translateY(6px)";
      setTimeout(function () { t.remove(); }, 260);
    }, 2600);
  }

  /* ---------- tabs ---------- */
  document.addEventListener("click", function (e) {
    var tabBtn = e.target.closest("[data-tabs] [role=tab]");
    if (tabBtn) {
      var group = tabBtn.closest("[data-tabs]");
      var scope = group.closest("[data-tab-scope]") || document;
      group.querySelectorAll("[role=tab]").forEach(function (b) {
        b.setAttribute("aria-selected", b === tabBtn ? "true" : "false");
      });
      scope.querySelectorAll("[data-panel]").forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== tabBtn.getAttribute("data-tab");
      });
      return;
    }

    /* single-select chip groups */
    var chip = e.target.closest("[data-chips] .chip");
    if (chip) {
      var group2 = chip.closest("[data-chips]");
      group2.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      chip.setAttribute("aria-pressed", "true");
      var swap = group2.getAttribute("data-swap");
      if (swap) {
        /* scope to this swap group only — panels are named "<swap>-<value>" */
        document.querySelectorAll('[data-swap-panel^="' + swap + '-"]').forEach(function (p) {
          p.hidden = p.getAttribute("data-swap-panel") !== swap + "-" + chip.getAttribute("data-val");
        });
      }
      return;
    }

    /* multi chips */
    var mchip = e.target.closest("[data-chips-multi] .chip");
    if (mchip) {
      var on = mchip.getAttribute("aria-pressed") === "true";
      mchip.setAttribute("aria-pressed", on ? "false" : "true");
      return;
    }

    /* switches */
    var sw = e.target.closest(".switch");
    if (sw) {
      var checked = sw.getAttribute("aria-checked") === "true";
      sw.setAttribute("aria-checked", checked ? "false" : "true");
    }

    /* tree rows */
    var trow = e.target.closest(".tree-item > .trow");
    if (trow) {
      var open = trow.getAttribute("aria-expanded") === "true";
      trow.setAttribute("aria-expanded", open ? "false" : "true");
      var kids = trow.parentElement.querySelector(".tree-kids");
      if (kids) kids.classList.toggle("open", !open);
      var chev = trow.querySelector(".chev");
      if (chev) chev.style.transform = open ? "" : "rotate(180deg)";
    }

    /* copy buttons */
    var cp = e.target.closest("[data-copy]");
    if (cp) {
      var text = cp.getAttribute("data-copy");
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
      toast(cp.getAttribute("data-copy-msg") || "Copied to clipboard", "i-copy");
    }
  });

  /* ---------- text search filter for tables/lists ---------- */
  document.addEventListener("input", function (e) {
    var inp = e.target.closest("[data-filter-target]");
    if (!inp) return;
    var rows = document.querySelectorAll(inp.getAttribute("data-filter-target") + " [data-filter-row]");
    var q = inp.value.trim().toLowerCase();
    var visible = 0;
    rows.forEach(function (r) {
      var hit = r.textContent.toLowerCase().indexOf(q) !== -1;
      r.style.display = hit || q === "" ? "" : "none";
      if (hit || q === "") visible++;
    });
    var counter = document.querySelector(inp.getAttribute("data-filter-count") || "noop");
    if (counter) counter.textContent = visible;
    var emptyEl = document.querySelector(inp.getAttribute("data-filter-empty") || "noop");
    if (emptyEl) emptyEl.hidden = visible !== 0;
  });

  window.TX = { toast: toast, openLayer: openLayer, closeLayers: closeLayers };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSprite);
  } else {
    injectSprite();
  }

  /* ---------- page entry: one reveal language across every screen ----------
     Header → content groups, transform + opacity only, ≤4 groups, ~55ms apart.
     Purely additive: if this never runs, or motion is reduced, the page is
     simply already there. Nothing is hidden by default. */
  function revealPage() {
    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    if (reduce) return;
    /* don't replay the reveal on a page that has been up for a while */
    try { if (window.performance && performance.now() > 800) return; } catch (e) {}
    var page = document.querySelector(".page");
    if (!page || page.hasAttribute("data-no-reveal")) return;

    var picks = [], h = null;
    Array.prototype.forEach.call(page.children, function (el) {
      if (!h && el.classList && el.classList.contains("page-h")) { h = el; return; }
      if (picks.length >= 3 || el.tagName === "SCRIPT" || !el.classList) return;
      var cls = el.className || "";
      if (el.hasAttribute("data-od-id") || el.classList.contains("card") ||
          el.classList.contains("tabs") || /\bgrid-[234]\b/.test(cls) ||
          el.hasAttribute("data-tab-scope")) picks.push(el);
    });
    var groups = (h ? [h] : []).concat(picks).slice(0, 4);
    groups.forEach(function (el, i) {
      el.classList.add("reveal-in");
      el.style.animationDelay = (i * 55) + "ms";
    });
    setTimeout(function () {
      groups.forEach(function (el) { el.style.animationDelay = ""; });
    }, 800 + groups.length * 55);
  }
  revealPage();

  /* remember page for launcher */
  try { localStorage.setItem("tx-last-page", location.pathname.split("/").pop()); } catch (e) {}
})();
