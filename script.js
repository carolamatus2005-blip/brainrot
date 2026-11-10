/* ==========================================================
   TENDENCIAS JUVENILES · script.js
   1) Reproductor de video brainrot
   2) Comparador Antes / Después
   3) Mini juego "six seven" + confeti
   ========================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------------------------------------------------
     CONFETI (canvas)
     --------------------------------------------------------- */
  var fx = $("fx");
  var ctx = fx.getContext("2d");
  var particles = [];
  var fxRunning = false;
  var COLORS = ["#EC253F", "#FFDF20", "#C20F3F", "#ffffff", "#17060a"];

  function resizeFx() {
    var dpr = window.devicePixelRatio || 1;
    fx.width = window.innerWidth * dpr;
    fx.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeFx();
  window.addEventListener("resize", resizeFx);

  function confetti(x, y, amount) {
    if (reduceMotion) return;
    amount = amount || 40;
    for (var i = 0; i < amount; i++) {
      var a = Math.random() * Math.PI * 2;
      var s = 4 + Math.random() * 9;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 6,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 70 + Math.random() * 40
      });
    }
    if (!fxRunning) { fxRunning = true; requestAnimationFrame(tickFx); }
  }

  function tickFx() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vy += 0.35; p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (particles.length) requestAnimationFrame(tickFx);
    else { fxRunning = false; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }

  function centerOf(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* ---------------------------------------------------------
     1) REPRODUCTOR
     --------------------------------------------------------- */
  var player = $("player");
  var video = $("video");
  var welcome = $("welcome");
  var caption = $("caption");
  var errorBox = $("error");
  var playBtn = $("play");
  var muteBtn = $("mute");
  var speedBtn = $("speed");
  var fullBtn = $("full");
  var vol = $("vol");
  var progress = $("progress");
  var fill = $("progressFill");
  var knob = $("progressKnob");
  var timeEl = $("time");

  var WORDS = ["SIX SEVEN", "67!!!", "BRAINROT 🧠", "COCARDO", "CALAMARDO HERMOSO ✨", "FRUTINOVELA 🍓", "¡BIENVENIDO!"];
  var wordIdx = 0;
  var wordTimer = null;
  var speeds = [1, 1.5, 2, 0.5];
  var speedIdx = 0;

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function flashCaption(text) {
    caption.textContent = text;
    caption.classList.remove("is-on");
    void caption.offsetWidth; // reinicia la animación
    caption.classList.add("is-on");
    setTimeout(function () { caption.classList.remove("is-on"); }, 2200);
  }

  function startCaptions() {
    stopCaptions();
    wordTimer = setInterval(function () {
      flashCaption(WORDS[wordIdx++ % WORDS.length]);
    }, 4200);
  }
  function stopCaptions() { clearInterval(wordTimer); wordTimer = null; }

  function syncPlay() {
    var playing = !video.paused;
    playBtn.textContent = playing ? "⏸" : "▶";
    playBtn.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    if (playing) startCaptions(); else stopCaptions();
  }

  function syncMute() {
    var muted = video.muted || video.volume === 0;
    muteBtn.textContent = muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar");
  }

  function togglePlay() {
    if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    else video.pause();
  }

  function enter(withSound) {
    welcome.classList.add("is-hidden");
    video.currentTime = 0;
    video.muted = !withSound;
    if (withSound) { video.volume = parseFloat(vol.value) || 1; }
    var p = video.play();
    if (p && p.catch) p.catch(function () {
      // Si el navegador bloquea el sonido, reintentamos en silencio
      video.muted = true; syncMute(); video.play().catch(function () {});
    });
    syncMute();
    flashCaption("¡BIENVENIDO!");
    var c = centerOf(player);
    confetti(c.x, c.y, 80);
  }

  $("enter").addEventListener("click", function () { enter(true); });
  $("enterMuted").addEventListener("click", function () { enter(false); });
  $("tap").addEventListener("click", togglePlay);
  playBtn.addEventListener("click", togglePlay);

  muteBtn.addEventListener("click", function () {
    if (video.muted || video.volume === 0) {
      video.muted = false;
      if (video.volume === 0) video.volume = 0.6;
      vol.value = video.volume;
    } else {
      video.muted = true;
    }
    syncMute();
  });

  vol.addEventListener("input", function () {
    video.volume = parseFloat(vol.value);
    video.muted = video.volume === 0;
    syncMute();
  });

  speedBtn.addEventListener("click", function () {
    speedIdx = (speedIdx + 1) % speeds.length;
    video.playbackRate = speeds[speedIdx];
    speedBtn.textContent = speeds[speedIdx] + "x";
  });

  fullBtn.addEventListener("click", function () {
    var el = player;
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iOS
  });

  // Progreso
  function updateProgress() {
    var d = video.duration;
    var pct = d ? (video.currentTime / d) * 100 : 0;
    fill.style.width = pct + "%";
    knob.style.left = pct + "%";
    progress.setAttribute("aria-valuenow", Math.round(pct));
    timeEl.textContent = fmt(video.currentTime) + " / " + fmt(d);
  }
  video.addEventListener("timeupdate", updateProgress);
  video.addEventListener("loadedmetadata", updateProgress);
  video.addEventListener("play", syncPlay);
  video.addEventListener("pause", syncPlay);
  video.addEventListener("volumechange", syncMute);
  video.addEventListener("error", function () { errorBox.hidden = false; });

  function seekFromEvent(e) {
    var r = progress.getBoundingClientRect();
    var pct = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (video.duration) video.currentTime = pct * video.duration;
  }
  var seeking = false;
  progress.addEventListener("pointerdown", function (e) {
    seeking = true; progress.setPointerCapture(e.pointerId); seekFromEvent(e);
  });
  progress.addEventListener("pointermove", function (e) { if (seeking) seekFromEvent(e); });
  progress.addEventListener("pointerup", function () { seeking = false; });
  progress.addEventListener("pointercancel", function () { seeking = false; });
  progress.addEventListener("keydown", function (e) {
    if (!video.duration) return;
    if (e.key === "ArrowRight") { video.currentTime = Math.min(video.duration, video.currentTime + 5); e.preventDefault(); }
    if (e.key === "ArrowLeft")  { video.currentTime = Math.max(0, video.currentTime - 5); e.preventDefault(); }
  });

  // Intento de reproducción silenciosa de fondo mientras se muestra la bienvenida
  var bg = video.play();
  if (bg && bg.catch) bg.catch(function () {});
  syncPlay(); syncMute(); updateProgress();

  /* ---------------------------------------------------------
     2) COMPARADOR ANTES / DESPUÉS
     --------------------------------------------------------- */
  var compare = $("compare");
  var range = $("compareRange");
  var dragging = false;
  var hintRaf = null;

  function setPos(pct) {
    pct = Math.min(100, Math.max(0, pct));
    compare.style.setProperty("--pos", pct + "%");
    range.value = pct;
  }
  function posFromEvent(e) {
    var r = compare.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  }
  function stopHint() { if (hintRaf) { cancelAnimationFrame(hintRaf); hintRaf = null; } }

  compare.addEventListener("pointerdown", function (e) {
    stopHint();
    dragging = true;
    compare.classList.add("is-dragging");
    compare.setPointerCapture(e.pointerId);
    setPos(posFromEvent(e));
  });
  compare.addEventListener("pointermove", function (e) { if (dragging) setPos(posFromEvent(e)); });
  function endDrag() { dragging = false; compare.classList.remove("is-dragging"); }
  compare.addEventListener("pointerup", endDrag);
  compare.addEventListener("pointercancel", endDrag);
  compare.addEventListener("lostpointercapture", endDrag);

  range.addEventListener("input", function () { stopHint(); setPos(parseFloat(range.value)); });

  // Pequeña animación de pista cuando la sección entra en pantalla
  if (!reduceMotion && "IntersectionObserver" in window) {
    var hinted = false;
    new IntersectionObserver(function (entries, obs) {
      if (hinted || !entries[0].isIntersecting) return;
      hinted = true; obs.disconnect();
      var start = performance.now(), dur = 1800;
      (function step(now) {
        var t = Math.min(1, (now - start) / dur);
        setPos(50 + Math.sin(t * Math.PI * 2) * 22 * (1 - t * 0.3));
        if (t < 1) hintRaf = requestAnimationFrame(step); else setPos(50);
      })(start);
    }, { threshold: 0.6 }).observe(compare);
  }

  /* ---------------------------------------------------------
     3) SIX SEVEN + botones de referencias
     --------------------------------------------------------- */
  var ssBtn = $("sixsevenBtn");
  var ssWord = $("sixsevenWord");
  var ssCount = $("sixsevenCount");
  var ssN = 0;
  var ssWords = ["SIX", "SEVEN"];

  ssBtn.addEventListener("click", function () {
    ssWord.textContent = ssWords[ssN % 2];
    ssN++;
    if (ssN % 2 === 0) ssCount.textContent = ssN / 2;
    ssBtn.classList.add("is-hit");
    setTimeout(function () { ssBtn.classList.remove("is-hit"); }, 120);
    var c = centerOf(ssBtn);
    confetti(c.x, c.y, ssN % 2 === 0 ? 45 : 15);
    if (ssN > 0 && ssN % 14 === 0) flashPage();
  });

  function flashPage() {
    document.body.classList.remove("is-shaking");
    void document.body.offsetWidth;
    document.body.classList.add("is-shaking");
    setTimeout(function () { document.body.classList.remove("is-shaking"); }, 650);
  }

  var shakeBtns = document.querySelectorAll("[data-shake]");
  Array.prototype.forEach.call(shakeBtns, function (b) {
    b.addEventListener("click", function () {
      var card = b.closest(".ref");
      card.classList.remove("is-shaking");
      void card.offsetWidth;
      card.classList.add("is-shaking");
      setTimeout(function () { card.classList.remove("is-shaking"); }, 650);
      var c = centerOf(card);
      confetti(c.x, c.y, 60);
    });
  });
})();
