/**
 * Cadence · Parkinson's Daily Companion
 * medicationEngine.js - Medication scheduling, adherence streak, alarms, countdown, and reminders
 */

window.Cadence = window.Cadence || {};

(function() {
  let activeAlarmKey = null;
  let lastCheckedPreDoseMinutes = -1;

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

  function genTimes(firstTime, intervalHours, count) {
    const [h, m] = firstTime.split(':').map(Number);
    let totalMin = h * 60 + m;
    const stepMin = intervalHours * 60;
    const times = [];
    for (let e = 0; e < count; e++) {
      const hh = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
      const mm = String(Math.round(totalMin % 60)).padStart(2, '0');
      times.push(`${hh}:${mm}`);
      totalMin += stepMin;
    }
    return times;
  }

  function medTakenToday(id, t) {
    const state = getState();
    const { todayStr } = getHelpers();
    return (state.medLog || []).some(l => l.medId === id && l.time === t && l.date === todayStr());
  }

  function isSkippedToday(id, t) {
    const state = getState();
    const { todayStr } = getHelpers();
    return (state.medSkips || []).some(s => s.medId === id && s.time === t && s.date === todayStr());
  }

  function isSnoozed(id, t) {
    const state = getState();
    const { occKey } = getHelpers();
    const k = occKey(id, t);
    return state.snoozeUntil && state.snoozeUntil[k] && state.snoozeUntil[k] > Date.now();
  }

  function logDoseTaken(id, t, triggerRender = true) {
    const state = getState();
    const { uid, todayStr } = getHelpers();
    state.medLog.unshift({
      id: uid(),
      medId: id,
      time: t,
      date: todayStr(),
      takenAt: new Date().toISOString()
    });
    saveState();
    getAudio().playSound('success');
    getModals().showToast('Dose taken!');
    if (triggerRender && window.Cadence.uiRenderer && window.Cadence.uiRenderer.renderAll) {
      window.Cadence.uiRenderer.renderAll();
    }
  }

  function delMed(id) {
    const state = getState();
    state.meds = (state.meds || []).filter(m => m.id !== id);
    state.medLog = (state.medLog || []).filter(l => l.medId !== id);
    state.medSkips = (state.medSkips || []).filter(s => s.medId !== id);
    state.missedDoses = (state.missedDoses || []).filter(d => d.medId !== id);
    if (state.snoozeUntil) {
      Object.keys(state.snoozeUntil).forEach(k => {
        if (k.startsWith(id + '|')) delete state.snoozeUntil[k];
      });
    }
    saveState();
    if (window.Cadence.uiRenderer && window.Cadence.uiRenderer.renderAll) {
      window.Cadence.uiRenderer.renderAll();
    }
  }

  function calculateAdherenceStreak() {
    const state = getState();
    const { getPastDateString, timeToMinutes, nowHM } = getHelpers();
    if (!state.meds || state.meds.length === 0) return 0;
    let streak = 0;
    let dayIdx = 0;
    
    while (true) {
      const dateStr = getPastDateString(dayIdx);
      let totalScheduled = 0;
      state.meds.forEach(m => {
        totalScheduled += (m.times || []).length;
      });
      if (totalScheduled === 0) break;
      
      const takenCount = (state.medLog || []).filter(l => l.date === dateStr).length;
      const missedCount = (state.missedDoses || []).filter(l => l.date === dateStr).length;
      const skippedCount = (state.medSkips || []).filter(s => s.date === dateStr).length;
      
      if (dayIdx === 0) {
        const nowMin = timeToMinutes(nowHM());
        let scheduledUpToNow = 0;
        state.meds.forEach(m => {
          (m.times || []).forEach(t => {
            if (timeToMinutes(t) <= nowMin) {
              scheduledUpToNow++;
            }
          });
        });
        
        if (scheduledUpToNow === 0) {
          dayIdx++;
          continue;
        }
        
        const dueTakenOrSkipped = (state.medLog || []).filter(l => l.date === dateStr).length + 
                                  (state.medSkips || []).filter(s => s.date === dateStr).length;
        
        if (missedCount > 0 || dueTakenOrSkipped < scheduledUpToNow) {
          break;
        } else {
          streak++;
        }
      } else {
        const totalTakenOrSkipped = takenCount + skippedCount;
        if (missedCount > 0 || totalTakenOrSkipped < totalScheduled) {
          break;
        } else {
          streak++;
        }
      }
      
      dayIdx++;
      if (dayIdx > 365) break;
    }
    return streak;
  }

  function updateDoseClock() {
    const state = getState();
    const { nowHM, timeToMinutes, fmtTime } = getHelpers();
    const n = nowHM();
    const nowMin = timeToMinutes(n);
    let next = null;
    let nextMin = Infinity;

    (state.meds || []).forEach(m => {
      (m.times || []).forEach(t => {
        if (medTakenToday(m.id, t) || isSkippedToday(m.id, t)) return;
        const tm = timeToMinutes(t);
        if (tm >= nowMin && tm < nextMin) {
          nextMin = tm;
          next = { med: m, time: t, min: tm, isOverdue: false };
        }
      });
    });

    if (!next) {
      let overdueMin = Infinity;
      (state.meds || []).forEach(m => {
        (m.times || []).forEach(t => {
          if (medTakenToday(m.id, t) || isSkippedToday(m.id, t)) return;
          const tm = timeToMinutes(t);
          if (tm < nowMin && tm < overdueMin) {
            overdueMin = tm;
            next = { med: m, time: t, min: tm, isOverdue: true };
          }
        });
      });
    }

    const lbl = document.getElementById('doseLabel');
    const el = document.getElementById('doseCountdown');
    const sub = document.getElementById('doseSub');
    const prog = document.getElementById('doseProgress');

    if (!state.meds || state.meds.length === 0) {
      if (lbl) lbl.textContent = '⏱️ Next dose in';
      if (el) { el.textContent = '--h --m'; el.className = 'countdown'; }
      if (sub) sub.textContent = 'No medication scheduled';
      if (prog) { prog.style.width = '0%'; prog.className = 'fill'; }
      return;
    }

    if (!next) {
      let tomorrowNext = null;
      let tomorrowMin = Infinity;

      state.meds.forEach(m => {
        (m.times || []).forEach(t => {
          const tm = timeToMinutes(t);
          if (tm < tomorrowMin) {
            tomorrowMin = tm;
            tomorrowNext = { med: m, time: t, min: tm };
          }
        });
      });

      if (!tomorrowNext) {
        if (lbl) lbl.textContent = '⏱️ Next dose in';
        if (el) { el.textContent = '--h --m'; el.className = 'countdown'; }
        if (sub) sub.textContent = 'No medication scheduled';
        if (prog) { prog.style.width = '0%'; prog.className = 'fill'; }
        return;
      }

      const diff = (24 * 60 - nowMin) + tomorrowNext.min;
      const hours = Math.floor(diff / 60);
      const mins = Math.round(diff % 60);

      if (lbl) lbl.textContent = "🎉 Today's doses done!";
      if (el) { el.textContent = `${hours}h ${mins}m`; el.className = 'countdown ok'; }
      if (sub) sub.textContent = `Next: ${tomorrowNext.med.name} tomorrow at ${fmtTime(tomorrowNext.time)}`;
      if (prog) { prog.style.width = '100%'; prog.className = 'fill ok'; }
      return;
    }

    if (lbl) lbl.textContent = '⏱️ Next dose in';

    if (next.isOverdue) {
      if (el) { el.textContent = 'Overdue'; el.className = 'countdown overdue'; }
      if (sub) sub.textContent = `⚠️ Overdue: ${next.med.name} at ${fmtTime(next.time)}`;
      if (prog) { prog.style.width = '100%'; prog.className = 'fill overdue'; }
    } else {
      const diff = next.min - nowMin;
      const hours = Math.floor(diff / 60);
      const mins = Math.round(diff % 60);
      if (el) el.textContent = `${hours}h ${mins}m`;

      if (diff < 120) {
        if (el) el.className = 'countdown warning';
        if (sub) sub.textContent = `⏰ Approaching: ${next.med.name} at ${fmtTime(next.time)}`;
        const pct = ((120 - diff) / 120) * 100;
        if (prog) { prog.style.width = Math.min(pct, 100) + '%'; prog.className = 'fill warning'; }
      } else {
        if (el) el.className = 'countdown ok';
        if (sub) sub.textContent = `Next: ${next.med.name} at ${fmtTime(next.time)}`;
        const pct = ((480 - diff) / 480) * 100;
        if (prog) { prog.style.width = Math.max(0, Math.min(pct, 100)) + '%'; prog.className = 'fill ok'; }
      }
    }
  }

  function findDueOccurrence() {
    const state = getState();
    const { nowHM, occKey } = getHelpers();
    const ns = nowHM();
    let best = null;
    for (const m of (state.meds || [])) {
      for (const t of (m.times || [])) {
        if (t > ns || medTakenToday(m.id, t) || isSkippedToday(m.id, t) || isSnoozed(m.id, t)) continue;
        if (!best || t < best.time) {
          best = { med: m, time: t, key: occKey(m.id, t) };
        }
      }
    }
    return best;
  }

  function checkAlarm() {
    if (activeAlarmKey) return;
    const state = getState();
    const { fmtTime } = getHelpers();
    const d = findDueOccurrence();
    if (!d) return;
    activeAlarmKey = d.key;
    const medLine = document.getElementById('alarmMedLine');
    if (medLine) {
      medLine.textContent = `${d.med.name}${d.med.dose ? ' • ' + d.med.dose : ''} • ${fmtTime(d.time)}`;
    }
    const alarmGate = document.getElementById('alarmGate');
    if (alarmGate) alarmGate.classList.remove('hidden');
    getAudio().playSound('alarm');
    if ('Notification' in window && Notification.permission === 'granted' && !state.notificationsMuted) {
      new Notification('Cadence 💊 dose due', { body: `${d.med.name} (${fmtTime(d.time)})` });
    }
  }

  function closeAlarmGate() {
    const alarmGate = document.getElementById('alarmGate');
    if (alarmGate) alarmGate.classList.add('hidden');
    activeAlarmKey = null;
  }

  function checkMissedDoses() {
    const state = getState();
    const { nowHM, timeToMinutes, uid, todayStr } = getHelpers();
    const ns = nowHM();
    (state.meds || []).forEach(m => {
      (m.times || []).forEach(t => {
        if (medTakenToday(m.id, t) || isSkippedToday(m.id, t) || isSnoozed(m.id, t)) return;
        if (t <= '23:59' && t < ns) {
          const hDiff = (timeToMinutes(ns) - timeToMinutes(t)) / 60;
          if (hDiff >= 2 && !state.missedDoses.some(d => d.medId === m.id && d.time === t && d.date === todayStr())) {
            state.missedDoses.push({
              id: uid(),
              medId: m.id,
              time: t,
              date: todayStr(),
              missedAt: new Date().toISOString()
            });
            saveState();
          }
        }
      });
    });
  }

  function checkPreDoseReminders() {
    const state = getState();
    const { timeToMinutes, fmtTime } = getHelpers();
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    if (currentMin === lastCheckedPreDoseMinutes) return;
    lastCheckedPreDoseMinutes = currentMin;
    
    (state.meds || []).forEach(m => {
      (m.times || []).forEach(t => {
        const scheduledMin = timeToMinutes(t);
        const diff = scheduledMin - currentMin;
        
        if (diff === 15) {
          if (medTakenToday(m.id, t) || isSkippedToday(m.id, t)) return;
          
          getAudio().playSound('click');
          getModals().showToast(`⏰ Upcoming Dose: ${m.name} is scheduled in 15 minutes (${fmtTime(t)}).`);
          
          if ('Notification' in window && Notification.permission === 'granted' && !state.notificationsMuted) {
            new Notification('Cadence 💊 Upcoming Dose', { 
              body: `${m.name} is due in 15 minutes (${fmtTime(t)}).` 
            });
          }
        }
      });
    });
  }

  window.Cadence.medicationEngine = {
    genTimes,
    medTakenToday,
    isSkippedToday,
    isSnoozed,
    logDoseTaken,
    delMed,
    calculateAdherenceStreak,
    updateDoseClock,
    findDueOccurrence,
    checkAlarm,
    closeAlarmGate,
    checkMissedDoses,
    checkPreDoseReminders
  };
})();
