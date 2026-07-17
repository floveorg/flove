/* ============================================================
   El arte de la fuga — comportamiento
   Todo el contenido vive en el HTML; esto lo anima y lo suena.
   Sin llamadas externas.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- I · construir las voces de cada línea ----------
     Cada obra tiene N voces apiladas, con marcas de entrada del
     sujeto escalonadas. Posiciones deterministas (no aleatorias). */
  function buildLines() {
    var works = document.querySelectorAll(".work");
    works.forEach(function (work) {
      var line = work.querySelector(".work__line");
      var n = parseInt(work.getAttribute("data-voices"), 10) || 3;
      var unfinished = work.classList.contains("work--unfinished");
      for (var v = 0; v < n; v++) {
        var voice = document.createElement("span");
        voice.className = "voice";
        voice.style.top = v * 7 + "px";
        voice.style.setProperty("--i", v);
        // entrada del sujeto: cada voz entra un poco más a la derecha
        var entry = document.createElement("span");
        entry.className = "entry";
        var pos = 6 + v * (unfinished ? 9 : 11); // % desde la izquierda
        entry.style.left = pos + "%";
        entry.style.setProperty("--i", v);
        voice.appendChild(entry);
        line.appendChild(voice);
      }
    });
  }

  /* ---------- aparición al hacer scroll ---------- */
  function observeReveal() {
    var targets = document.querySelectorAll(".work, .case");
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- III · espiral logarítmica ----------
     Los nodos se colocan sobre una espiral; los enlaces "fuera"
     lanzan un rayo hacia afuera: la fuga que abandona la casa. */
  function layoutSpiral() {
    var spiral = document.getElementById("spiral");
    if (!spiral) return;
    var nodes = spiral.querySelectorAll(".node");
    var curve = document.getElementById("spiral-curve");
    var rays = document.getElementById("spiral-rays");
    var cx = 50, cy = 50;
    var turns = 2.4;            // vueltas totales
    var a = 3.2, b = 0.34;      // r = a·e^(b·θ)

    // trazar la curva de fondo
    var d = "", steps = 240;
    for (var s = 0; s <= steps; s++) {
      var tt = s / steps;
      var th = tt * turns * 2 * Math.PI;
      var r = a * Math.exp(b * th);
      var x = cx + r * Math.cos(th);
      var y = cy + r * Math.sin(th);
      d += (s === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    curve.setAttribute("d", d);

    // colocar cada nodo según su data-t (0..1 a lo largo de la espiral)
    nodes.forEach(function (node) {
      var t = parseFloat(node.getAttribute("data-t")) || 0;
      var th = t * turns * 2 * Math.PI;
      var r = a * Math.exp(b * th);
      var x = cx + r * Math.cos(th);
      var y = cy + r * Math.sin(th);
      node.style.left = x + "%";
      node.style.top = y + "%";

      // los nodos "fuera de la música" lanzan un rayo hacia afuera
      if (node.classList.contains("node--field")) {
        var ox = cx + (r + 14) * Math.cos(th);
        var oy = cy + (r + 14) * Math.sin(th);
        var ray = document.createElementNS("http://www.w3.org/2000/svg", "line");
        ray.setAttribute("class", "spiral__ray");
        ray.setAttribute("x1", x); ray.setAttribute("y1", y);
        ray.setAttribute("x2", ox); ray.setAttribute("y2", oy);
        rays.appendChild(ray);
      }
    });
  }

  /* ---------- reproductor ----------
     La playlist "entera" son las seis grabaciones libres, en orden.
     El cabezal baja por las líneas de la Sección I. */
  var audio = document.getElementById("audio");
  var bar = document.getElementById("bar");
  var toggle = document.getElementById("toggle");
  var toggleIcon = document.getElementById("toggle-icon");
  var nextBtn = document.getElementById("next");
  var listen = document.getElementById("listen");
  var progress = document.getElementById("progress");
  var progressFill = document.getElementById("progress-fill");
  var timeEl = document.getElementById("time");
  var nowTitle = document.getElementById("now-title");
  var download = document.getElementById("download");

  var PLAY = "M2 1l8 5-8 5z";
  var PAUSE = "M2 1h3v10H2zM7 1h3v10H7z";

  var tracks = Array.prototype.map.call(
    document.querySelectorAll(".work[data-src]"),
    function (el) {
      var catEl = el.querySelector(".work__cat");
      return {
        el: el,
        src: el.getAttribute("data-src"),
        dur: parseInt(el.getAttribute("data-dur"), 10) || 0,
        title: el.querySelector(".work__title").textContent.trim(),
        cat: catEl ? catEl.textContent.trim() : "",
        unfinished: el.classList.contains("work--unfinished"),
        playhead: el.querySelector(".playhead"),
        bubble: null
      };
    }
  );

  var current = -1;

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2);
  }

  function clearPlaying() {
    tracks.forEach(function (t) {
      t.el.classList.remove("is-playing");
      if (t.bubble) t.bubble.classList.remove("is-playing");
    });
  }

  function load(i, autoplay) {
    if (i < 0 || i >= tracks.length) return;
    current = i;
    var t = tracks[i];
    audio.src = t.src;
    nowTitle.textContent = t.title;
    clearPlaying();
    t.el.classList.add("is-playing");
    if (t.bubble) t.bubble.classList.add("is-playing");
    // el botón de descarga apunta a esta grabación
    if (download) {
      download.setAttribute("href", t.src);
      download.setAttribute("download", t.src.split("/").pop());
    }
    bar.classList.add("is-open");
    if (autoplay) audio.play().catch(function () {});
  }

  function playPause() {
    if (current === -1) { load(0, true); return; }
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  }

  function nextTrack() {
    if (current + 1 < tracks.length) load(current + 1, true);
    else { audio.pause(); audio.currentTime = 0; } // fin de la playlist
  }

  audio.addEventListener("play", function () { toggleIcon.setAttribute("d", PAUSE); });
  audio.addEventListener("pause", function () { toggleIcon.setAttribute("d", PLAY); });
  audio.addEventListener("ended", nextTrack);

  audio.addEventListener("timeupdate", function () {
    var d = audio.duration || (tracks[current] && tracks[current].dur) || 0;
    var pct = d ? audio.currentTime / d : 0;
    progressFill.style.width = (pct * 100) + "%";
    timeEl.textContent = fmt(audio.currentTime);
    var ph = tracks[current] && tracks[current].playhead;
    if (ph) ph.style.left = (pct * 100) + "%";
  });

  toggle.addEventListener("click", playPause);
  nextBtn.addEventListener("click", nextTrack);
  listen.addEventListener("click", function () { load(0, true); });
  var hearPlay = document.getElementById("hearPlay");
  if (hearPlay) hearPlay.addEventListener("click", function () { load(0, true); });

  progress.addEventListener("click", function (e) {
    var rect = progress.getBoundingClientRect();
    var pct = (e.clientX - rect.left) / rect.width;
    var d = audio.duration || (tracks[current] && tracks[current].dur) || 0;
    if (d) audio.currentTime = pct * d;
  });

  // clic en una obra de la Sección I → suena esa
  tracks.forEach(function (t, i) {
    t.el.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      load(i, true);
    });
    t.el.style.cursor = "pointer";
  });

  /* ---------- modo edición: numerar todo para referencia ----------
     No altera la página pública. Se activa con #edit o la tecla "e".
     Cada elemento recibe un data-ref (buscable en el HTML) y una
     insignia visible que solo aparece en modo edición. */
  function numberForEdit() {
    function tag(nodes, prefix) {
      Array.prototype.forEach.call(nodes, function (el, i) {
        var ref = prefix + (i + 1);
        el.setAttribute("data-ref", ref);
        var b = document.createElement("span");
        b.className = "ref-badge";
        b.textContent = ref;
        el.appendChild(b);
      });
    }
    // categorías
    tag(document.querySelectorAll(".movement__head"), "C");
    // I · obras
    tag(document.querySelectorAll("#stave .work"), "1.");
    // ensayo
    tag(document.querySelectorAll(".more"), "E");
    // II · tarjetas de vitrina
    tag(document.querySelectorAll("#vitrine .case"), "2.");
    // III · nodos de la espiral
    tag(document.querySelectorAll("#spiral .node"), "3.");

    function sync() {
      var on = location.hash === "#edit" || document.body.classList.contains("editing");
      document.body.classList.toggle("editing", on);
    }
    window.addEventListener("hashchange", function () {
      document.body.classList.toggle("editing", location.hash === "#edit");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "e" && !/input|textarea/i.test(e.target.tagName)) {
        document.body.classList.toggle("editing");
      }
    });
    if (location.hash === "#edit") document.body.classList.add("editing");
  }

  /* ---------- I · burbujas flotantes con colisiones y chispas ----------
     Cada grabación libre es una voz suelta: sube y baja a su propio paso,
     rebota en las paredes y, al chocar con otra, salta una chispa. */
  function buildBubbles() {
    var field = document.getElementById("songfield");
    var canvas = document.getElementById("sparks");
    if (!field || !canvas || !tracks.length) return;
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeCanvas() {
      W = field.clientWidth; H = field.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var durs = tracks.map(function (t) { return t.dur; });
    var dmin = Math.min.apply(null, durs), dmax = Math.max.apply(null, durs);
    function diam(d) {
      var f = dmax > dmin ? (d - dmin) / (dmax - dmin) : 0.5;
      var base = Math.min(W || 800, 900);
      return (0.08 + f * 0.055) * base; // 4× más pequeñas: sitio de sobra para flotar
    }

    function flash(b) {
      b.el.classList.add("is-hit");
      clearTimeout(b._ht);
      b._ht = setTimeout(function () { b.el.classList.remove("is-hit"); }, 460);
    }

    var bubbles = tracks.map(function (t, i) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "song" + (t.unfinished ? " song--unfinished" : "");
      el.setAttribute("aria-label", "Reproducir " + t.title);
      el.style.setProperty("--d", diam(t.dur) + "px");
      el.innerHTML =
        '<span class="song__title">' + t.el.querySelector(".work__title").innerHTML + "</span>" +
        '<span class="song__cat">' + (t.cat.split("·")[0] || "").trim() + "</span>";
      field.appendChild(el);
      t.bubble = el;
      var b = { el: el, r: diam(t.dur) / 2, pop: 1, i: i };
      // clic: reproduce + destello + latido + empuja a las vecinas + música visual
      el.addEventListener("click", function () {
        load(i, true);
        if (reduce) return;
        flash(b); b.pop = 1.22;
        burst(b.x, b.y, 18, true);
        bubbles.forEach(function (o) {
          if (o === b) return;
          var dx = o.x - b.x, dy = o.y - b.y, dd = Math.hypot(dx, dy) || 1;
          var push = 220 / dd;
          o.vx += (dx / dd) * push; o.vy += (dy / dd) * push;
        });
      });
      return b;
    });

    sizeCanvas();

    // posiciones y velocidades deterministas (mismo campo en cada carga)
    var seed = 20240710;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    bubbles.forEach(function (b) {
      b.x = b.r + rnd() * Math.max(1, W - 2 * b.r);
      b.y = b.r + rnd() * Math.max(1, H - 2 * b.r);
      b.m = b.r * b.r;
      var sp = 32 + rnd() * 80;                 // doble de rápidas
      b.vx = (rnd() - 0.5) * sp;
      b.vy = (rnd() < 0.5 ? -1 : 1) * (sp * 0.7 + rnd() * sp); // sesgo vertical
    });

    // reducir movimiento: rejilla estática, sin física ni chispas
    if (reduce) {
      var cols = Math.max(1, Math.floor(W / 170));
      bubbles.forEach(function (b, i) {
        b.x = ((i % cols) + 0.5) * (W / cols);
        b.y = (Math.floor(i / cols) + 0.6) * 160;
        b.el.style.transform = "translate(" + b.x + "px," + b.y + "px)";
      });
      return;
    }

    var sparks = [], ripples = [], notes = [];
    // solfa moderna: notas, clave, alteraciones
    var GLYPHS = ["♪", "♫", "♩", "♬", "♯", "♭", "♮", "𝄞", "𝄢"];
    var COPPER = "169,82,31", TEAL = "44,110,91"; // acentos oscuros sobre papel claro
    function spark(x, y, n) {
      for (var k = 0; k < n; k++) {
        var a = Math.random() * Math.PI * 2, s = 45 + Math.random() * 110;
        sparks.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: 1, col: Math.random() < 0.5 ? COPPER : TEAL });
      }
    }
    // "música visual": onda que se expande + solfas que suben
    function burst(x, y, n, big) {
      spark(x, y, n);
      ripples.push({ x: x, y: y, r: big ? 10 : 4, life: 1, big: !!big });
      var m = big ? 5 : 3;
      for (var k = 0; k < m; k++) {
        notes.push({ x: x + (Math.random() - 0.5) * 30, y: y,
          vx: (Math.random() - 0.5) * 30, vy: -48 - Math.random() * 54, life: 1,
          rot: (Math.random() - 0.5) * 0.5,
          g: GLYPHS[(Math.random() * GLYPHS.length) | 0],
          col: Math.random() < 0.5 ? COPPER : TEAL });
      }
    }

    var last = 0, raf = 0;
    function frame(ts) {
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;

      bubbles.forEach(function (b) {
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.vx *= 0.995; b.vy *= 0.995;                 // fricción: los empujones se calman
        b.pop += (1 - b.pop) * Math.min(1, dt * 8);   // el latido vuelve a 1
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
        else if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); }
        else if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
      });

      for (var i = 0; i < bubbles.length; i++) {
        for (var j = i + 1; j < bubbles.length; j++) {
          var a = bubbles[i], c = bubbles[j];
          var dx = c.x - a.x, dy = c.y - a.y;
          var dist = Math.hypot(dx, dy), min = a.r + c.r;
          if (dist > 0 && dist < min) {
            var nx = dx / dist, ny = dy / dist, overlap = min - dist, tot = a.m + c.m;
            a.x -= nx * overlap * (c.m / tot); a.y -= ny * overlap * (c.m / tot);
            c.x += nx * overlap * (a.m / tot); c.y += ny * overlap * (a.m / tot);
            var vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
            if (vn < 0) {
              var imp = -1.7 * vn / (1 / a.m + 1 / c.m);
              a.vx -= imp * nx / a.m; a.vy -= imp * ny / a.m;
              c.vx += imp * nx / c.m; c.vy += imp * ny / c.m;
              var strength = Math.min(1, -vn / 260);
              burst(a.x + nx * a.r, a.y + ny * a.r, 8 + (strength * 12 | 0), strength > 0.5);
              flash(a); flash(c);
              a.pop = Math.max(a.pop, 1 + strength * 0.12);
              c.pop = Math.max(c.pop, 1 + strength * 0.12);
            }
          }
        }
      }

      bubbles.forEach(function (b) {
        b.el.style.transform = "translate(" + b.x + "px," + b.y + "px) scale(" + b.pop.toFixed(3) + ")";
      });

      ctx.clearRect(0, 0, W, H);
      for (var q = ripples.length - 1; q >= 0; q--) {
        var rp = ripples[q];
        rp.life -= dt * (rp.big ? 1.1 : 1.6); if (rp.life <= 0) { ripples.splice(q, 1); continue; }
        rp.r += dt * (rp.big ? 210 : 150);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(44,110,91," + (rp.life * 0.55).toFixed(3) + ")";
        ctx.lineWidth = 2 * rp.life + 0.5;
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (var s = sparks.length - 1; s >= 0; s--) {
        var p = sparks[s];
        p.life -= dt * 1.8; if (p.life <= 0) { sparks.splice(s, 1); continue; }
        p.vy += 130 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + p.col + "," + p.life.toFixed(3) + ")";
        ctx.arc(p.x, p.y, 1.9 * p.life + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (var m2 = notes.length - 1; m2 >= 0; m2--) {
        var nt = notes[m2];
        nt.life -= dt * 0.8; if (nt.life <= 0) { notes.splice(m2, 1); continue; }
        nt.x += nt.vx * dt; nt.y += nt.vy * dt; nt.vy += 14 * dt;
        ctx.save();
        ctx.translate(nt.x, nt.y); ctx.rotate(nt.rot * (1 - nt.life));
        ctx.fillStyle = "rgba(" + nt.col + "," + nt.life.toFixed(3) + ")";
        ctx.font = (20 + 12 * nt.life).toFixed(0) + "px 'Junicode', Georgia, serif";
        ctx.fillText(nt.g, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    window.addEventListener("resize", function () {
      var oldW = W || 1, oldH = H || 1; sizeCanvas();
      bubbles.forEach(function (b) {
        b.x = Math.min(Math.max(b.r, b.x * (W / oldW)), W - b.r);
        b.y = Math.min(Math.max(b.r, b.y * (H / oldH)), H - b.r);
      });
    });
  }

  /* ---------- marca Fugy, artículo, «ver más», descargas ---------- */
  function wireUI() {
    var btn = document.getElementById("fugyBtn"), menu = document.getElementById("fugyMenu");
    if (btn && menu) {
      function setMenu(open) { menu.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); }
      btn.addEventListener("click", function (e) { e.stopPropagation(); setMenu(menu.hidden); });
      document.addEventListener("click", function (e) {
        if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) setMenu(false);
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
      Array.prototype.forEach.call(menu.querySelectorAll("a"), function (a) {
        a.addEventListener("click", function () { setMenu(false); });
      });
      var about = document.getElementById("aboutLink");
      if (about) about.addEventListener("click", function () {
        setMenu(false);
        Array.prototype.forEach.call(document.querySelectorAll("#about .more"), function (d) { d.open = true; });
        var target = document.getElementById("about");
        if (target) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    }

    var deep = document.getElementById("deep"), deepMore = document.getElementById("deepMore"),
        deepClose = document.getElementById("deepClose");
    if (deepMore && deep) {
      if (typeof deep.showModal === "function") {
        deepMore.addEventListener("click", function () { deep.showModal(); });
        if (deepClose) deepClose.addEventListener("click", function () { deep.close(); });
        deep.addEventListener("click", function (e) { if (e.target === deep) deep.close(); });
      } else {
        deepMore.addEventListener("click", function () { deep.setAttribute("open", ""); deep.scrollIntoView(); });
        if (deepClose) deepClose.addEventListener("click", function () { deep.removeAttribute("open"); });
      }
    }

    // la lista «ver más» ya no se pliega: siempre visible, en dos columnas

    // reproducir directo desde la lista de descargas (play antes que descargar)
    Array.prototype.forEach.call(document.querySelectorAll(".downloads__play"), function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.getAttribute("data-src");
        for (var k = 0; k < tracks.length; k++) {
          if (tracks[k].src === src) { load(k, true); break; }
        }
      });
    });

    var dlAll = document.getElementById("dlAll");
    if (dlAll) dlAll.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".downloads__btn"), function (a, i) {
        setTimeout(function () {
          var tmp = document.createElement("a");
          tmp.href = a.getAttribute("href"); tmp.download = a.getAttribute("href").split("/").pop();
          document.body.appendChild(tmp); tmp.click(); document.body.removeChild(tmp);
        }, i * 400);
      });
    });
  }

  /* ---------- diagrama de la espiral en el slide de la Sección III ---------- */
  function slideSpiral() {
    var p = document.getElementById("slide-spiral");
    if (!p) return;
    var cx = 120, cy = 60, a = 3.5, b = 0.22, turns = 2.1, d = "";
    for (var s = 0; s <= 200; s++) {
      var th = (s / 200) * turns * 2 * Math.PI, r = a * Math.exp(b * th);
      var x = cx + r * Math.cos(th), y = cy + r * Math.sin(th) * 0.55;
      d += (s === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    p.setAttribute("d", d);
  }

  /* ---------- Hitos: slideshow Bach + 3, pasa solo cada 10 s ---------- */
  function eventsSlider() {
    var stage = document.getElementById("eventsStage");
    var dotsWrap = document.getElementById("eventsDots");
    if (!stage || !dotsWrap) return;
    var slides = Array.prototype.slice.call(stage.querySelectorAll(".event"));
    if (slides.length < 2) return;
    var idx = 0, timer = 0, DELAY = 10000;

    var dots = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Hito " + (i + 1));
      b.addEventListener("click", function () { go(i, true); });
      dotsWrap.appendChild(b);
      return b;
    });

    function render() {
      slides.forEach(function (s, i) { s.classList.toggle("is-current", i === idx); });
      dots.forEach(function (d, i) { d.setAttribute("aria-selected", i === idx ? "true" : "false"); });
    }
    function stop() { if (timer) { clearInterval(timer); timer = 0; } }
    function restart() { stop(); if (!reduce) timer = setInterval(function () { go(idx + 1); }, DELAY); }
    function go(i, manual) {
      idx = (i + slides.length) % slides.length;
      render();
      if (manual) restart();
    }

    var prev = document.getElementById("eventsPrev"), nxt = document.getElementById("eventsNext");
    if (prev) prev.addEventListener("click", function () { go(idx - 1, true); });
    if (nxt) nxt.addEventListener("click", function () { go(idx + 1, true); });

    var root = document.getElementById("events");
    if (root) {
      root.addEventListener("mouseenter", stop);
      root.addEventListener("mouseleave", restart);
      root.addEventListener("focusin", stop);
      root.addEventListener("focusout", restart);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else restart();
    });

    render();
    restart();
  }

  /* ---------- Sección III: slider de vídeo del bucle ---------- */
  function loopSlider() {
    var track = document.getElementById("loopTrack");
    var prev = document.getElementById("loopPrev"), nxt = document.getElementById("loopNext");
    if (!track || !prev || !nxt) return;
    var slides = track.querySelectorAll(".loop__slide");

    function sync() {
      var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      prev.disabled = i <= 0;
      nxt.disabled = i >= slides.length - 1;
    }
    prev.addEventListener("click", function () {
      track.scrollBy({ left: -track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    });
    nxt.addEventListener("click", function () {
      track.scrollBy({ left: track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(sync); });
    window.addEventListener("resize", sync);
    sync();
  }

  /* ---------- arranque ---------- */
  buildLines();
  observeReveal();
  layoutSpiral();
  buildBubbles();
  wireUI();
  slideSpiral();
  eventsSlider();
  loopSlider();
  numberForEdit();
})();
