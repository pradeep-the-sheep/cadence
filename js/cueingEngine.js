/**
 * Cadence · Parkinson's Daily Companion
 * cueingEngine.js - FoG auditory & visual metronome cueing and amplitude practice
 */

window.Cadence = window.Cadence || {};

(function() {
  let fogCueActive = false;
  let fogCueBpm = 80;
  let fogCueInterval = null;
  let fogCueBeat = 0;

  function getAudio() {
    return window.Cadence.audioUtils;
  }
  function getModals() {
    return window.Cadence.modalManager;
  }

  function updateCueBpmLabel() {
    const el = document.getElementById('cueBpmLabel');
    if (el) el.textContent = fogCueBpm + ' BPM';
  }

  function playCueClick() {
    try {
      const ctx = getAudio().ensureAudio();
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = fogCueBeat % 2 === 0 ? 880 : 660;
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn('Cue sound error:', e);
    }
  }

  function pulseCueBars() {
    const bars = [1, 2, 3, 4].map(i => document.getElementById('cueBar' + i));
    bars.forEach(b => b && b.classList.remove('pulse'));
    const idx = fogCueBeat % 4;
    if (bars[idx]) bars[idx].classList.add('pulse');
  }

  function startFogCue() {
    if (fogCueActive) return;
    fogCueActive = true;
    fogCueBeat = 0;
    const btn = document.getElementById('cueStartBtn');
    if (btn) {
      btn.textContent = '■ Stop Cue';
      btn.classList.add('accent');
    }
    const ms = Math.round(60000 / fogCueBpm);
    fogCueInterval = setInterval(() => {
      playCueClick();
      pulseCueBars();
      fogCueBeat++;
    }, ms);
    playCueClick();
    pulseCueBars();
    getModals().showToast('Cueing active — step with the beat');
  }

  function stopFogCue() {
    fogCueActive = false;
    if (fogCueInterval) {
      clearInterval(fogCueInterval);
      fogCueInterval = null;
    }
    const btn = document.getElementById('cueStartBtn');
    if (btn) {
      btn.textContent = '▶ Start Cue';
      btn.classList.remove('accent');
    }
    [1, 2, 3, 4].forEach(i => {
      const b = document.getElementById('cueBar' + i);
      if (b) b.classList.remove('pulse');
    });
  }

  function setCueBpm(bpm) {
    fogCueBpm = Math.max(50, Math.min(140, bpm));
    updateCueBpmLabel();
    if (fogCueActive) {
      stopFogCue();
      startFogCue();
    }
  }

  function initCueingBindings() {
    document.getElementById('cueStartBtn')?.addEventListener('click', () => {
      if (fogCueActive) stopFogCue();
      else startFogCue();
      getAudio().playSound('click');
    });

    document.getElementById('cueBpmUp')?.addEventListener('click', () => {
      setCueBpm(fogCueBpm + 5);
    });

    document.getElementById('cueBpmDown')?.addEventListener('click', () => {
      setCueBpm(fogCueBpm - 5);
    });

    document.querySelectorAll('[data-cue-preset]').forEach(p => {
      p.addEventListener('click', () => {
        setCueBpm(Number(p.dataset.cuePreset));
        document.querySelectorAll('[data-cue-preset]').forEach(x => x.setAttribute('aria-pressed', 'false'));
        p.setAttribute('aria-pressed', 'true');
        getAudio().playSound('click');
      });
    });

    updateCueBpmLabel();
  }

  window.Cadence.cueingEngine = {
    updateCueBpmLabel,
    playCueClick,
    pulseCueBars,
    startFogCue,
    stopFogCue,
    setCueBpm,
    initCueingBindings
  };
})();
