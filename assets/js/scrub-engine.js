/* ============================================================================
   scroll-world — portable scroll-scrubbed camera-flight engine
   ----------------------------------------------------------------------------
   Framework-agnostic. Vanilla JS, zero dependencies. It builds its own DOM and
   injects its own (namespaced) CSS into a container you give it, so it drops into
   plain HTML, Next.js (call from a ref/useEffect), Vue (onMounted), a server-
   rendered page, anything.

   USAGE
     mountScrollWorld(document.getElementById('world'), {
       brand: { name: 'Pearl & Co.', href: '#top' },
       diveScroll: 1.3,   // viewport-heights of scroll per dive clip
       connScroll: 0.9,   // ...per connector clip
       hint: 'scroll to fly in',
       nav: true,         // show the top section nav
       atmosphere: true,  // subtle gradient + drifting particles behind the clips
       sections: [
         { id, label, still, stillMobile, clip, clipMobile, accent,
           scroll: 1.6,   // optional per-section override of diveScroll — more scroll
                          // distance = a slower, longer dwell in this scene
           linger: 0.5,   // optional 0..1 — remaps time so the camera settles mid-scene
                          // (exactly where the copy peaks) and moves quicker at the
                          // edges. 0 = linear (default). Keep ≤ 0.6; 1 = full pause.
           eyebrow, title, body, tags:[…],
           cta:{ primary:{label,href}, secondary:{label,href} } }, // last section only
         …
       ],
       connectors: [clipUrl, …],          // length = sections.length - 1 (nulls allowed)
       connectorsMobile: [clipUrl, …],    // optional lighter connectors for phones (same length)

   MOBILE (the clipMobile/connectorsMobile variants are the opt-in mobile version;
   the rest of the phone handling below is always on)
     The engine is phone-aware out of the box: on a coarse-pointer / ≤860px viewport it
       - loads `clipMobile` / `connectorsMobile` when provided (encode these smaller +
         tighter-GOP — seek cost on a phone decoder is dominated by frames-from-keyframe,
         so a 720p, -g 4 file scrubs far smoother than the 1080p desktop master; see
         pipeline.md). Falls back to the desktop `clip` if no mobile variant is given.
       - uses `stillMobile` as the scene poster when provided (pair it with native 9:16
         clipMobile renders so the poster matches the portrait video's first frame instead
         of flashing from a landscape crop). Chosen once at mount; a desktop resize into
         phone width keeps the desktop poster (clips still switch via isMobile()).
       - coalesces seeks (never issues a new currentTime while the decoder is still
         `seeking`) so fast flicks can't pile up and freeze the video, and re-issues
         any seek that hangs past 800ms instead of leaving the scene frozen.
       - keeps a live <video> only for scenes near the camera (attach ≤2.0vh,
         detach beyond 2.8vh; bytes stay cached as a Blob for instant re-attach).
         iOS grants only a handful of concurrent decoder pipelines — without this
         window, every scene after the first few never paints.
       - keeps the still as a live poster until the clip actually paints its first frame,
         and primes each video (muted play→pause) on first touch — this is what stops iOS
         from showing a blank scene before the first seek.
       - drops the drifting particles and ignores URL-bar-only resizes (no scroll jump).
     Nothing here is required — a config with only `clip`/`connectors` still works on
     phones; the mobile variants just make it lighter and smoother.

   THEME (CSS custom properties; set on the container or :root to override)
     --sw-bg         page background (match your scene bg for seamless posters)
     --sw-ink        primary text
     --sw-ink-soft   secondary text
     --sw-accent     default accent (each section overrides via its `accent`)
     --sw-font-display / --sw-font-body

   REQUIREMENTS ON YOUR ASSETS
     - clips encoded native-res, crf~20, -g 8, +faststart, no audio (see pipeline.md)
     - connectors' endpoints are the neighbouring dives' ACTUAL frames (see SKILL Step 5)
     - (optional) mobile variants at ~720p, -g 4 for smoother phone scrubbing
   The engine loads each clip as a Blob (always seekable) and scrubs currentTime; it does
   NOT depend on HTTP byte-range support.
   ========================================================================== */

function mountScrollWorld(container, config) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Phone detection. `coarse` is captured once (input type doesn't change mid-session);
  // the ≤860px query is read live via isMobile() so a desktop resize/DevTools toggle
  // switches sources and seek behaviour without a reload.
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallMQ = window.matchMedia('(max-width: 860px)');
  const isMobile = () => coarse || smallMQ.matches;
  const SECTIONS = config.sections || [];
  const CONNECTORS = config.connectors || [];
  const CONNECTORS_M = config.connectorsMobile || [];
  const DIVE_W = config.diveScroll || 1.3;
  const CONN_W = config.connScroll || 0.9;
  const CROSSFADE = (config.crossfade != null) ? config.crossfade : 0.12;  // seam dissolve width (vh)
  const N = SECTIONS.length;
  if (!N) return;

  injectCSS();
  container.classList.add('sw-root');

  // ---- build the interleaved segment chain: dive0, conn0, dive1, … diveN-1 ----
  const SEGMENTS = [];
  SECTIONS.forEach((s, i) => {
    const dive = { kind: 'dive', si: i, clip: s.clip, clipM: s.clipMobile, still: s.still, stillM: s.stillMobile,
                   accent: s.accent, w: s.scroll || DIVE_W, linger: s.linger || 0 };
    SEGMENTS.push(dive);
    s._seg = dive;
    // A connector is optional: if connectors[i] is falsy, the two dives simply
    // crossfade directly (no fly-over). Lets a page complete even when a
    // connector can't be generated (e.g. a content-filter false-positive).
    if (i < N - 1 && CONNECTORS[i]) {
      SEGMENTS.push({ kind: 'conn', si: i, clip: CONNECTORS[i], clipM: CONNECTORS_M[i],
                      still: SECTIONS[i + 1].still, stillM: SECTIONS[i + 1].stillMobile,
                      accent: SECTIONS[i + 1].accent, w: CONN_W });
    }
  });
  const NSEG = SEGMENTS.length;

  // ---- DOM ----
  const sky = el('div', 'sw-sky');
  if (config.atmosphere !== false) {
    sky.appendChild(el('div', 'sw-sky__grad'));
    sky.appendChild(el('div', 'sw-sky__glow'));
  }
  const particles = el('div', 'sw-particles'); sky.appendChild(particles);

  const scrollbar = el('div', 'sw-scrollbar');
  const scrollbarFill = el('span'); scrollbar.appendChild(scrollbarFill);

  const topbar = el('div', 'sw-topbar');
  if (config.brand) {
    const brand = el('a', 'sw-brand'); brand.href = (config.brand.href || '#');
    brand.appendChild(el('span', 'sw-brand__mark'));
    const nm = el('span', 'sw-brand__name'); nm.textContent = config.brand.name || ''; brand.appendChild(nm);
    topbar.appendChild(brand);
  }
  const nav = el('nav', 'sw-nav'); if (config.nav !== false) topbar.appendChild(nav);
  if (config.cta && config.cta.label) {
    const c = el('a', 'sw-topcta'); c.href = config.cta.href || '#'; c.textContent = config.cta.label;
    topbar.appendChild(c);
  }

  const stage = el('div', 'sw-stage');
  const copylayer = el('div', 'sw-copylayer');
  const route = el('div', 'sw-route');
  const hint = el('div', 'sw-hint');
  const hintText = el('span'); hintText.textContent = config.hint || 'scroll'; hint.appendChild(hintText);
  hint.appendChild(el('i'));
  const track = el('div', 'sw-track');

  [sky, scrollbar, topbar, stage, copylayer, route, hint, track].forEach(n => container.appendChild(n));

  // segment scenes
  SEGMENTS.forEach(s => {
    const scene = el('div', 'sw-scene'); scene.style.setProperty('--sw-accent', s.accent || '');
    const img = el('img', 'sw-scene__still'); img.alt = ''; img.decoding = 'async'; img.loading = 'lazy';
    const poster = (isMobile() && s.stillM) ? s.stillM : s.still;
    if (poster) img.src = poster;
    scene.appendChild(img); stage.appendChild(scene);
    s.el = scene; s.img = img; s.video = null; s.hasClip = false;
    s.loading = false; s.ready = false; s.cur = 0; s.target = 0; s.visible = false;
    s.blob = null; s.url = ''; s.seekAt = 0; s.primeOk = false; s.playErr = ''; s.canvas = null;
    s.priming = false; s.stuckN = 0; s.rebuilt = false;
  });

  // per-section copy / route / nav
  const copies = [], dots = [];
  SECTIONS.forEach((s, i) => {
    const c = el('article', 'sw-copy'); c.style.setProperty('--sw-accent', s.accent || '');
    c.innerHTML =
      `<span class="sw-copy__num">${pad(i + 1)} / ${pad(N)}</span>` +
      (s.eyebrow ? `<span class="sw-copy__eyebrow">${esc(s.eyebrow)}</span>` : '') +
      (s.title ? `<h2 class="sw-copy__title">${esc(s.title)}</h2>` : '') +
      (s.body ? `<p class="sw-copy__body">${esc(s.body)}</p>` : '') +
      (s.tags && s.tags.length ? `<ul class="sw-copy__tags">${s.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '') +
      (s.cta ? `<div class="sw-copy__cta">${ctaBtns(s.cta)}</div>` : '');
    copylayer.appendChild(c); copies.push(c);

    const dot = el('button', 'sw-route__dot'); dot.style.setProperty('--sw-accent', s.accent || '');
    dot.innerHTML = `<span class="sw-route__label">${esc(s.label || '')}</span><i></i>`;
    dot.addEventListener('click', () => jumpTo(i)); route.appendChild(dot); dots.push(dot);

    if (config.nav !== false) {
      const b = el('button', 'sw-nav__item'); b.textContent = s.label || '';
      b.addEventListener('click', () => jumpTo(i)); nav.appendChild(b);
    }
  });

  // ---- math ----
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  // Per-section dwell: monotone remap of scroll→time so the camera settles mid-scene
  // (where the copy peaks) and moves quicker near the seams. L=0 linear, L=1 full
  // mid-scene pause. f(0)=0, f(1)=1 always, so seam frames are untouched.
  const lingerEase = (x, L) => { L = clamp(L); const c = x - 0.5; return (1 - L) * x + L * (4 * c * c * c + 0.5); };
  let vh = window.innerHeight, stageX = 0, totalW = 0, activeIndex = -1, ticking = false;
  let laidOutW = window.innerWidth;   // width the current layout was computed at (see onResize)

  function layout() {
    vh = window.innerHeight;
    laidOutW = window.innerWidth;
    stageX = window.innerWidth > 860 ? 4 : 0;
    let off = 0;
    SEGMENTS.forEach(s => { s.start = off * vh; off += s.w; s.end = off * vh; });
    totalW = off;
    track.style.height = (totalW * vh + vh) + 'px';   // +1vh so the last flight completes
    read();
  }

  function jumpTo(i) {
    const seg = SECTIONS[i]._seg;
    window.scrollTo({ top: seg.start + (seg.end - seg.start) * 0.5, behavior: reduce ? 'auto' : 'smooth' });
  }

  function loadClip(s, done) {
    // Under prefers-reduced-motion we never load the clips at all — the stills stay up
    // and simply cross-dissolve as you scroll. No scrubbed video motion, no decode cost.
    if (reduce || s.loading || s.blob || !s.clip) { if (done) done(); return; }
    s.loading = true;
    // Serve the lighter mobile encode on phones when one was provided.
    const url = (isMobile() && s.clipM) ? s.clipM : s.clip;
    fetch(url).then(r => r.ok ? r.blob() : Promise.reject(new Error('404')))
      .then(blob => { s.blob = blob; s.loading = false; read(); })   // read() attaches it if near
      .catch(() => { s.loading = false; })
      .then(() => { if (done) done(); });
  }

  // Fetched bytes (s.blob) and a live <video> are separate lifetimes: bytes are
  // cached for the whole session, but a <video> element owns a decoder pipeline,
  // and iOS grants only a handful of those per page. attachVideo/detachVideo let
  // read() keep just the scenes near the camera live; a detached scene falls back
  // to its still and re-attaches instantly from the cached blob on the way back.
  function attachVideo(s) {
    if (s.video || !s.blob || reduce) return;
    const v = document.createElement('video');
    v.className = 'sw-scene__video';
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    s.url = URL.createObjectURL(s.blob);
    v.src = s.url;
    v.addEventListener('loadedmetadata', () => { s.ready = true; read(); });
    // Reveal the video (hide the still poster) only once a real frame has
    // PAINTED. requestVideoFrameCallback is the primary signal; but WebKit may
    // never present frames for a scene that is still at opacity:0, so ALSO
    // reveal on a completed seek once the clip has proven it can play
    // (primeOk). Without that proof a seeked event can lie on iOS
    // (seeked-but-black), so the gate stays for unproven clips.
    const reveal = () => s.el.classList.add('has-clip');
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(reveal);
    v.addEventListener('seeked', () => { s.stuckN = 0; s.rebuilt = false; if (s.primeOk || !v.requestVideoFrameCallback) reveal(); });
    // No unconditional pause here: pausing while a gesture-triggered play() is
    // still starting aborts it (AbortError) and can wedge the element with no
    // decoded frame. The element never autoplays, so there is nothing to pause.
    v.addEventListener('loadeddata', () => { if (userReady) primeVideo(s); });
    // Phones render through a canvas painted from the decoded frame on every
    // completed seek: iOS under Low Power Mode / strict autoplay refuses play()
    // outside a touch and then a <video> element never paints at all — but
    // SEEKING is never permission-gated and drawImage always works on a decoded
    // frame. play() (priming) remains a nice-to-have accelerator, not a gate.
    if (isMobile()) {
      const c = document.createElement('canvas');
      c.className = 'sw-scene__canvas';
      const draw = () => {
        try { c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); reveal(); } catch (e) {}
      };
      v.addEventListener('loadedmetadata', () => { c.width = v.videoWidth || 960; c.height = v.videoHeight || 540; });
      v.addEventListener('loadeddata', draw);
      v.addEventListener('seeked', draw);
      s.el.appendChild(c); s.canvas = c;
    }
    s.el.appendChild(v); s.video = v; s.hasClip = true; s.seekAt = 0;
    if (userReady) primeVideo(s);   // don't wait for loadeddata — LPM never fires it unprimed
  }

  function detachVideo(s) {
    const v = s.video; if (!v) return;
    try { v.pause(); } catch (e) {}
    v.removeAttribute('src'); try { v.load(); } catch (e) {}   // release the decoder now
    v.remove();
    if (s.canvas) { s.canvas.remove(); s.canvas = null; }
    if (s.url) { URL.revokeObjectURL(s.url); s.url = ''; }
    s.video = null; s.ready = false; s.hasClip = false; s.seekAt = 0;
    s.primeOk = false; s.playErr = ''; s.priming = false; s.stuckN = 0; s.rebuilt = false;
    s.el.classList.remove('has-clip');   // the still becomes the scene again
  }

  function read() {
    const y = window.scrollY || window.pageYOffset;
    const fade = CROSSFADE * vh;
    let ci = 0;
    for (let i = 0; i < NSEG; i++) if (y >= SEGMENTS[i].start) ci = i;

    // Bytes are fetched well ahead; live <video>s are a scarcer resource. On
    // phones only the scenes near the camera keep one (attach ≤1.1vh away,
    // detach with hysteresis beyond 2.2vh) — iOS allows so few concurrent
    // decoder pipelines that keeping every scene attached ends with only the
    // first clip ever painting. Desktop keeps them all, as before.
    const mob = isMobile();
    // Fetch-ahead is generous on phones (a clip is only usable once its blob has
    // FULLY downloaded; the background warmer below usually beats this anyway).
    // Attach-ahead must buy the iOS pipeline (attach → allowed to play → first
    // frame painted) 1-2 SECONDS of lead at normal flick speed — 0.9vh was only
    // ~0.5s and every scene arrived before its video was ready. 2.0vh ≈ a full
    // scene of lead; detach hysteresis sits above it so the live set stays ~4-5.
    const fetchAhead = (mob ? 2.5 : 1.6) * vh;
    const attachAhead = (mob ? 2.0 : 1.6) * vh;
    const dropBeyond = 2.8 * vh;

    for (let i = 0; i < NSEG; i++) {
      const s = SEGMENTS[i];
      if (y > s.start - fetchAhead && y < s.end + fetchAhead) loadClip(s);
      if (y > s.start - attachAhead && y < s.end + attachAhead) attachVideo(s);
      else if (mob && s.video && (y < s.start - dropBeyond || y > s.end + dropBeyond)) detachVideo(s);
      const local = clamp((y - s.start) / (s.end - s.start), 0, 1);
      s.target = s.linger ? lingerEase(local, s.linger) : local;
      let outside = 0;
      if (y < s.start) outside = s.start - y; else if (y > s.end) outside = y - s.end;
      const op = smooth(1 - outside / fade);
      s.el.style.opacity = op; s.visible = op > 0.001;
      s.el.style.zIndex = (i === ci) ? '120' : String(100 + Math.round(op * 10));
      if (!s.hasClip || !s.ready) {
        const sc = reduce ? 1 : 1.03 + local * 0.14;
        s.img.style.transform = `translateX(${stageX - 2}vw) scale(${sc.toFixed(3)})`;
      }
    }

    for (let i = 0; i < N; i++) {
      const seg = SECTIONS[i]._seg;
      const pr = clamp((y - seg.start) / (seg.end - seg.start), 0, 1);
      const before = y < seg.start, after = y > seg.end;
      let cop;
      if (i === 0) cop = after ? 0 : smooth(1 - pr / 0.62);            // greets on landing
      else if (i === N - 1) cop = before ? 0 : smooth(pr / 0.4);       // holds CTA at the end
      else cop = (before || after) ? 0 : smooth(1 - Math.abs(pr - 0.5) / 0.5);
      const c = copies[i];
      c.style.opacity = cop;
      c.style.transform = reduce ? 'none' : `translateY(${(0.5 - pr) * 4}vh)`;
      // The CTA card holds cop=1 forever after the flight; once the camera has
      // left the world entirely, its invisible fixed card must not keep
      // swallowing clicks over the page content that scrolls in below.
      const leftWorld = y > totalW * vh + vh * 0.6;
      c.style.pointerEvents = cop > 0.5 && !leftWorld ? 'auto' : 'none';
    }

    const cur = SEGMENTS[ci];
    const near = clamp(cur.kind === 'dive' ? cur.si
      : (((y - cur.start) / (cur.end - cur.start)) > 0.5 ? cur.si + 1 : cur.si), 0, N - 1);
    if (near !== activeIndex) {
      activeIndex = near;
      dots.forEach((d, k) => d.classList.toggle('is-active', k === near));
      nav.querySelectorAll('.sw-nav__item').forEach((n, k) => n.classList.toggle('is-active', k === near));
      container.style.setProperty('--sw-accent', SECTIONS[near].accent || '');
    }
    scrollbarFill.style.transform = `scaleX(${clamp(y / (totalW * vh))})`;
    hint.style.opacity = clamp(1 - y / (0.5 * vh));
    if (particles) particles.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`;
    ticking = false;
  }

  function raf(now) {
    const mob = isMobile();
    const eps = mob ? 0.02 : 0.008;   // coarser seek step on phones = fewer decodes
    for (let i = 0; i < NSEG; i++) {
      const s = SEGMENTS[i];
      if (!s.hasClip || !s.ready || !s.video) continue;
      // Phones: an attached-but-invisible scene must not compete for the decoder.
      // After a pass-through its clock would keep lerping and issuing background
      // seeks; 2-3 of those streams starve the visible scene's scrub on a
      // battery-throttled iPhone. Snap its clock instead — it issues one catch-up
      // seek when it next becomes visible, at opacity≈0 where the jump can't be seen.
      if (mob && !s.visible) { s.cur = s.target; s.seekAt = 0; continue; }
      const dur = s.video.duration || 1;
      // Never queue a seek while the decoder is still resolving the last one.
      // On phones a fast flick would otherwise pile up seeks and freeze the clip;
      // cur keeps lerping, so we snap to the latest target the moment it's free.
      // But a seek can also HANG (iOS reclaiming decoders under pressure) — if
      // one is stuck past 800ms, re-issue it instead of freezing the scene forever.
      if (s.video.seeking) {
        if (!s.seekAt) s.seekAt = now;
        else if (now - s.seekAt > 800) {
          s.seekAt = now;
          // Three straight hung seeks = a wedged media element. Rebuild it from
          // the cached bytes — but at most ONCE per attach cycle, so a device
          // where seeks legitimately crawl can never enter a teardown flicker loop.
          if (++s.stuckN >= 3 && !s.rebuilt) { detachVideo(s); s.rebuilt = true; attachVideo(s); continue; }
          try { s.video.currentTime = clamp(s.target, 0, 0.999) * dur; } catch (e) {}
        }
        continue;
      }
      s.seekAt = 0;
      if (!s.visible && Math.abs(s.cur - s.target) < 0.002) continue;
      s.cur += (s.target - s.cur) * (reduce ? 1 : 0.18);
      const t = clamp(s.cur, 0, 0.999) * dur;
      if (Math.abs(s.video.currentTime - t) > eps) { try { s.video.currentTime = t; } catch (e) {} }
    }
    requestAnimationFrame(raf);
  }

  // iOS needs a user gesture before a muted video will decode/paint reliably — and
  // under Low Power Mode (or strict autoplay settings) a play() OUTSIDE a gesture
  // is rejected outright, so priming only on the FIRST touch left every clip that
  // attached later blank ("only the first video plays"). Instead, EVERY touch or
  // pointer gesture re-primes any attached clip that hasn't painted yet (has-clip
  // is the painted signal); scrolling a story is a stream of touches, so each newly
  // attached scene gets its gesture-context play() within a flick or two.
  let userReady = false;
  function primeVideo(s) {
    const v = s && s.video;
    if (!isMobile() || !v || s.priming || s.primeOk) return;
    // play() must fire IMMEDIATELY, even with zero decoded data: under Low Power
    // Mode iOS will not decode a muted video at all until play() is requested,
    // so gating the play() on loadeddata deadlocks (v41's regression — nothing
    // primed, seeks hung forever). play() itself forces the load; the only
    // pause() happens after it resolves, so there is no abort race.
    s.priming = true;
    try {
      const p = v.play();
      if (p && p.then) p.then(() => { s.priming = false; s.primeOk = true; s.playErr = ''; try { v.pause(); } catch (e) {} })
                        .catch(err => { s.priming = false; s.playErr = (err && err.name) || 'PlayErr'; });
      else s.priming = false;
    } catch (err) { s.priming = false; s.playErr = (err && err.name) || 'PlayErr'; }
  }
  function onGesture() {
    userReady = true;
    SEGMENTS.forEach(s => { if (s.video && !s.primeOk) primeVideo(s); });
  }
  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('touchstart', onGesture, { passive: true });

  // Particles are a per-frame cost we can't afford alongside video scrubbing on a phone.
  seedParticles(particles, reduce || coarse);
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(read); } }, { passive: true });
  // Mobile browsers fire `resize` every time the URL bar slides in/out. Re-running
  // layout() there rebuilds the track height and yanks the scroll position, so on
  // touch we ignore height-only changes and only relayout when the width actually
  // changes (rotation still comes through orientationchange). layout() records the
  // width it laid out at.
  function onResize() {
    if (coarse && window.innerWidth === laidOutW) return;
    layout();
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', layout);
  window.addEventListener('load', layout);
  layout();
  requestAnimationFrame(raf);

  // ---- first-visit loader + byte-cache warmer ------------------------------
  // A deep scene is only scrubbable once its clip has fully downloaded, so on a
  // fresh visit the flight gates behind a themed loader until every clip is
  // buffered (3 parallel streams, scroll order). Skippable after 3s, auto-enters
  // at 30s, and skipped entirely for reduced-motion, mid-page arrivals, and
  // anchor links to other sections — those just warm quietly in the background.
  const hash0 = location.hash || '';
  const wantLoader = config.loader !== false && !reduce &&
    (window.scrollY || 0) < vh * 0.5 &&
    !(hash0.length > 1 && hash0.indexOf('story') < 0 && hash0.indexOf('world') < 0);
  let loaderEl = null, loaderBar = null, loaderPct = null, entered = !wantLoader;
  function enterWorld() {
    if (entered) return; entered = true;
    document.documentElement.classList.remove('sw-noscroll');
    if (loaderEl) {
      const le = loaderEl; loaderEl = null;
      le.classList.add('sw-loader--done'); setTimeout(function () { le.remove(); }, 700);
    }
    read();
  }
  // Gate entry on the FIRST few clips only (the rest keep warming behind the
  // flight): full-set gating cost 100MB+ waits on desktop for no visible gain.
  const GATE = SEGMENTS.filter(s => s.clip).slice(0, 5);
  function loaderTick() {
    if (entered || !loaderEl) return;
    const total = GATE.length || 1;
    const have = GATE.filter(s => s.blob).length;
    loaderBar.style.transform = 'scaleX(' + (have / total) + ')';
    loaderPct.textContent = 'preparing the flight · ' + Math.round(have / total * 100) + '%';
    if (have >= total) enterWorld();
  }
  if (wantLoader) {
    document.documentElement.classList.add('sw-noscroll');
    loaderEl = el('div', 'sw-loader');
    const box = el('div', 'sw-loader__box');
    const mark = el('div', 'sw-loader__mark');
    const name = el('div', 'sw-loader__name'); name.textContent = (config.brand && config.brand.name) || '';
    const barWrap = el('div', 'sw-loader__bar'); loaderBar = el('i'); barWrap.appendChild(loaderBar);
    loaderPct = el('div', 'sw-loader__pct'); loaderPct.textContent = 'preparing the flight · 0%';
    const skip = el('button', 'sw-loader__skip'); skip.textContent = 'skip'; skip.addEventListener('click', enterWorld);
    [mark, name, barWrap, loaderPct, skip].forEach(n => box.appendChild(n));
    loaderEl.appendChild(box); container.appendChild(loaderEl);
    setTimeout(function () { if (loaderEl) loaderEl.classList.add('sw-loader--skippable'); }, 3000);
    setTimeout(enterWorld, 30000);
    // Safety net: loadClip calls from read() also fill blobs — poll the truth.
    const li = setInterval(function () { loaderTick(); if (entered) clearInterval(li); }, 300);
  }
  function warmAll() {
    let idx = 0;
    function worker() {
      while (idx < NSEG) {
        const s = SEGMENTS[idx++];
        if (!s.clip) continue;
        loadClip(s, function () { loaderTick(); worker(); });
        return;
      }
    }
    worker(); worker(); worker();
  }
  if (!reduce) { if (wantLoader) warmAll(); else setTimeout(warmAll, 1500); }

  // ---- helpers ----
  function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function ctaBtns(cta) {
    let h = '';
    if (cta.primary) h += `<a class="sw-btn sw-btn--primary" href="${esc(cta.primary.href || '#')}">${esc(cta.primary.label)}</a>`;
    if (cta.secondary) h += `<a class="sw-btn sw-btn--ghost" href="${esc(cta.secondary.href || '#')}">${esc(cta.secondary.label)}</a>`;
    return h;
  }
}

function seedParticles(host, reduce) {
  if (!host || reduce) return;
  const kinds = ['dot', 'dot', 'ring'];
  const seeds = [7, 23, 41, 58, 71, 88, 12, 34, 52, 66, 83, 95, 18, 29, 47, 63, 77, 91, 5, 38, 55, 69, 82, 97];
  for (let k = 0; k < 20; k++) {
    const s = document.createElement('span');
    s.className = 'sw-pt sw-pt--' + kinds[k % kinds.length];
    s.style.left = seeds[k % seeds.length] + 'vw';
    s.style.top = ((seeds[(k * 3) % seeds.length] * 1.3) % 100) + 'vh';
    s.style.setProperty('--sw-sc', (0.5 + ((seeds[(k * 5) % seeds.length] % 60) / 60) * 1.1).toFixed(2));
    const dur = 14 + (seeds[(k * 7) % seeds.length] % 22);
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (-(seeds[(k * 2) % seeds.length] % dur)) + 's';
    host.appendChild(s);
  }
}

function injectCSS() {
  if (document.getElementById('sw-css')) return;
  const css = `
  .sw-root{--sw-bg:#F5EDE0;--sw-ink:#241d2b;--sw-ink-soft:#6a6072;--sw-accent:#8a7bb5;
    --sw-font-display:ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif;
    --sw-font-body:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif;
    color:var(--sw-ink);font-family:var(--sw-font-body);}
  html,body{margin:0;background:var(--sw-bg,#F5EDE0);overflow-x:hidden;}
  .sw-sky{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:var(--sw-bg);}
  .sw-sky__grad{position:absolute;inset:-10%;background:linear-gradient(178deg,color-mix(in srgb,var(--sw-accent) 12%,var(--sw-bg)) 0%,var(--sw-bg) 55%,color-mix(in srgb,var(--sw-accent) 6%,var(--sw-bg)) 100%);}
  .sw-sky__glow{position:absolute;inset:0;background:radial-gradient(60% 42% at 74% 16%,color-mix(in srgb,var(--sw-accent) 22%,transparent),transparent 70%),radial-gradient(46% 34% at 50% 50%,color-mix(in srgb,#fff 45%,transparent),transparent 70%);}
  .sw-particles{position:absolute;inset:-6% -2%;will-change:transform;}
  .sw-pt{position:absolute;width:13px;height:13px;transform:scale(var(--sw-sc,1));opacity:0;animation:sw-drift linear infinite;}
  .sw-pt::before{content:"";position:absolute;inset:0;border-radius:50%;}
  .sw-pt--dot::before{background:radial-gradient(circle at 34% 30%,color-mix(in srgb,var(--sw-accent) 60%,#000),#000 82%);}
  .sw-pt--ring::before{background:transparent;border:2px solid color-mix(in srgb,var(--sw-accent) 55%,transparent);}
  @keyframes sw-drift{0%{opacity:0;transform:scale(var(--sw-sc)) translate(0,12vh) rotate(0)}12%{opacity:.5}88%{opacity:.45}100%{opacity:0;transform:scale(var(--sw-sc)) translate(4vw,-22vh) rotate(210deg)}}
  .sw-scrollbar{position:fixed;top:0;left:0;right:0;height:3px;z-index:60;background:color-mix(in srgb,var(--sw-accent) 14%,transparent);}
  .sw-scrollbar span{display:block;height:100%;width:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--sw-accent);}
  .sw-topbar{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:clamp(14px,2.4vw,26px) clamp(18px,5vw,64px);}
  .sw-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--sw-ink);}
  .sw-brand__mark{width:24px;height:28px;border-radius:7px 7px 10px 10px;background:linear-gradient(160deg,var(--sw-accent),color-mix(in srgb,var(--sw-accent) 60%,#000));box-shadow:0 6px 14px color-mix(in srgb,var(--sw-accent) 40%,transparent);}
  .sw-brand__name{font-family:var(--sw-font-display);font-weight:700;font-size:1.1rem;}
  .sw-nav{display:flex;gap:4px;padding:5px;background:color-mix(in srgb,#fff 55%,transparent);backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--sw-accent) 16%,transparent);border-radius:999px;}
  .sw-nav__item{font:inherit;font-size:.82rem;color:var(--sw-ink-soft);border:0;background:transparent;cursor:pointer;padding:7px 14px;border-radius:999px;transition:color .25s,background .25s;}
  .sw-nav__item:hover{color:var(--sw-ink);} .sw-nav__item.is-active{color:#fff;background:var(--sw-accent);}
  .sw-topcta{text-decoration:none;font-weight:600;font-size:.9rem;color:#fff;background:var(--sw-ink);padding:10px 20px;border-radius:999px;white-space:nowrap;}
  .sw-stage{position:fixed;inset:0;z-index:10;pointer-events:none;}
  .sw-scene{position:absolute;inset:0;opacity:0;overflow:hidden;will-change:opacity;}
  .sw-scene__video,.sw-scene__canvas,.sw-scene__still{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;}
  .sw-scene__still{will-change:transform;} .sw-scene.has-clip .sw-scene__still{opacity:0;} .sw-scene__video{z-index:1;} .sw-scene__canvas{z-index:2;}
  .sw-copylayer{position:fixed;inset:0;z-index:20;pointer-events:none;}
  .sw-copylayer::before{content:"";position:absolute;inset:0;width:min(58vw,780px);background:linear-gradient(90deg,var(--sw-bg) 0%,color-mix(in srgb,var(--sw-bg) 82%,transparent) 34%,color-mix(in srgb,var(--sw-bg) 40%,transparent) 62%,transparent 100%);}
  .sw-copy{position:absolute;left:clamp(18px,5vw,64px);top:50%;transform:translateY(-50%);width:min(42vw,460px);opacity:0;will-change:opacity,transform;}
  .sw-copy__num{font-family:ui-monospace,Menlo,monospace;font-size:.74rem;letter-spacing:.12em;color:var(--sw-ink-soft);}
  .sw-copy__eyebrow{display:block;margin-top:18px;font-family:var(--sw-font-display);font-weight:700;font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--sw-accent);}
  .sw-copy__title{font-family:var(--sw-font-display);font-weight:700;color:var(--sw-ink);font-size:clamp(2rem,4.4vw,3.5rem);line-height:1.03;margin:12px 0 0;letter-spacing:-.01em;text-shadow:0 2px 20px color-mix(in srgb,var(--sw-bg) 70%,transparent);}
  .sw-copy__body{margin-top:18px;font-size:clamp(1rem,1.25vw,1.14rem);line-height:1.55;color:color-mix(in srgb,var(--sw-ink) 78%,var(--sw-ink-soft));max-width:40ch;text-shadow:0 1px 12px color-mix(in srgb,var(--sw-bg) 90%,transparent);}
  .sw-copy__tags{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0;padding:0;}
  .sw-copy__tags li{font-size:.82rem;font-weight:600;color:color-mix(in srgb,var(--sw-accent) 70%,#000);padding:7px 14px;border-radius:999px;background:color-mix(in srgb,var(--sw-accent) 14%,#fff);border:1px solid color-mix(in srgb,var(--sw-accent) 30%,transparent);}
  .sw-copy__cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;pointer-events:auto;}
  .sw-btn{text-decoration:none;font-weight:600;font-size:.95rem;padding:13px 24px;border-radius:999px;transition:transform .2s;}
  .sw-btn--primary{color:#fff;background:var(--sw-ink);} .sw-btn--primary:hover{transform:translateY(-2px);}
  .sw-btn--ghost{color:var(--sw-ink);border:1.5px solid color-mix(in srgb,var(--sw-ink) 25%,transparent);} .sw-btn--ghost:hover{transform:translateY(-2px);}
  .sw-route{position:fixed;right:clamp(14px,2.4vw,30px);top:50%;z-index:40;transform:translateY(-50%);display:flex;flex-direction:column;gap:22px;padding:18px 10px;}
  .sw-route::before{content:"";position:absolute;left:50%;top:22px;bottom:22px;width:2px;transform:translateX(-50%);background:var(--sw-accent);opacity:.28;}
  .sw-route__dot{position:relative;border:0;background:transparent;cursor:pointer;width:14px;height:14px;display:grid;place-items:center;}
  .sw-route__dot i{width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,var(--sw-accent) 40%,transparent);transition:transform .3s,background .3s,box-shadow .3s;}
  .sw-route__dot:hover i{transform:scale(1.25);background:var(--sw-accent);}
  .sw-route__dot.is-active i{background:var(--sw-accent);transform:scale(1.4);box-shadow:0 0 0 5px color-mix(in srgb,var(--sw-accent) 22%,transparent);}
  .sw-route__label{position:absolute;right:24px;top:50%;transform:translateY(-50%) translateX(6px);white-space:nowrap;font-size:.78rem;font-weight:600;color:var(--sw-ink);background:color-mix(in srgb,#fff 85%,transparent);backdrop-filter:blur(6px);padding:5px 11px;border-radius:999px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;border:1px solid color-mix(in srgb,var(--sw-accent) 14%,transparent);}
  .sw-route__dot:hover .sw-route__label,.sw-route__dot.is-active .sw-route__label{opacity:1;transform:translateY(-50%) translateX(0);}
  .sw-hint{position:fixed;left:50%;bottom:26px;z-index:30;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;color:var(--sw-ink-soft);transition:opacity .3s;}
  .sw-hint i{width:22px;height:34px;border-radius:12px;border:2px solid color-mix(in srgb,var(--sw-ink) 28%,transparent);position:relative;}
  .sw-hint i::after{content:"";position:absolute;left:50%;top:7px;width:4px;height:7px;border-radius:2px;background:var(--sw-accent);transform:translateX(-50%);animation:sw-wheel 1.7s ease-in-out infinite;}
  @keyframes sw-wheel{0%{opacity:0;top:6px}40%{opacity:1}100%{opacity:0;top:17px}}
  .sw-track{position:relative;z-index:1;width:100%;pointer-events:none;}
  .sw-loader{position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:var(--sw-bg);opacity:1;transition:opacity .65s ease;}
  .sw-loader--done{opacity:0;pointer-events:none;}
  .sw-loader__box{display:flex;flex-direction:column;align-items:center;gap:18px;width:min(72vw,340px);}
  .sw-loader__mark{width:34px;height:40px;border-radius:9px 9px 13px 13px;background:linear-gradient(160deg,var(--sw-accent),color-mix(in srgb,var(--sw-accent) 55%,#000));box-shadow:0 8px 22px color-mix(in srgb,var(--sw-accent) 40%,transparent);animation:sw-loaderpulse 1.6s ease-in-out infinite;}
  .sw-loader__name{font-family:var(--sw-font-display);font-weight:700;font-size:1.05rem;color:var(--sw-ink);}
  .sw-loader__bar{width:100%;height:3px;border-radius:2px;background:color-mix(in srgb,var(--sw-accent) 18%,transparent);overflow:hidden;}
  .sw-loader__bar i{display:block;height:100%;background:var(--sw-accent);transform-origin:0 50%;transform:scaleX(0);transition:transform .3s ease;}
  .sw-loader__pct{font-family:ui-monospace,Menlo,monospace;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--sw-ink-soft);}
  .sw-loader__skip{font:inherit;font-size:.8rem;color:var(--sw-ink-soft);background:transparent;border:1px solid color-mix(in srgb,var(--sw-ink) 22%,transparent);border-radius:999px;padding:7px 18px;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .4s;}
  .sw-loader--skippable .sw-loader__skip{opacity:.85;pointer-events:auto;}
  @keyframes sw-loaderpulse{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(-6px);opacity:.75}}
  .sw-noscroll,.sw-noscroll body{overflow:hidden!important;}
  @media (max-width:860px){
    .sw-nav{display:none;}
    .sw-copylayer::before{width:100%;height:60%;top:auto;bottom:0;background:linear-gradient(0deg,var(--sw-bg) 8%,color-mix(in srgb,var(--sw-bg) 70%,transparent) 46%,transparent 100%);}
    /* Anchor copy to the bottom, clear of the home indicator / collapsing URL bar.
       dvh + env() are progressive: browsers that lack them keep the vh fallback line. */
    .sw-copy{left:clamp(18px,5vw,64px);right:clamp(18px,5vw,64px);top:auto;bottom:clamp(64px,14vh,120px);transform:none;width:auto;max-width:560px;}
    .sw-copy{bottom:calc(clamp(56px,12dvh,110px) + env(safe-area-inset-bottom));}
    .sw-copy__title{font-size:clamp(1.9rem,7.5vw,2.7rem);}
    .sw-copy__body{max-width:none;font-size:clamp(.98rem,3.6vw,1.1rem);} .sw-scene__video,.sw-scene__canvas,.sw-scene__still{object-position:center 46%;}
    .sw-hint{bottom:calc(20px + env(safe-area-inset-bottom));}
    .sw-route{gap:16px;right:6px;} .sw-route__label{display:none;}
  }
  /* Portrait phones crop a 16:9 clip hard; keep the framing centred so the focal
     subject (which the camera dives toward) stays in view. */
  @media (max-width:860px) and (orientation:portrait){
    .sw-scene__video,.sw-scene__canvas,.sw-scene__still{object-position:center 44%;}
  }
  /* Touch: give the route dots a finger-sized hit area without growing the visible dot. */
  @media (hover:none) and (pointer:coarse){
    .sw-route{padding:14px 6px;}
    .sw-route__dot{width:28px;height:28px;}
    .sw-btn{padding:15px 26px;}
  }
  @media (prefers-reduced-motion:reduce){ .sw-hint i::after{animation:none;} .sw-pt{display:none;} }
  `;
  // Wrap in a cascade layer so the page's own theme tokens (unlayered
  // :root / .sw-root { --sw-bg / --sw-ink / --sw-accent … }) always win over
  // these defaults, regardless of injection order. Enables clean dark themes.
  const style = document.createElement('style'); style.id = 'sw-css';
  style.textContent = '@layer sw {\n' + css + '\n}';
  document.head.appendChild(style);
}

// Expose for module + global use.
if (typeof module !== 'undefined' && module.exports) module.exports = { mountScrollWorld };
if (typeof window !== 'undefined') window.mountScrollWorld = mountScrollWorld;
