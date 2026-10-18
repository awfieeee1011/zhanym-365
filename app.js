(function () {
  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------- static text ---------- */
  document.querySelectorAll("[data-intro]").forEach(el => el.textContent = S.intro[el.dataset.intro]);

  /* ---------- typewriter title ---------- */
  (function typewriter() {
    const el = $(".intro-title");
    const first = S.intro.title, second = S.intro.titleAfter || S.intro.title;
    el.setAttribute("aria-label", second);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = second; return; }
    el.innerHTML = '<span class="tw-wrap" aria-hidden="true"><span class="tw-text"></span><span class="tw-caret"></span></span>';
    const out = $(".tw-text", el);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    async function type(str, speed) {
      for (let i = 1; i <= str.length; i++) { out.textContent = str.slice(0, i); await wait(speed + Math.random() * 60); }
    }
    async function erase(speed) {
      for (let i = out.textContent.length; i >= 0; i--) { out.textContent = out.textContent.slice(0, i); await wait(speed); }
    }
    (async () => {
      await wait(700);
      await type(first, 95);
      await wait(1800);
      await erase(45);
      await wait(500);
      await type(second, 95);
      await wait(2600);
      el.classList.add("tw-done"); // caret fades away
    })();
  })();
  document.querySelectorAll("[data-ending]").forEach(el => el.textContent = S.ending[el.dataset.ending]);

  /* ---------- days counter ---------- */
  function updateDays() {
    const days = Math.max(0, Math.floor((Date.now() - new Date(S.since).getTime()) / 86400000));
    document.querySelectorAll(".days").forEach(el => el.textContent = days);
  }
  updateDays();
  setInterval(updateDays, 60000);

  /* ---------- grid videos: only play while on screen ---------- */
  const videoWatcher = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    });
  }, { threshold: 0.25 });

  /* ---------- chapters ---------- */
  const main = $("#chapters");
  const ratios = ["4/5", "3/4", "1/1", "4/5", "2/3", "5/4"];

  S.sections.forEach(sec => {
    const el = document.createElement("section");
    el.className = "chapter";
    el.id = sec.id;
    el.style.setProperty("--accent", sec.accent);

    const head = document.createElement("div");
    head.className = "chapter-head";
    head.innerHTML = `
      <div class="chapter-meta mono reveal">
        <span class="num"></span><span class="rule"></span><span class="when"></span>
      </div>
      <h2 class="place reveal"></h2>
      <div class="chapter-copy reveal"><h3></h3><p></p></div>`;
    $(".num", head).textContent = sec.number;
    $(".when", head).textContent = sec.when;
    $(".place", head).textContent = sec.place;
    $("h3", head).textContent = sec.title;
    $("p", head).textContent = sec.text;
    el.appendChild(head);

    const gallery = document.createElement("div");
    gallery.className = "gallery";
    if (sec.photos && sec.photos.length) {
      sec.photos.forEach(p => {
        const fig = document.createElement("figure");
        fig.className = "photo reveal is-loading";
        // reserve the tile's shape up front, so a soft placeholder shows until the media is ready
        if (p.w && p.h) fig.style.aspectRatio = `${p.w} / ${p.h}`;
        const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(p.src) || /^data:video\//.test(p.src);
        const ready = () => fig.classList.remove("is-loading");
        const showImage = (src, alt) => {
          const img = new Image();
          img.decoding = "async";
          img.alt = ""; // never show a broken-image icon or alt text
          img.setAttribute("aria-label", alt);
          img.addEventListener("load", ready, { once: true });
          img.addEventListener("error", () => { img.remove(); fig.classList.add("is-failed"); }, { once: true });
          img.src = src;
          fig.appendChild(img);
        };
        if (isVideo) {
          // videos play silently in the grid so the song keeps going
          const v = document.createElement("video");
          v.muted = true; v.loop = true; v.playsInline = true;
          v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
          v.preload = "metadata";
          if (p.poster) v.poster = p.poster;
          v.autoplay = true; v.setAttribute("autoplay", "");
          v.addEventListener("loadeddata", ready, { once: true });
          // MP4 first (iPhone/Safari), WebM as a backup for browsers that can't play MP4
          const sources = [[p.src, "video/mp4"]];
          if (p.webm) sources.push([p.webm, "video/webm"]);
          sources.forEach(([src, type]) => {
            const s = document.createElement("source");
            s.src = src; s.type = type;
            v.appendChild(s);
          });
          // only if every source fails: show the still frame instead of a broken player
          v.lastElementChild.addEventListener("error", () => {
            videoWatcher.unobserve(v);
            v.remove();
            fig.classList.remove("is-video");
            if (p.poster) showImage(p.poster, sec.place); else fig.classList.add("is-failed");
          }, { once: true });
          fig.classList.add("is-video");
          fig.appendChild(v);
          videoWatcher.observe(v);
        } else {
          showImage(p.src, p.caption || sec.place);
        }
        if (p.caption) {
          const cap = document.createElement("figcaption");
          cap.textContent = p.caption;
          fig.appendChild(cap);
        }
        fig.addEventListener("click", () => {
          if (fig.classList.contains("is-failed")) return;
          const stillVideo = !!fig.querySelector("video");
          openLightbox(stillVideo ? (fig.querySelector("video").currentSrc || p.src) : (isVideo ? p.poster : p.src), p.caption || "", stillVideo);
        });
        gallery.appendChild(fig);
      });
    } else {
      for (let i = 0; i < 6; i++) {
        const ph = document.createElement("div");
        ph.className = "photo placeholder reveal mono";
        ph.style.setProperty("--ratio", ratios[i]);
        ph.textContent = "photo / video";
        gallery.appendChild(ph);
      }
    }
    // Lay tiles out in real flex columns (iPhone Safari mis-sizes CSS multi-column
    // layouts and lets tiles spill over the next section).
    const tiles = [...gallery.children];
    function layout() {
      const n = innerWidth >= 900 ? 3 : 2;
      if (gallery.dataset.cols == n) return;
      gallery.dataset.cols = n;
      gallery.innerHTML = "";
      const cols = [], heights = [];
      for (let i = 0; i < n; i++) {
        const c = document.createElement("div"); c.className = "gcol";
        gallery.appendChild(c); cols.push(c); heights.push(0);
      }
      tiles.forEach(t => {
        const ar = t.style.aspectRatio ? t.style.aspectRatio.split("/").map(Number) : [4, 5];
        const h = ar[1] / ar[0];
        const k = heights.indexOf(Math.min(...heights));
        cols[k].appendChild(t); heights[k] += h;
      });
    }
    layout();
    addEventListener("resize", layout);
    el.appendChild(gallery);
    main.appendChild(el);
  });

  /* ---------- letter: typed ahead of the reader ---------- */
  (function letter() {
    const L = S.letter;
    const sec = $("#letter");
    if (!L || !L.paragraphs || !L.paragraphs.length) { if (sec) sec.remove(); return; }
    document.querySelectorAll("[data-letter]").forEach(el => el.textContent = L[el.dataset.letter] || "");
    const body = $("#letter-body");
    const sentences = [];   // { el, t, u, text }
    L.paragraphs.forEach(par => {
      const p = document.createElement("p");
      (par.match(/[^.!?]+[.!?]+["'”’)]*\s*|[^.!?]+$/g) || [par]).forEach(s => {
        const span = document.createElement("span");
        const t = document.createElement("span"); t.className = "t";
        const u = document.createElement("span"); u.className = "u"; u.textContent = s;
        span.append(t, u);
        p.appendChild(span);
        sentences.push({ el: span, t, u, text: s, chars: Array.from(s) });
      });
      body.appendChild(p);
    });
    const caret = document.createElement("span"); caret.className = "letter-caret";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sentences.forEach(s => { s.t.textContent = s.text; s.u.textContent = ""; });
      sec.classList.add("done"); return;
    }
    const AHEAD = 2;        // sentences typed beyond the one she is reading
    let cur = 0, pos = 0;   // typing position: sentence index, char index
    let target = -1;        // last sentence that should be fully typed
    function readingIndex() {
      const line = innerHeight * 0.45;
      if (sec.getBoundingClientRect().top > innerHeight * 0.85) return null; // not reached yet
      let idx = -1;
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].el.getBoundingClientRect().top < line) idx = i; else break;
      }
      return idx;
    }
    function updateTarget() {
      const r = readingIndex();
      if (r === null) return;
      target = Math.max(target, Math.min(sentences.length - 1, r + AHEAD));
    }
    addEventListener("scroll", updateTarget, { passive: true });
    addEventListener("resize", updateTarget);
    setInterval(() => {
      if (cur >= sentences.length) return;
      if (cur > target) { caret.remove(); return; }
      const behind = target - cur;
      const step = behind > 6 ? 14 : behind > 2 ? 4 : behind > 0 ? 2 : 1;  // catch up if she scrolls fast
      const s = sentences[cur];
      pos = Math.min(s.chars.length, pos + step);   // by character, so emoji never split
      s.t.textContent = s.chars.slice(0, pos).join("");
      s.u.textContent = s.chars.slice(pos).join("");
      s.t.after(caret);
      if (pos >= s.chars.length) {
        cur++; pos = 0;
        if (cur >= sentences.length) { caret.remove(); sec.classList.add("done"); }
      }
    }, 38);
  })();

  /* ---------- reveal on scroll ---------- */
  const revealer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); revealer.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(el => revealer.observe(el));

  /* ---------- lightbox ---------- */
  const lb = $("#lightbox");
  const lbImg = $("img", lb);
  const lbVid = $("video", lb);
  function openLightbox(src, caption, isVideo) {
    lbImg.hidden = isVideo;
    lbVid.hidden = !isVideo;
    if (isVideo) {
      lbVid.loop = true;
      lbVid.src = src;
      lbVid.muted = true;
      lbVid.play().catch(() => {});
    } else {
      lbImg.src = src;
    }
    $("figcaption", lb).textContent = caption;
    lb.hidden = false;
  }
  function closeLightbox() {
    lb.hidden = true;
    lbVid.pause();
    lbVid.removeAttribute("src");
    lbVid.load();
  }
  lbVid.addEventListener("click", e => e.stopPropagation()); // let her use the controls
  lb.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

  /* =========================================================
     MUSIC
     One <audio> element for everything (so phones only need
     one tap to unlock it). Each section remembers where its
     song was, so scrolling back resumes instead of restarting.
     ========================================================= */
  const audio = new Audio();
  audio.preload = "auto";
  const player = $("#player");
  const FADE_MS = 1100;
  const MAX_VOL = 0.9;

  let started = false;
  let muted = false;
  let current = null;        // section object currently playing
  let switching = null;      // pending section switch
  let previous = null;       // what was playing before, in case a new song is missing
  // the hero counts as a "section" for music too
  const hero = { id: "intro", accent: S.intro.accent || "#c99a63", songs: S.intro.songs || [] };
  // the letter can have its own song too
  const letterSec = S.letter && S.letter.songs ? { id: "letter", accent: S.letter.accent || "#b06a3b", songs: S.letter.songs } : null;
  const all = [hero, ...S.sections, ...(letterSec ? [letterSec] : [])];
  let visible = hero;        // section on screen right now
  const state = {};          // per section: { idx, time, broken: Set }
  all.forEach(s => state[s.id] = { idx: 0, time: 0, broken: new Set() });

  function playable(sec) {
    return sec && sec.songs && sec.songs.length && state[sec.id].broken.size < sec.songs.length;
  }

  function fadeTo(target, ms) {
    return new Promise(resolve => {
      const from = audio.volume;
      const t0 = performance.now();
      function step(now) {
        const k = Math.min(1, (now - t0) / ms);
        try { audio.volume = from + (target - from) * k; } catch (_) {}
        if (k < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function showTrack(sec) {
    const song = sec.songs[state[sec.id].idx];
    $("#track-title").textContent = song.title || "";
    $("#track-artist").textContent = song.artist || "";
    player.style.setProperty("--accent", sec.accent);
    player.querySelectorAll(".bars i").forEach(i => i.style.background = sec.accent);
    player.hidden = false;
  }

  function loadTrack(sec, resumeAt) {
    const st = state[sec.id];
    let guard = 0;
    while (st.broken.has(st.idx) && guard++ < sec.songs.length) st.idx = (st.idx + 1) % sec.songs.length;
    audio.src = sec.songs[st.idx].file;
    if (resumeAt) {
      audio.addEventListener("loadedmetadata", function seek() {
        try { audio.currentTime = resumeAt; } catch (_) {}
        audio.removeEventListener("loadedmetadata", seek);
      });
    }
    showTrack(sec);
  }

  async function switchTo(sec) {
    if (!started || !playable(sec) || sec === current) return;
    const token = switching = {};
    if (current && !audio.paused) {
      state[current.id].time = audio.currentTime;
      await fadeTo(0, FADE_MS);
      if (switching !== token) return;
      audio.pause();
    }
    if (current) previous = current;
    current = sec;
    loadTrack(sec, state[sec.id].time);
    try { audio.volume = 0; } catch (_) {}
    try { await audio.play(); } catch (_) { /* blocked or missing file */ }
    if (switching !== token) return;
    fadeTo(MAX_VOL, FADE_MS);
  }

  audio.addEventListener("ended", () => {
    if (!current) return;
    const st = state[current.id];
    st.idx = (st.idx + 1) % current.songs.length;
    st.time = 0;
    loadTrack(current, 0);
    audio.play().catch(() => {});
  });

  audio.addEventListener("error", () => {
    if (!current) return;
    const st = state[current.id];
    st.broken.add(st.idx);
    console.warn("Couldn't load", current.songs[st.idx].file);
    if (playable(current)) {
      st.idx = (st.idx + 1) % current.songs.length;
      st.time = 0;
      loadTrack(current, 0);
      audio.play().then(() => fadeTo(MAX_VOL, FADE_MS)).catch(() => {});
    } else {
      // nothing in this chapter can play: go back to the last song instead of silence
      const back = previous && previous !== current && playable(previous) ? previous : null;
      current = null;
      if (back) switchTo(back); else player.hidden = true;
    }
  });

  audio.addEventListener("play", () => player.classList.remove("paused"));
  audio.addEventListener("pause", () => player.classList.add("paused"));

  // Which chapter is mostly on screen?
  const sectionEls = S.sections.map(s => document.getElementById(s.id));
  const watcher = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const sec = all.find(s => s.id === e.target.id);
        // chapters without songs keep whatever is already playing
        if (playable(sec)) { visible = sec; switchTo(sec); }
      }
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  [document.getElementById("intro"), ...sectionEls, document.getElementById("letter")].filter(Boolean).forEach(el => watcher.observe(el));

  /* Start: there's no button. Music starts by itself if the browser allows it,
     otherwise on her first tap/click/key anywhere. From then on, songs crossfade
     purely by scrolling. */
  const hint = $("#sound-hint");
  function begin() {
    if (started) return;
    const sec = playable(visible) ? visible : (previous && playable(previous) ? previous : all.find(playable));
    if (!sec) return;
    current = sec;
    loadTrack(sec, state[sec.id].time);
    try { audio.volume = 0; } catch (_) {}
    audio.play().then(() => {
      started = true;
      hint.classList.add("gone");
      fadeTo(MAX_VOL, FADE_MS);
      // she may have scrolled while we were starting
      if (visible !== current && playable(visible)) switchTo(visible);
    }).catch(() => { current = null; player.hidden = true; });
  }
  begin(); // works where autoplay with sound is allowed
  ["pointerdown", "touchend", "click", "keydown"].forEach(ev =>
    document.addEventListener(ev, begin, { passive: true }));

  $("#mute").addEventListener("click", () => {
    muted = !muted;
    player.classList.toggle("muted", muted);
    audio.muted = muted; // iPhone ignores volume, so use muted too
  });

  // pause when the tab is hidden, resume when back
  document.addEventListener("visibilitychange", () => {
    if (!started || !current) return;
    if (document.hidden) audio.pause(); else audio.play().catch(() => {});
  });
})();
