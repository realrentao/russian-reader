// Russian Reader — audio player
(function () {
  const MANIFEST = (window.AUDIO_MANIFEST || {});
  let audio = null;
  let currentEl = null;
  let queue = [];
  let qIndex = 0;

  function ensureAudio() {
    if (!audio) {
      audio = new Audio();
      audio.preload = "auto";
      audio.addEventListener("ended", function () {
        clearPlaying();
        playNextInQueue();
      });
      audio.addEventListener("error", function () {
        clearPlaying();
        console.warn("audio error", audio.src);
      });
    }
    return audio;
  }

  function clearPlaying() {
    if (currentEl) currentEl.classList.remove("playing");
    currentEl = null;
  }

  function setPlaying(el) {
    clearPlaying();
    if (el) el.classList.add("playing");
    currentEl = el;
  }

  function playId(id, el) {
    const path = MANIFEST[id];
    if (!path) { console.warn("no audio for", id); return; }
    const a = ensureAudio();
    if (a.src !== location.origin + "/" + path && a.src.indexOf(path) === -1) {
      a.src = path;
    }
    setPlaying(el || null);
    a.play().catch(function (e) { console.warn("play failed", e); });
  }

  // sequential playback of a list of {id, el}
  function playSequence(items) {
    queue = items.filter(function (it) { return MANIFEST[it.id]; });
    qIndex = 0;
    playNextInQueue();
  }

  function playNextInQueue() {
    if (qIndex >= queue.length) { queue = []; return; }
    const it = queue[qIndex++];
    const a = ensureAudio();
    a.src = MANIFEST[it.id];
    setPlaying(it.el || null);
    if (it.el) it.el.scrollIntoView({ behavior: "smooth", block: "center" });
    a.play().catch(function (e) { console.warn("play failed", e); playNextInQueue(); });
  }

  // wire up: any element with data-audio plays on click
  document.addEventListener("click", function (e) {
    const t = e.target.closest("[data-audio]");
    if (t) {
      e.preventDefault();
      playId(t.getAttribute("data-audio"), t.closest(".srow"));
      return;
    }
    const seq = e.target.closest("[data-seq]");
    if (seq) {
      e.preventDefault();
      const scope = seq.closest(".reading") || document;
      const rows = Array.prototype.slice.call(scope.querySelectorAll(".srow[data-audio]"));
      const items = rows.map(function (r) {
        return { id: r.getAttribute("data-audio"), el: r };
      });
      playSequence(items);
    }
  });

  window.RUPlayer = { playId: playId, playSequence: playSequence };
})();
