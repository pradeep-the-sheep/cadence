/**
 * Cadence · Parkinson's Daily Companion
 * audioUtils.js - Web Audio synthesizers, audio cues, and voice guidance
 */

window.Cadence = window.Cadence || {};

(function() {
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported on this browser:', e);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    const state = window.Cadence?.dataStore?.state;
    if (state && state.notificationsMuted) return;
    const ctx = ensureAudio();
    if (!ctx) return;

    try {
      const n = ctx.currentTime;
      if (type === 'click') {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 700;
        o.frequency.exponentialRampToValueAtTime(500, n + 0.04);
        g.gain.setValueAtTime(0.08, n);
        g.gain.exponentialRampToValueAtTime(0.001, n + 0.06);
        o.connect(g).connect(ctx.destination);
        o.start(n);
        o.stop(n + 0.07);
      } else if (type === 'success') {
        [0, 0.1].forEach((offset, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = i === 0 ? 660 : 880;
          g.gain.setValueAtTime(0.1, n + offset);
          g.gain.exponentialRampToValueAtTime(0.001, n + offset + 0.15);
          osc.connect(g).connect(ctx.destination);
          osc.start(n + offset);
          osc.stop(n + offset + 0.16);
        });
      } else if (type === 'alarm') {
        [0, 0.35, 0.7, 1.05, 1.4].forEach(offset => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 780;
          g.gain.setValueAtTime(0.001, n + offset);
          g.gain.exponentialRampToValueAtTime(0.28, n + offset + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, n + offset + 0.32);
          osc.connect(g).connect(ctx.destination);
          osc.start(n + offset);
          osc.stop(n + offset + 0.33);
        });
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  function speakText(text) {
    const voiceChk = document.getElementById('fg-voice-chk');
    if (voiceChk && !voiceChk.checked) return;
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  }

  window.Cadence.audioUtils = {
    ensureAudio,
    playSound,
    speakText
  };
})();
