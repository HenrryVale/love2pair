(() => {
  "use strict";

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const state = {
    active: false,
    ctx: null,
    stream: null,
    analyser: null,
    source: null,
    raf: 0,
    timer: 0,
    ignoreUntil: 0,
    streak: 0,
    triggered: false,
    callbacks: {}
  };

  function emitStatus(text) {
    try { state.callbacks.onStatus?.(text); } catch {}
  }

  function emitLevel(level, peakDb, score) {
    try { state.callbacks.onLevel?.(level, peakDb, score); } catch {}
  }

  function bandMax(data, binHz, fromHz, toHz) {
    const a = Math.max(0, Math.floor(fromHz / binHz));
    const b = Math.min(data.length - 1, Math.ceil(toHz / binHz));
    let max = -120;
    for (let i = a; i <= b; i++) if (data[i] > max) max = data[i];
    return max;
  }

  function bandAverage(data, binHz, fromHz, toHz) {
    const a = Math.max(0, Math.floor(fromHz / binHz));
    const b = Math.min(data.length - 1, Math.ceil(toHz / binHz));
    let sum = 0, count = 0;
    for (let i = a; i <= b; i++) {
      if (Number.isFinite(data[i])) { sum += data[i]; count++; }
    }
    return count ? sum / count : -120;
  }

  function scheduleBeacon() {
    clearTimeout(state.timer);
    if (!state.active || !state.ctx) return;
    const delay = 1050 + Math.random() * 950;
    state.timer = setTimeout(() => {
      if (!state.active || !state.ctx || state.triggered) return;
      const now = state.ctx.currentTime;
      const osc = state.ctx.createOscillator();
      const gain = state.ctx.createGain();

      // Barrido casi ultrasónico. Se usa 16.2–18.4 kHz porque muchos teléfonos
      // filtran agresivamente por encima de 19 kHz.
      osc.type = "sine";
      osc.frequency.setValueAtTime(16200, now);
      osc.frequency.linearRampToValueAtTime(18400, now + 0.18);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.018);
      gain.gain.setValueAtTime(0.12, now + 0.145);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(state.ctx.destination);
      state.ignoreUntil = performance.now() + 430;

      osc.start(now);
      osc.stop(now + 0.19);
      osc.addEventListener("ended", () => {
        try { osc.disconnect(); gain.disconnect(); } catch {}
      }, { once: true });

      scheduleBeacon();
    }, delay);
  }

  function detectLoop() {
    if (!state.active || !state.analyser || !state.ctx) return;
    const data = new Float32Array(state.analyser.frequencyBinCount);
    const binHz = state.ctx.sampleRate / state.analyser.fftSize;

    const frame = () => {
      if (!state.active || !state.analyser || !state.ctx) return;
      state.analyser.getFloatFrequencyData(data);

      const peak = bandMax(data, binHz, 15900, 18750);
      const noise = bandAverage(data, binHz, 11800, 14600);
      const score = peak - noise;
      const normalized = Math.max(0, Math.min(100, Math.round((peak + 82) * 2.6)));
      emitLevel(normalized, peak, score);

      const canListen = performance.now() > state.ignoreUntil;
      const likelyBeacon = canListen && peak > -70 && score > 9;

      if (likelyBeacon) state.streak += 1;
      else state.streak = Math.max(0, state.streak - 1);

      if (!state.triggered && state.streak >= 3) {
        state.triggered = true;
        emitStatus("Otro Love2Pair detectado cerca");
        try { state.callbacks.onSignal?.({ peakDb: peak, score }); } catch {}
        return;
      }

      state.raf = requestAnimationFrame(frame);
    };
    state.raf = requestAnimationFrame(frame);
  }

  async function stop(options = {}) {
    state.active = false;
    clearTimeout(state.timer);
    cancelAnimationFrame(state.raf);
    state.timer = 0;
    state.raf = 0;
    state.streak = 0;

    try { state.source?.disconnect(); } catch {}
    state.source = null;
    state.analyser = null;

    if (state.stream) {
      for (const track of state.stream.getTracks()) {
        try { track.stop(); } catch {}
      }
    }
    state.stream = null;

    if (state.ctx && state.ctx.state !== "closed") {
      try { await state.ctx.close(); } catch {}
    }
    state.ctx = null;

    if (!options.keepTriggered) state.triggered = false;
    if (!options.silent) emitStatus("Detección detenida");
  }

  async function start(callbacks = {}) {
    if (!AudioCtx) throw new Error("Web Audio no está disponible en este navegador.");
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Este navegador no permite usar el micrófono desde la web.");
    }
    if (!window.isSecureContext) {
      throw new Error("La detección requiere HTTPS.");
    }

    await stop({ silent: true });
    state.callbacks = callbacks;
    state.triggered = false;
    state.streak = 0;
    emitStatus("Solicitando permiso de micrófono…");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      },
      video: false
    });

    const ctx = new AudioCtx({ latencyHint: "interactive" });
    await ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0.2;
    analyser.minDecibels = -105;
    analyser.maxDecibels = -20;
    source.connect(analyser);

    state.stream = stream;
    state.ctx = ctx;
    state.source = source;
    state.analyser = analyser;
    state.active = true;
    state.ignoreUntil = performance.now() + 650;

    emitStatus("Buscando otro celular cercano…");
    scheduleBeacon();
    detectLoop();
    return true;
  }

  window.Love2PairProximity = {
    start,
    stop,
    get active() { return state.active; },
    get supported() {
      return Boolean(AudioCtx && navigator.mediaDevices?.getUserMedia && window.isSecureContext);
    }
  };
})();