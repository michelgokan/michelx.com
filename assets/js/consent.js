/* Consent + Google Tag Manager loader for michelx.com.
   - Opt-in everywhere (exceeds GDPR/ePrivacy and US state opt-out laws): GTM is
     NOT loaded (no cookies, no pings) until the visitor explicitly accepts.
   - Google Consent Mode v2 defaults are pushed DENIED before any load; Accept
     grants analytics_storage only (ad_* stays denied - analytics, never ads).
   - US states (CCPA/CPRA & co): Global Privacy Control is honored as an
     automatic opt-out, the notice explains no sale/share of personal data, and
     the footer "Privacy choices" link reopens the choice at any time.
   - Choice remembered 12 months in localStorage; declining after a previous
     accept expires GA cookies best-effort. */
(function () {
  "use strict";
  var GTM_ID = "GTM-5KJSVP68";           /* <- Google Tag Manager container ID */
  var KEY = "mgk-consent";
  var MAX_AGE_MS = 365 * 24 * 3600 * 1000;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  /* Consent Mode v2 hard default: everything denied, everywhere. */
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500
  });

  function readChoice() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || !c.v || (Date.now() - (c.t || 0)) > MAX_AGE_MS) return null;
      return c.v;
    } catch (e) { return null; }
  }
  function saveChoice(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  var gtmLoaded = false;
  function grantAndLoad() {
    gtag("consent", "update", { analytics_storage: "granted" });
    if (gtmLoaded || GTM_ID.indexOf("XXXX") !== -1) return;
    gtmLoaded = true;
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    document.head.appendChild(s);
  }
  function wipeGACookies() {
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0 || name === "_gid") {
        [".michelx.com", "michelx.com", location.hostname, ""].forEach(function (d) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (d ? "; domain=" + d : "");
        });
      }
    });
  }

  var banner = null;
  function closeBanner() {
    if (!banner) return;
    var b = banner; banner = null;
    b.classList.remove("is-open");
    setTimeout(function () { b.remove(); }, 450);
  }
  function showBanner() {
    if (banner) return;
    banner = document.createElement("div");
    banner.className = "consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Privacy choices");
    banner.innerHTML =
      '<div class="consent__card">' +
      '  <p class="consent__text">I use Google Analytics (via Tag Manager) to see which parts of this site ' +
      '     people enjoy. Nothing is tracked unless you accept.</p>' +
      '  <details class="consent__more"><summary>Details &amp; your rights</summary>' +
      '    <p>If you accept, Google Analytics 4 (loaded via Google Tag Manager) collects: pages viewed, ' +
      '    clicks and scrolls, device and browser details, approximate location derived from your IP ' +
      '    (GA4 does not log the IP itself), and a random identifier stored in a cookie. This data is ' +
      '    processed by Google on my behalf; how Google handles it is described in ' +
      '    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google\'s privacy policy</a>. ' +
      '    I use it for audience statistics only: advertising features are disabled in my setup, and I do ' +
      '    not sell or share personal information (as defined by California and other US state privacy ' +
      '    laws). Browsers sending the Global Privacy Control signal are opted out automatically. Your ' +
      '    choice is stored in this browser for 12 months and can be changed any time via the ' +
      '    "Privacy choices" link in the footer.</p>' +
      '  </details>' +
      '  <div class="consent__actions">' +
      '    <button class="consent__btn consent__btn--accept" type="button">Accept analytics</button>' +
      '    <button class="consent__btn consent__btn--decline" type="button">Decline</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(banner);
    var open = function () { if (banner) banner.classList.add("is-open"); };
    requestAnimationFrame(function () { requestAnimationFrame(open); });
    setTimeout(open, 150);   /* rAF can be suspended in background tabs */
    banner.querySelector(".consent__btn--accept").addEventListener("click", function () {
      saveChoice("granted"); grantAndLoad(); closeBanner();
    });
    banner.querySelector(".consent__btn--decline").addEventListener("click", function () {
      saveChoice("denied"); wipeGACookies(); closeBanner();
    });
  }

  /* Never compete with the flight's loading screen: wait until the loader is
     gone (or was never there) before asking. GA only loads on Accept, so
     delaying the question costs nothing. */
  function showBannerWhenCalm() {
    if (!document.querySelector(".sw-loader")) { showBanner(); return; }
    var iv = setInterval(function () {
      if (!document.querySelector(".sw-loader")) { clearInterval(iv); showBanner(); }
    }, 400);
  }

  var gpc = navigator.globalPrivacyControl === true;
  var choice = readChoice();
  if (choice === "granted") grantAndLoad();
  else if (choice === "denied") { /* respect the no, stay quiet */ }
  else if (gpc) saveChoice("denied");   /* honor GPC as an automatic opt-out, no nagging */
  else if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", showBannerWhenCalm);
  else showBannerWhenCalm();

  /* footer "Privacy choices" link reopens the choice (GPC users included) */
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest && e.target.closest("[data-privacy-settings]");
    if (!t) return;
    e.preventDefault();
    showBanner();
  });
})();
