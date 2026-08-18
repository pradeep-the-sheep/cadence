/**
 * Cadence · Parkinson's Daily Companion
 * dataStore.js - Centralized state and localStorage management
 */

window.Cadence = window.Cadence || {};

(function() {
  const STORE_KEY = 'cadence_state_v3';
  const CONSENT_KEY = 'cadence_consent_v1';
  const THEME_KEY = 'cadence_theme_v1';
  const TEXTSIZE_KEY = 'cadence_textsize_v1';

  function loadState() {
    let loaded = {};
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }

    return {
      meds: loaded.meds || [],
      medLog: loaded.medLog || [],
      medSkips: loaded.medSkips || [],
      missedDoses: loaded.missedDoses || [],
      symptoms: loaded.symptoms || [],
      logs: loaded.logs || [],
      sleep: loaded.sleep || [],
      gait: loaded.gait || [],
      onOffLogs: loaded.onOffLogs || [],
      medicalId: loaded.medicalId || {},
      _nudgeDismissed: loaded._nudgeDismissed || {},
      snoozeUntil: loaded.snoozeUntil || {},
      fingerGymLogs: loaded.fingerGymLogs || [],
      moodLogs: loaded.moodLogs || [],
      habitSettings: loaded.habitSettings || null,
      rhythmStreak: loaded.rhythmStreak || 0,
      lastActiveDate: loaded.lastActiveDate || '',
      notificationsMuted: loaded.notificationsMuted || false
    };
  }

  const state = loadState();

  function saveState() {
    try {
      const toSave = { ...state };
      delete toSave._insightData;
      localStorage.setItem(STORE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  function clearAllData() {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(CONSENT_KEY);
    Object.assign(state, {
      meds: [],
      medLog: [],
      medSkips: [],
      missedDoses: [],
      symptoms: [],
      logs: [],
      sleep: [],
      gait: [],
      onOffLogs: [],
      medicalId: {},
      _nudgeDismissed: {},
      snoozeUntil: {},
      fingerGymLogs: [],
      moodLogs: [],
      habitSettings: null,
      rhythmStreak: 0,
      lastActiveDate: ''
    });
  }

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function setConsent(agreed) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      agreed,
      timestamp: new Date().toISOString(),
      version: '2.0',
      notice: 'GDPR-compliant consent for health data processing under Art. 9(2)(a)'
    }));
  }

  function exportDataAsJSON() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importDataFromJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON format');
    Object.assign(state, {
      meds: parsed.meds || [],
      medLog: parsed.medLog || [],
      medSkips: parsed.medSkips || [],
      missedDoses: parsed.missedDoses || [],
      symptoms: parsed.symptoms || [],
      logs: parsed.logs || [],
      sleep: parsed.sleep || [],
      gait: parsed.gait || [],
      onOffLogs: parsed.onOffLogs || [],
      medicalId: parsed.medicalId || {},
      _nudgeDismissed: parsed._nudgeDismissed || {},
      snoozeUntil: parsed.snoozeUntil || {},
      fingerGymLogs: parsed.fingerGymLogs || [],
      moodLogs: parsed.moodLogs || [],
      habitSettings: parsed.habitSettings || null,
      rhythmStreak: parsed.rhythmStreak || 0,
      lastActiveDate: parsed.lastActiveDate || '',
      notificationsMuted: parsed.notificationsMuted || false
    });
    saveState();
  }

  function generate7DayDemoData() {
    const { uid, getPastDateString } = window.Cadence.helpers;
    
    state.meds = [
      { id: uid(), name: "Carbidopa/Levodopa", dose: "25/100mg", times: ["08:00", "12:00", "16:00", "20:00"] }
    ];
    state.medLog = [];
    state.medSkips = [];
    state.missedDoses = [];
    state.symptoms = [];
    state.logs = [];
    state.sleep = [];
    state.gait = [];
    state.onOffLogs = [];
    state.snoozeUntil = {};

    const sleepRatings = [4, 2, 5, 2, 4, 5, 3];
    const exerciseDays = [0, 1, 3, 5, 6];
    const alcoholDays = [0, 2];
    const proteinDays = [1, 3, 5];

    for (let day = 0; day <= 6; day++) {
      const daysAgo = 6 - day;
      const dateStr = getPastDateString(daysAgo);

      // 1. SLEEP
      state.sleep.push({
        id: uid(),
        date: dateStr,
        rating: sleepRatings[day],
        notes: sleepRatings[day] <= 2 ? "Woke up repeatedly" : "Slept well"
      });

      // 2. DRINKS & MEALS
      state.logs.push({
        id: uid(),
        date: dateStr,
        time: "09:15",
        type: "drink",
        detail: "Coffee"
      });
      
      if (alcoholDays.includes(day)) {
        state.logs.push({
          id: uid(),
          date: dateStr,
          time: "21:00",
          type: "drink",
          detail: "Red Wine"
        });
      }

      state.logs.push({
        id: uid(),
        date: dateStr,
        time: "08:30",
        type: "meal",
        options: ["carbohydrates"],
        detail: "Breakfast"
      });
      
      if (proteinDays.includes(day)) {
        state.logs.push({
          id: uid(),
          date: dateStr,
          time: "12:15",
          type: "meal",
          options: ["protein"],
          detail: "High-protein Lunch"
        });
      } else {
        state.logs.push({
          id: uid(),
          date: dateStr,
          time: "12:30",
          type: "meal",
          options: ["carbohydrates"],
          detail: "Lunch"
        });
      }
      
      state.logs.push({
        id: uid(),
        date: dateStr,
        time: "18:30",
        type: "meal",
        options: ["carbohydrates"],
        detail: "Dinner"
      });

      // 3. EXERCISE
      if (exerciseDays.includes(day)) {
        state.logs.push({
          id: uid(),
          date: dateStr,
          time: "10:00",
          type: "activity",
          detail: "Walking"
        });
        state.logs.push({
          id: uid(),
          date: dateStr,
          time: "10:20",
          type: "activity",
          detail: "Stretching"
        });
      }

      // 4. MEDS
      const med = state.meds[0];
      med.times.forEach(t => {
        if (day === 3 && (t === "12:00" || t === "16:00")) {
          state.missedDoses.push({
            id: uid(),
            medId: med.id,
            date: dateStr,
            time: t,
            missedAt: `${dateStr}T${t}:00`
          });
        } else {
          state.medLog.push({
            id: uid(),
            medId: med.id,
            date: dateStr,
            time: t,
            takenAt: `${dateStr}T${t}:00`
          });
        }
      });

      // 5. MOTOR STATES
      let offCount = (day === 2 || day === 4) ? 4 : 1;
      const logTimes = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];
      logTimes.forEach((t, index) => {
        let stateVal = (index < offCount) ? "OFF" : "ON";
        state.onOffLogs.push({
          id: uid(),
          date: dateStr,
          time: t,
          state: stateVal
        });
      });

      // 6. SYMPTOMS
      const severity = (day === 2 || day === 4) ? 4 : 2;
      ["Tremor", "Stiffness", "Fatigue"].forEach(sym => {
        state.symptoms.push({
          id: uid(),
          date: dateStr,
          time: "14:00",
          name: sym,
          severity: severity
        });
      });

      // 7. GAIT (FOG events)
      if (proteinDays.includes(day) || day === 3) {
        state.gait.push({
          id: uid(),
          date: dateStr,
          time: "12:45",
          type: "freeze",
          severity: 3
        });
        state.gait.push({
          id: uid(),
          date: dateStr,
          time: "13:10",
          type: "freeze",
          severity: 4
        });
      }
    }

    saveState();
  }

  window.Cadence.dataStore = {
    STORE_KEY,
    CONSENT_KEY,
    THEME_KEY,
    TEXTSIZE_KEY,
    state,
    loadState,
    saveState,
    clearAllData,
    getConsent,
    setConsent,
    exportDataAsJSON,
    importDataFromJSON,
    generate7DayDemoData
  };
})();
