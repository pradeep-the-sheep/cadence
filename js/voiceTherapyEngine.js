/**
 * Cadence · Parkinson's Daily Companion
 * voiceTherapyEngine.js - Speak LOUD voice therapy, real-time loudness gauge & microphone calibration
 */

window.Cadence = window.Cadence || {};

(function() {
  let fgVoiceCalibrated = false;
  let fgVoiceCalibrating = false;
  let fgVoiceBaseline = 0.20;
  let fgVoiceTargetMin = 0.35;
  let fgVoiceTargetMax = 0.85;
  let fgVoiceActive = false;
  let fgVoiceStream = null;
  let fgVoiceAnalyser = null;
  let fgVoiceAudioCtx = null;
  let fgVoiceSourceNode = null;
  let fgVoiceAnimId = null;
  let fgVoiceMode = 'sustained';
  let fgVoiceLoudness = 0;
  let fgVoicePeakLoudness = 0;
  let fgVoiceTimeInZone = 0;
  let fgVoiceTotalFrames = 0;
  let fgVoiceTimeRemaining = 45;
  let fgVoiceTimerInterval = null;
  let fgVoiceCurrentPromptIdx = 0;
  let fgVoiceLoudnessHistory = [];

  const fgVoicePhrases = [
    "Hello, it is great to see you!",
    "Could you please pass the water?",
    "I am ready to head out now.",
    "What would you like for dinner?",
    "Thank you so much for your help.",
    "Let's catch up again tomorrow.",
    "The weather is wonderful today.",
    "Have a fantastic afternoon!"
  ];

  function getState() {
    return window.Cadence.dataStore.state;
  }
  function saveState() {
    return window.Cadence.dataStore.saveState();
  }
  function getHelpers() {
    return window.Cadence.helpers;
  }
  function getAudio() {
    return window.Cadence.audioUtils;
  }
  function getModals() {
    return window.Cadence.modalManager;
  }
  function getHabits() {
    return window.Cadence.habitEngine;
  }

  function calibrateVoiceMic() {
    if (fgVoiceActive || fgVoiceCalibrating) {
      getModals().showToast("Please stop any running voice session first!");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        fgVoiceCalibrating = true;
        fgVoiceStream = stream;
        fgVoiceAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        fgVoiceSourceNode = fgVoiceAudioCtx.createMediaStreamSource(stream);
        fgVoiceAnalyser = fgVoiceAudioCtx.createAnalyser();
        fgVoiceAnalyser.fftSize = 2048;
        fgVoiceAnalyser.smoothingTimeConstant = 0.8;
        fgVoiceSourceNode.connect(fgVoiceAnalyser);

        let samples = [];
        let calTime = 5;
        const timerEl = document.getElementById('fg-voice-val-timer');
        if (timerEl) timerEl.textContent = calTime + 's';
        const promptEl = document.getElementById('fg-voice-prompt');
        if (promptEl) {
          promptEl.innerHTML = '<span style="font-size:1.3rem; color:var(--primary); font-weight:700;">🎤 CALIBRATION IN PROGRESS</span><br><span style="color:var(--ink);">Speak aloud in your comfortable everyday voice...</span>';
        }

        const calInterval = setInterval(() => {
          if (!fgVoiceAnalyser) return;
          const bufferLength = fgVoiceAnalyser.fftSize;
          const dataArray = new Uint8Array(bufferLength);
          fgVoiceAnalyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / bufferLength);
          const normalizedLevel = Math.min(1.0, rms * 3.0);
          samples.push(normalizedLevel);
        }, 100);

        const countdownInterval = setInterval(() => {
          calTime--;
          if (calTime <= 0) {
            clearInterval(countdownInterval);
            clearInterval(calInterval);
            fgVoiceCalibrating = false;

            const avgLevel = samples.length > 0 ? (samples.reduce((a, b) => a + b, 0) / samples.length) : 0.20;
            fgVoiceBaseline = Math.max(0.10, Math.min(0.40, avgLevel));
            fgVoiceTargetMin = parseFloat(Math.min(0.65, Math.max(0.25, fgVoiceBaseline * 1.5)).toFixed(2));
            fgVoiceTargetMax = parseFloat(Math.min(0.95, fgVoiceTargetMin + 0.45).toFixed(2));
            fgVoiceCalibrated = true;

            if (fgVoiceStream) {
              fgVoiceStream.getTracks().forEach(t => t.stop());
              fgVoiceStream = null;
            }
            if (fgVoiceAudioCtx && fgVoiceAudioCtx.state !== 'closed') {
              try { fgVoiceAudioCtx.close(); } catch(e) {}
              fgVoiceAudioCtx = null;
            }
            fgVoiceAnalyser = null;

            if (timerEl) timerEl.textContent = '45s';
            if (promptEl) {
              promptEl.innerHTML = '<span style="font-size:1.3rem; color:#22c55e; font-weight:700;">✅ MICROPHONE CALIBRATED!</span><br><span style="color:var(--ink-soft);">Target loud zone tailored to your voice (' + Math.round(fgVoiceTargetMin*100) + '% - ' + Math.round(fgVoiceTargetMax*100) + '%). Press <b>Start Session</b> to begin!</span>';
            }
            getModals().showToast('✅ Mic calibrated! Target zone adjusted to ' + Math.round(fgVoiceTargetMin*100) + '% - ' + Math.round(fgVoiceTargetMax*100) + '%.');
          } else {
            if (timerEl) timerEl.textContent = calTime + 's';
          }
        }, 1000);
      })
      .catch(err => {
        fgVoiceCalibrating = false;
        getModals().showToast('Microphone access denied: ' + err.message);
      });
  }

  function startVoiceSession() {
    if (fgVoiceActive) return;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        fgVoiceStream = stream;
        fgVoiceAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        fgVoiceSourceNode = fgVoiceAudioCtx.createMediaStreamSource(stream);
        fgVoiceAnalyser = fgVoiceAudioCtx.createAnalyser();
        fgVoiceAnalyser.fftSize = 2048;
        fgVoiceAnalyser.smoothingTimeConstant = 0.8;
        fgVoiceSourceNode.connect(fgVoiceAnalyser);

        fgVoiceActive = true;
        fgVoiceLoudness = 0;
        fgVoicePeakLoudness = 0;
        fgVoiceTimeInZone = 0;
        fgVoiceTotalFrames = 0;
        fgVoiceLoudnessHistory = [];
        fgVoiceCurrentPromptIdx = 0;

        const times = { sustained: 60, counting: 30, phrases: 45 };
        fgVoiceTimeRemaining = times[fgVoiceMode] || 45;
        
        const timerEl = document.getElementById('fg-voice-val-timer');
        const loudEl = document.getElementById('fg-voice-val-loudness');
        const zoneEl = document.getElementById('fg-voice-val-zone');
        const startBtn = document.getElementById('fg-voice-btn-start');
        const stopBtn = document.getElementById('fg-voice-btn-stop');

        if (timerEl) timerEl.textContent = fgVoiceTimeRemaining + 's';
        if (loudEl) loudEl.textContent = '--';
        if (zoneEl) zoneEl.textContent = '--%';
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'inline-flex';

        updateVoicePrompt(true);

        if (fgVoiceTimerInterval) clearInterval(fgVoiceTimerInterval);
        fgVoiceTimerInterval = setInterval(() => {
          fgVoiceTimeRemaining--;
          if (fgVoiceTimeRemaining < 0) fgVoiceTimeRemaining = 0;
          if (timerEl) timerEl.textContent = fgVoiceTimeRemaining + 's';
          updateVoicePrompt(false);
          if (fgVoiceTimeRemaining <= 0) {
            completeVoiceSession();
          }
        }, 1000);

        fgVoiceAnimId = requestAnimationFrame(voiceAnalysisLoop);
      })
      .catch(err => {
        console.error("Microphone access error:", err);
        getModals().showToast("Could not access microphone.");
      });
  }

  function stopVoiceSession() {
    if (fgVoiceTimerInterval) {
      clearInterval(fgVoiceTimerInterval);
      fgVoiceTimerInterval = null;
    }
    if (fgVoiceAnimId) {
      cancelAnimationFrame(fgVoiceAnimId);
      fgVoiceAnimId = null;
    }
    if (fgVoiceStream) {
      fgVoiceStream.getTracks().forEach(t => t.stop());
      fgVoiceStream = null;
    }
    if (fgVoiceSourceNode) {
      try { fgVoiceSourceNode.disconnect(); } catch(e) {}
      fgVoiceSourceNode = null;
    }
    if (fgVoiceAudioCtx && fgVoiceAudioCtx.state !== 'closed') {
      try { fgVoiceAudioCtx.close(); } catch(e) {}
      fgVoiceAudioCtx = null;
    }
    fgVoiceAnalyser = null;
    fgVoiceActive = false;

    const startBtn = document.getElementById('fg-voice-btn-start');
    const stopBtn = document.getElementById('fg-voice-btn-stop');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
  }

  function completeVoiceSession() {
    const zonePercent = fgVoiceTotalFrames > 0 ? Math.round(fgVoiceTimeInZone / fgVoiceTotalFrames * 100) : 0;
    const avgLoudness = fgVoiceLoudnessHistory.length > 0
      ? Math.round(fgVoiceLoudnessHistory.reduce((a, b) => a + b, 0) / fgVoiceLoudnessHistory.length * 100)
      : 0;

    stopVoiceSession();

    const modeLabels = { sustained: 'Sustained Ahhh', counting: 'Loud Counting', phrases: 'Phrases', pataka: 'Pa-Ta-Ka Diadochokinesis' };
    const { uid, todayStr, nowHM } = getHelpers();
    const state = getState();

    let record = {
      id: uid(),
      date: todayStr(),
      time: nowHM(),
      exercise: 'Voice: ' + (modeLabels[fgVoiceMode] || fgVoiceMode),
      speed: avgLoudness,
      consistency: zonePercent,
      score: Math.round(fgVoicePeakLoudness * 100)
    };

    state.fingerGymLogs.unshift(record);
    getHabits().syncHabitsWithActivityOrMeal('activity', record.exercise);
    saveState();

    getAudio().playSound('success');
    getModals().showToast('Voice therapy results saved! ' + zonePercent + '% time in target zone.');
    renderVoiceHistory();

    const promptEl = document.getElementById('fg-voice-prompt');
    if (promptEl) {
      promptEl.innerHTML = '<span style="font-size:1.4rem;color:#22c55e;">✅ Session complete!</span><br><span style="color:var(--ink-soft);">Avg loudness: ' + avgLoudness + '% • In zone: ' + zonePercent + '% • Peak: ' + Math.round(fgVoicePeakLoudness * 100) + '%</span>';
    }
  }

  function voiceAnalysisLoop() {
    if (!fgVoiceActive || !fgVoiceAnalyser) return;

    const bufferLength = fgVoiceAnalyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    fgVoiceAnalyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / bufferLength);
    fgVoiceLoudness = fgVoiceLoudness * 0.7 + rms * 0.3;
    const normalizedLevel = Math.min(1.0, fgVoiceLoudness * 3.0);

    fgVoiceTotalFrames++;
    fgVoiceLoudnessHistory.push(normalizedLevel);
    if (fgVoiceLoudnessHistory.length > 3600) fgVoiceLoudnessHistory.shift();

    if (normalizedLevel > fgVoicePeakLoudness) fgVoicePeakLoudness = normalizedLevel;

    const targetMin = fgVoiceTargetMin || 0.35;
    const targetMax = fgVoiceTargetMax || 0.85;
    const inZone = normalizedLevel >= targetMin && normalizedLevel <= targetMax;
    if (inZone) fgVoiceTimeInZone++;

    const zonePercent = fgVoiceTotalFrames > 0 ? Math.round(fgVoiceTimeInZone / fgVoiceTotalFrames * 100) : 0;
    const loudEl = document.getElementById('fg-voice-val-loudness');
    const zoneEl = document.getElementById('fg-voice-val-zone');
    if (loudEl) loudEl.textContent = Math.round(normalizedLevel * 100) + '%';
    if (zoneEl) zoneEl.textContent = zonePercent + '%';

    const canvas = document.getElementById('fg-voice-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawVoiceLoudnessGauge(ctx, canvas, normalizedLevel, inZone);
    }

    fgVoiceAnimId = requestAnimationFrame(voiceAnalysisLoop);
  }

  function drawVoiceLoudnessGauge(ctx, canvas, level, inZone) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height * 0.72;
    const radius = Math.min(canvas.width, canvas.height) * 0.42;
    const lineWidth = 26;

    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 0.2;
    const totalArc = (2 * Math.PI) - (startAngle - endAngle);

    const targetMin = fgVoiceTargetMin || 0.35;
    const targetMax = fgVoiceTargetMax || 0.85;
    const zones = [
      { start: 0, end: targetMin, color: '#ef4444' },
      { start: targetMin, end: targetMax, color: '#22c55e' },
      { start: targetMax, end: 1.0, color: '#f97316' }
    ];

    zones.forEach(zone => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle + zone.start * totalArc, startAngle + zone.end * totalArc);
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'butt';
      ctx.globalAlpha = 0.25;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    const levelAngle = startAngle + Math.min(1, level) * totalArc;
    const activeColor = level < targetMin ? '#ef4444' : level <= targetMax ? '#22c55e' : '#f97316';

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, levelAngle);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    const needleLength = radius + 12;
    const nx = cx + Math.cos(levelAngle) * needleLength;
    const ny = cy + Math.sin(levelAngle) * needleLength;
    const nbx = cx + Math.cos(levelAngle) * (radius - lineWidth);
    const nby = cy + Math.sin(levelAngle) * (radius - lineWidth);

    ctx.beginPath();
    ctx.moveTo(nbx, nby);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = activeColor;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(level * 100) + '%', cx, cy - 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px sans-serif';
    const statusText = level < 0.1 ? '🎤 Waiting for voice...' : level < targetMin ? '🔇 Speak LOUDER!' : level <= targetMax ? '✅ Great volume!' : '⚠️ Too loud!';
    ctx.fillText(statusText, cx, cy + 18);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#ef4444';
    const qAngle = startAngle + 0.15 * totalArc;
    ctx.fillText('Quiet', cx + Math.cos(qAngle) * (radius + 28), cy + Math.sin(qAngle) * (radius + 28));

    ctx.fillStyle = '#22c55e';
    const tAngle = startAngle + 0.6 * totalArc;
    ctx.fillText('Target', cx + Math.cos(tAngle) * (radius + 28), cy + Math.sin(tAngle) * (radius + 28));

    ctx.fillStyle = '#f97316';
    const lAngle = startAngle + 0.92 * totalArc;
    ctx.fillText('Loud', cx + Math.cos(lAngle) * (radius + 28), cy + Math.sin(lAngle) * (radius + 28));

    if (fgVoiceLoudnessHistory.length > 1) {
      const barY = canvas.height - 25;
      const barH = 20;
      const barW = canvas.width - 40;
      const startX = 20;
      const step = barW / Math.min(200, fgVoiceLoudnessHistory.length);
      const history = fgVoiceLoudnessHistory.slice(-200);

      ctx.save();
      ctx.beginPath();
      history.forEach((v, idx) => {
        const x = startX + idx * step;
        const h = v * barH;
        const barColor = v < targetMin ? '#ef4444' : v <= targetMax ? '#22c55e' : '#f97316';
        ctx.fillStyle = barColor;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x, barY + barH - h, Math.max(1, step - 1), h);
      });
      ctx.globalAlpha = 1.0;

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(startX, barY + barH - targetMin * barH);
      ctx.lineTo(startX + barW, barY + barH - targetMin * barH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(startX, barY + barH - targetMax * barH);
      ctx.lineTo(startX + barW, barY + barH - targetMax * barH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function updateVoicePrompt(initial) {
    const promptEl = document.getElementById('fg-voice-prompt');
    if (!promptEl) return;

    if (!fgVoiceActive && initial) {
      const modeDescs = {
        sustained: 'Hold a loud, steady "Ahhh" sound. 10 seconds on, 3 seconds rest. 5 reps.',
        counting: 'Count from 1 to 10, saying each number loudly and clearly.',
        phrases: 'Read each phrase aloud, projecting your voice across the room.',
        pataka: 'Rapid articulation: "PA-PA-PA", "TA-TA-TA", "KA-KA-KA", and "PA-TA-KA" in rhythm.'
      };
      promptEl.innerHTML = '<span style="color:var(--ink-soft);">' + (modeDescs[fgVoiceMode] || 'Select a mode and press Start.') + '</span>';
      return;
    }

    if (!fgVoiceActive) return;

    if (fgVoiceMode === 'sustained') {
      const totalTime = 60;
      const elapsed = totalTime - fgVoiceTimeRemaining;
      const cycleLength = 13;
      const cyclePos = elapsed % cycleLength;
      const repNum = Math.floor(elapsed / cycleLength) + 1;
      if (cyclePos < 10) {
        promptEl.innerHTML = '<span style="font-size:2.2rem;">Say <strong>"AHHHHH"</strong></span><br><span style="color:var(--ink-soft);">Rep ' + repNum + ' • Hold it loud and steady!</span>';
      } else {
        promptEl.innerHTML = '<span style="font-size:1.6rem;color:#f59e0b;">Rest...</span><br><span style="color:var(--ink-soft);">Next rep in ' + (cycleLength - cyclePos) + 's</span>';
      }
    } else if (fgVoiceMode === 'counting') {
      const elapsed = 30 - fgVoiceTimeRemaining;
      const num = Math.min(10, Math.floor(elapsed / 3) + 1);
      promptEl.innerHTML = '<span style="font-size:3rem;font-weight:bold;color:var(--primary);">' + num + '</span><br><span style="color:var(--ink-soft);">Say this number LOUDLY!</span>';
    } else if (fgVoiceMode === 'phrases') {
      const elapsed = 45 - fgVoiceTimeRemaining;
      const idx = Math.min(fgVoicePhrases.length - 1, Math.floor(elapsed / 5));
      promptEl.innerHTML = '<span style="font-size:1.3rem;font-weight:600;line-height:1.5;">"' + fgVoicePhrases[idx] + '"</span><br><span style="color:var(--ink-soft);">Say this phrase LOUDLY and clearly!</span>';
    } else if (fgVoiceMode === 'pataka') {
      const elapsed = 45 - fgVoiceTimeRemaining;
      if (elapsed < 10) {
        promptEl.innerHTML = '<span style="font-size:2.2rem;font-weight:900;color:#38bdf8;">PA — PA — PA — PA</span><br><span style="color:var(--ink-soft);">Phase 1: Lip Closure &amp; Strength</span>';
      } else if (elapsed < 20) {
        promptEl.innerHTML = '<span style="font-size:2.2rem;font-weight:900;color:#22c55e;">TA — TA — TA — TA</span><br><span style="color:var(--ink-soft);">Phase 2: Tongue Tip Agility</span>';
      } else if (elapsed < 30) {
        promptEl.innerHTML = '<span style="font-size:2.2rem;font-weight:900;color:#eab308;">KA — KA — KA — KA</span><br><span style="color:var(--ink-soft);">Phase 3: Back of Tongue Control</span>';
      } else {
        promptEl.innerHTML = '<span style="font-size:2.2rem;font-weight:900;color:#f43f5e;">PA — TA — KA — PA — TA — KA</span><br><span style="color:var(--ink-soft);">Phase 4: Full Sequential Agility</span>';
      }
    }
  }

  function setVoiceMode(mode) {
    if (fgVoiceActive) return;
    fgVoiceMode = mode;
    document.querySelectorAll('.fg-voice-mode').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    const times = { sustained: 60, counting: 30, phrases: 45, pataka: 45 };
    fgVoiceTimeRemaining = times[mode] || 45;
    const timerEl = document.getElementById('fg-voice-val-timer');
    if (timerEl) timerEl.textContent = fgVoiceTimeRemaining + 's';
    updateVoicePrompt(true);
  }

  function renderVoiceHistory() {
    const state = getState();
    const tbody = document.getElementById('vt-history-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const logs = (state.fingerGymLogs || []).filter(row => row.exercise.includes("Voice"));

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 1.5rem; text-align: center; color: var(--ink-faint); font-weight: 500;">No voice assessments recorded yet. Start a session above!</td></tr>`;
      return;
    }

    logs.slice(0, 8).forEach(row => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--line)';
      tr.style.fontSize = '0.9rem';

      let rating = "Fair";
      let ratingColor = "var(--warning)";
      if (row.score >= 82) { rating = "Excellent"; ratingColor = "var(--success)"; }
      else if (row.score >= 68) { rating = "Good"; ratingColor = "var(--primary-dark)"; }

      tr.innerHTML = `
        <td style="padding: 10px 8px; color: var(--ink-soft); font-weight: 500;">${row.date} ${row.time}</td>
        <td style="padding: 10px 8px; font-weight: 700;">${row.exercise}</td>
        <td style="padding: 10px 8px;">${row.speed}% avg</td>
        <td style="padding: 10px 8px;">${row.consistency}%</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: ${ratingColor};">${rating}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  window.Cadence.voiceTherapyEngine = {
    calibrateVoiceMic,
    startVoiceSession,
    stopVoiceSession,
    setVoiceMode,
    renderVoiceHistory
  };
})();
