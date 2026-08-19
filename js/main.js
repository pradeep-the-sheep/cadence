/**
 * Cadence · Parkinson's Daily Companion
 * main.js - Application entry point, event coordination & lifecycle management
 */

window.Cadence = window.Cadence || {};

(function() {
  function getState() { return window.Cadence.dataStore.state; }
  function saveState() { return window.Cadence.dataStore.saveState(); }
  function getConsent() { return window.Cadence.dataStore.getConsent(); }
  function setConsent(agreed) { return window.Cadence.dataStore.setConsent(agreed); }
  function clearAllData() { return window.Cadence.dataStore.clearAllData(); }
  function exportDataAsJSON() { return window.Cadence.dataStore.exportDataAsJSON(); }
  function importDataFromJSON(json) { return window.Cadence.dataStore.importDataFromJSON(json); }
  function generate7DayDemoData() { return window.Cadence.dataStore.generate7DayDemoData(); }

  function getHelpers() { return window.Cadence.helpers; }
  function getAudio() { return window.Cadence.audioUtils; }
  function getModals() { return window.Cadence.modalManager; }
  function getMeds() { return window.Cadence.medicationEngine; }
  function getHabits() { return window.Cadence.habitEngine; }
  function getCueing() { return window.Cadence.cueingEngine; }
  function getAnalytics() { return window.Cadence.analyticsEngine; }
  function getFingerGym() { return window.Cadence.fingerGymEngine; }
  function getVoice() { return window.Cadence.voiceTherapyEngine; }
  function getExergame() { return window.Cadence.exergameEngine; }
  function getUI() { return window.Cadence.uiRenderer; }

  let sxVoiceData = '', sxPhotoData = '', logVoiceData = '';
  let selectedSymptoms = [], selectedBody = [], selectedSev = 3;
  let selectedMealType = null, selectedDrinkType = null, selectedGaitType = null;

  function initApp() {
    // 1. Inject all dynamic modals into DOM
    getModals().injectAllModals();

    // 2. Initialize Habit Settings
    getHabits().initHabitSettings();

    // 3. Build Analog Clock Face
    getUI().buildClock();

    // 4. Check Consent Gate
    const consent = getConsent();
    if (consent && consent.agreed) {
      document.getElementById('consentGate')?.classList.add('hidden');
    } else {
      document.getElementById('consentGate')?.classList.remove('hidden');
    }

    // 5. Apply Saved Theme and Text Size
    const THEME_KEY = window.Cadence.dataStore.THEME_KEY;
    const TEXTSIZE_KEY = window.Cadence.dataStore.TEXTSIZE_KEY;
    getUI().applyTheme(localStorage.getItem(THEME_KEY) || 'light');
    getUI().applyTextSize(localStorage.getItem(TEXTSIZE_KEY) || 'normal');

    // 6. Bind Navigation Tabs
    initTabs();

    // 7. Bind All Modal Forms & Global Controls
    bindEventHandlers();

    // 8. Bind FoG Metronome & Cueing
    getCueing().initCueingBindings();

    // 9. Bind Exergame Listener
    getExergame().initExergameListener();

    // 10. Initial Render
    getUI().renderAll();

    // 11. Start Clock Animation Loop
    (function clockLoop() {
      getUI().updateClock();
      requestAnimationFrame(clockLoop);
    })();

    // 12. Periodic Lifecycle Background Tasks
    setInterval(() => {
      try { getMeds().checkAlarm(); } catch (e) {}
      try { getMeds().checkPreDoseReminders(); } catch (e) {}
    }, 4000);

    setInterval(() => {
      try { getMeds().checkMissedDoses(); } catch (e) {}
      try { checkMealNudges(); } catch (e) {}
      try { getUI().checkProteinConflictNudge(); } catch (e) {}
    }, 30000);

    setTimeout(showMorningSleepPopup, 2000);
  }

  function initTabs() {
    const tabDashboard = document.getElementById('tabDashboard');
    const tabAnalytics = document.getElementById('tabAnalytics');
    const tabFingerGym = document.getElementById('tabFingerGym');
    const tabVoiceTherapy = document.getElementById('tabVoiceTherapy');
    const tabSettings = document.getElementById('tabSettings');
    const btnHeaderSettings = document.getElementById('btnHeaderSettings');

    const dashboardPanel = document.getElementById('dashboardPanel');
    const analyticsPanel = document.getElementById('analyticsPanel');
    const fingerGymPanel = document.getElementById('fingerGymPanel');
    const voiceTherapyPanel = document.getElementById('voiceTherapyPanel');
    const settingsPanel = document.getElementById('settingsPanel');

    function switchTab(tabId) {
      [tabDashboard, tabAnalytics, tabFingerGym, tabVoiceTherapy, tabSettings].forEach(t => {
        if (t) t.setAttribute('aria-selected', 'false');
      });
      [dashboardPanel, analyticsPanel, fingerGymPanel, voiceTherapyPanel, settingsPanel].forEach(p => {
        if (p) p.classList.add('hidden');
      });

      if (tabId !== 'fingerGym') {
        getFingerGym().stopFingerGymTracker();
      }

      if (tabId === 'dashboard') {
        tabDashboard?.setAttribute('aria-selected', 'true');
        dashboardPanel?.classList.remove('hidden');
        getUI().renderAll();
      } else if (tabId === 'analytics') {
        tabAnalytics?.setAttribute('aria-selected', 'true');
        analyticsPanel?.classList.remove('hidden');
        getAnalytics().renderInsightsTab();
      } else if (tabId === 'fingerGym') {
        tabFingerGym?.setAttribute('aria-selected', 'true');
        fingerGymPanel?.classList.remove('hidden');
        getFingerGym().initFingerGymTab();
        getFingerGym().renderFingerGymHistory();
      } else if (tabId === 'voiceTherapy') {
        tabVoiceTherapy?.setAttribute('aria-selected', 'true');
        voiceTherapyPanel?.classList.remove('hidden');
        getVoice().renderVoiceHistory();
      } else if (tabId === 'settings') {
        tabSettings?.setAttribute('aria-selected', 'true');
        settingsPanel?.classList.remove('hidden');
        syncSettingsInputs();
      }
      getAudio().playSound('click');
    }

    tabDashboard?.addEventListener('click', () => switchTab('dashboard'));
    tabAnalytics?.addEventListener('click', () => switchTab('analytics'));
    tabFingerGym?.addEventListener('click', () => switchTab('fingerGym'));
    tabVoiceTherapy?.addEventListener('click', () => switchTab('voiceTherapy'));
    tabSettings?.addEventListener('click', () => switchTab('settings'));
    btnHeaderSettings?.addEventListener('click', () => switchTab('settings'));
  }

  function bindEventHandlers() {
    // Audio Activation on first user gesture
    document.addEventListener('click', () => getAudio().ensureAudio(), { once: true });
    document.addEventListener('keydown', () => getAudio().ensureAudio(), { once: true });

    // Theme & Text Size Buttons
    document.querySelectorAll('.theme-group button').forEach(b => {
      b.addEventListener('click', () => {
        getUI().applyTheme(b.dataset.theme);
        getAudio().playSound('click');
      });
    });
    document.querySelectorAll('.textsize-group button').forEach(b => {
      b.addEventListener('click', () => {
        getUI().applyTextSize(b.dataset.size);
        getAudio().playSound('click');
      });
    });

    // Consent Gate
    document.getElementById('consentCheck')?.addEventListener('change', e => {
      const btn = document.getElementById('consentContinueBtn');
      if (btn) btn.disabled = !e.target.checked;
    });
    document.getElementById('consentContinueBtn')?.addEventListener('click', () => {
      setConsent(true);
      document.getElementById('consentGate')?.classList.add('hidden');
    });

    // Alarm Gate Actions
    document.getElementById('alarmTakenBtn')?.addEventListener('click', () => {
      const d = getMeds().findDueOccurrence();
      if (d) getMeds().logDoseTaken(d.med.id, d.time);
      getMeds().closeAlarmGate();
    });
    document.getElementById('alarmSnoozeBtn')?.addEventListener('click', () => {
      const d = getMeds().findDueOccurrence();
      const state = getState();
      if (d) {
        if (!state.snoozeUntil) state.snoozeUntil = {};
        state.snoozeUntil[d.key] = Date.now() + 1800000;
        saveState();
      }
      getMeds().closeAlarmGate();
      getUI().renderAll();
    });
    document.getElementById('alarmSkipBtn')?.addEventListener('click', () => {
      const d = getMeds().findDueOccurrence();
      const state = getState();
      const { uid, todayStr } = getHelpers();
      if (d) {
        if (!state.medSkips) state.medSkips = [];
        state.medSkips.push({ id: uid(), medId: d.med.id, time: d.time, date: todayStr() });
        saveState();
      }
      getMeds().closeAlarmGate();
      getUI().renderAll();
    });

    // Motor State Tracker
    document.getElementById('btnStateOn')?.addEventListener('click', () => logMotorState('ON'));
    document.getElementById('btnStateDys')?.addEventListener('click', () => logMotorState('ON_DYSKINESIA'));
    document.getElementById('btnStateOff')?.addEventListener('click', () => logMotorState('OFF'));

    // Quick Log Panels
    document.querySelectorAll('.log-panel').forEach(p => {
      p.addEventListener('click', () => {
        getAudio().playSound('click');
        const t = p.dataset.log;
        if (t === 'sleep') openSleepModal();
        else if (t === 'symptoms') openSymptomModal();
        else if (t === 'gait') openGaitModal();
        else openActivityLog(t);
      });
    });

    // Media Recorders & Photos
    getModals().initRecorder('sxVoiceBtn', 'sxVoicePlayer', { set value(v) { sxVoiceData = v; }, get value() { return sxVoiceData; } });
    getModals().initPhoto('sxPhotoBtn', 'sxPhotoInput', 'sxPhotoPreview', { set value(v) { sxPhotoData = v; }, get value() { return sxPhotoData; } });
    getModals().initRecorder('logVoiceBtn', 'logVoicePlayer', { set value(v) { logVoiceData = v; }, get value() { return logVoiceData; } });

    // Symptom Modal Bindings
    document.querySelectorAll('#symptomWheel .sx-wheel-btn').forEach(b => {
      b.addEventListener('click', function() {
        const checked = this.getAttribute('aria-checked') === 'true';
        this.setAttribute('aria-checked', checked ? 'false' : 'true');
        this.classList.toggle('selected', !checked);
        const sx = this.dataset.symptom;
        if (!checked) {
          selectedSymptoms.push(sx);
          if (sx === 'Other') {
            const wrap = document.getElementById('sxOtherWrap');
            if (wrap) wrap.style.display = 'block';
          }
        } else {
          selectedSymptoms = selectedSymptoms.filter(s => s !== sx);
          if (sx === 'Other') {
            const wrap = document.getElementById('sxOtherWrap');
            if (wrap) wrap.style.display = 'none';
          }
        }
        const countEl = document.getElementById('sxCount');
        if (countEl) countEl.textContent = `${selectedSymptoms.length} selected`;
      });
    });

    document.querySelectorAll('#sevPicker .sev-btn').forEach(b => {
      b.addEventListener('click', function() {
        document.querySelectorAll('#sevPicker .sev-btn').forEach(x => {
          x.classList.remove('selected');
          x.setAttribute('aria-checked', 'false');
        });
        this.classList.add('selected');
        this.setAttribute('aria-checked', 'true');
        selectedSev = Number(this.dataset.sev);
      });
    });

    document.querySelectorAll('#bodyPicker .body-btn').forEach(b => {
      b.addEventListener('click', function() {
        const checked = this.getAttribute('aria-checked') === 'true';
        this.setAttribute('aria-checked', checked ? 'false' : 'true');
        this.classList.toggle('selected', !checked);
        const part = this.dataset.part;
        if (!checked) selectedBody.push(part);
        else selectedBody = selectedBody.filter(p => p !== part);
      });
    });

    document.getElementById('addSxBtn')?.addEventListener('click', handleSaveSymptoms);
    document.getElementById('closeSxModal')?.addEventListener('click', () => getModals().closeModal('sxModal'));

    // Quick Log Modal Bindings
    document.getElementById('logType')?.addEventListener('change', updateLogOptions);
    document.querySelectorAll('.log-option-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        const on = this.getAttribute('aria-checked') === 'true';
        this.setAttribute('aria-checked', on ? 'false' : 'true');
        this.classList.toggle('selected', !on);
      });
    });

    document.querySelectorAll('#mealTypePicker [data-meal]').forEach(b => {
      b.addEventListener('click', function() {
        document.querySelectorAll('#mealTypePicker [data-meal]').forEach(x => {
          x.classList.remove('primary');
          x.setAttribute('aria-checked', 'false');
        });
        this.classList.add('primary');
        this.setAttribute('aria-checked', 'true');
        selectedMealType = this.dataset.meal;
      });
    });

    document.querySelectorAll('#drinkTypePicker [data-drink]').forEach(b => {
      b.addEventListener('click', function() {
        document.querySelectorAll('#drinkTypePicker [data-drink]').forEach(x => {
          x.classList.remove('primary');
          x.setAttribute('aria-checked', 'false');
        });
        this.classList.add('primary');
        this.setAttribute('aria-checked', 'true');
        selectedDrinkType = this.dataset.drink;
      });
    });

    document.getElementById('addLogBtn')?.addEventListener('click', handleSaveLog);
    document.getElementById('closeLogModal')?.addEventListener('click', () => getModals().closeModal('logModal'));

    // Sleep Modal Bindings
    document.querySelectorAll('#sleepModalStars .sleep-star').forEach(el => {
      el.addEventListener('click', () => {
        const r = Number(el.dataset.s);
        window._sleepRating = r;
        document.querySelectorAll('#sleepModalStars .sleep-star').forEach(s => {
          const on = Number(s.dataset.s) <= r;
          s.textContent = on ? '★' : '☆';
          s.style.color = on ? 'var(--accent)' : '';
        });
      });
    });
    document.getElementById('addSleepBtn')?.addEventListener('click', handleSaveSleep);
    document.getElementById('closeSleepModal')?.addEventListener('click', () => getModals().closeModal('sleepModal'));

    // Gait Modal Bindings
    document.querySelectorAll('#gaitTypePicker [data-gait]').forEach(b => {
      b.addEventListener('click', function() {
        document.querySelectorAll('#gaitTypePicker [data-gait]').forEach(x => x.classList.remove('primary'));
        this.classList.add('primary');
        selectedGaitType = this.dataset.gait;
      });
    });
    document.getElementById('gaitSeverity')?.addEventListener('input', e => {
      const emojis = ['😌', '🙂', '😟', '😢', '😭'];
      const valEl = document.getElementById('gaitSevVal');
      if (valEl) valEl.textContent = emojis[e.target.value - 1] || e.target.value;
    });
    document.getElementById('addGaitBtn')?.addEventListener('click', handleSaveGait);
    document.getElementById('closeGaitModal')?.addEventListener('click', () => getModals().closeModal('gaitModal'));

    // Medication Add Modal
    document.getElementById('openMedModalBtn')?.addEventListener('click', () => {
      const title = document.getElementById('medTitle');
      if (title) title.textContent = 'Add medication';
      document.getElementById('medName').value = '';
      document.getElementById('medDose').value = '';
      document.getElementById('medTime').value = '08:00';
      document.getElementById('medInterval').value = 4;
      document.getElementById('medCount').value = 4;
      getModals().openModal('medModal');
    });
    document.getElementById('addMedBtn')?.addEventListener('click', handleSaveMed);
    document.getElementById('closeMedModal')?.addEventListener('click', () => getModals().closeModal('medModal'));

    // View/Edit Entry Modal
    document.getElementById('saveEditBtn')?.addEventListener('click', () => getUI().saveEditedEntry());
    document.getElementById('deleteEntryBtn')?.addEventListener('click', () => getUI().deleteCurrentEntry());
    document.getElementById('closeViewModal')?.addEventListener('click', () => getModals().closeModal('viewEntryModal'));

    // Past Day History Modal & Controls (Integrated into Top Time/Date Banner)
    const handleOpenHistory = () => {
      getAudio().playSound('click');
      getModals().openModal('prevEntriesModal');
      getUI().renderHistoryView();
    };

    document.addEventListener('click', e => {
      const btn = e.target.closest('#openHistoryModalBtn, .btn-chrono-history, .btn-prev-entries');
      if (btn) {
        handleOpenHistory();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const btn = e.target.closest('#openHistoryModalBtn, .btn-chrono-history, .btn-prev-entries');
        if (btn) {
          e.preventDefault();
          handleOpenHistory();
        }
      }
    });

    document.getElementById('closeHistoryModalBtn')?.addEventListener('click', () => {
      getModals().closeModal('prevEntriesModal');
    });

    document.getElementById('histPrevDayBtn')?.addEventListener('click', () => {
      getAudio().playSound('click');
      getUI().stepHistoryDate(-1);
    });
    document.getElementById('histNextDayBtn')?.addEventListener('click', () => {
      getAudio().playSound('click');
      getUI().stepHistoryDate(1);
    });
    document.getElementById('histDatePicker')?.addEventListener('change', function() {
      if (this.value) {
        getAudio().playSound('click');
        getUI().setSelectedHistoryDate(this.value);
      }
    });
    document.getElementById('histYesterdayQuickBtn')?.addEventListener('click', () => {
      getAudio().playSound('click');
      getUI().setSelectedHistoryDate(getHelpers().getPastDateString(1));
    });

    // Clinical Summary & Medical ID
    document.getElementById('doctorReportBtn')?.addEventListener('click', () => {
      getAudio().playSound('click');
      getUI().renderDoctorReport();
    });
    document.getElementById('printReportBtn')?.addEventListener('click', () => window.print());
    document.getElementById('closeDoctorModal')?.addEventListener('click', () => getModals().closeModal('doctorModal'));

    document.getElementById('medicalIdBtn')?.addEventListener('click', openMedicalIdModal);
    document.getElementById('saveMedicalIdBtn')?.addEventListener('click', handleSaveMedicalId);
    document.getElementById('printMedIdBtn')?.addEventListener('click', handlePrintMedicalId);
    document.getElementById('closeMedicalIdModal')?.addEventListener('click', () => getModals().closeModal('medicalIdModal'));

    // Footer Actions
    document.getElementById('exportDataBtn')?.addEventListener('click', exportDataAsJSON);
    document.getElementById('importDataBtn')?.addEventListener('click', () => {
      document.getElementById('importFileInput')?.click();
    });
    document.getElementById('importFileInput')?.addEventListener('change', function() {
      if (!this.files || !this.files[0]) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          importDataFromJSON(e.target.result);
          getUI().renderAll();
          getModals().showToast('Data imported successfully!');
        } catch (err) {
          getModals().showToast('Invalid JSON file format.');
        }
      };
      reader.readAsText(this.files[0]);
      this.value = '';
    });

    document.getElementById('clearDataBtn')?.addEventListener('click', () => {
      if (!confirm('🗑️ Permanently delete ALL health data? (GDPR Art. 17 — Right to erasure)\n\nThis cannot be undone.')) return;
      clearAllData();
      document.getElementById('consentGate')?.classList.remove('hidden');
      getUI().renderAll();
      getModals().showToast('All data erased');
    });

    document.getElementById('withdrawConsentBtn')?.addEventListener('click', () => {
      if (!confirm('⚠️ Withdraw consent under GDPR Art. 7(3)?\n\nThis permanently deletes ALL your health data.')) return;
      clearAllData();
      document.getElementById('consentGate')?.classList.remove('hidden');
      getUI().renderAll();
      getModals().showToast('Consent withdrawn — all data erased');
    });

    document.getElementById('openPrivacyLink')?.addEventListener('click', () => {
      getModals().openModal('privacyModal');
    });
    document.getElementById('closePrivacyModalBtn')?.addEventListener('click', () => {
      getModals().closeModal('privacyModal');
    });
    document.getElementById('closePrivacyModalTopBtn')?.addEventListener('click', () => {
      getModals().closeModal('privacyModal');
    });
    document.getElementById('settingsPrivacyModalBtn')?.addEventListener('click', () => {
      getModals().openModal('privacyModal');
    });

    // Habit Settings Editor
    document.getElementById('toggleHabitEditBtn')?.addEventListener('click', () => {
      const panel = document.getElementById('habitEditPanel');
      if (!panel) return;
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.classList.remove('hidden');
        getHabits().renderHabitEditForm();
      } else {
        panel.classList.add('hidden');
      }
    });
    document.getElementById('closeHabitEditBtn')?.addEventListener('click', () => {
      document.getElementById('habitEditPanel')?.classList.add('hidden');
    });
    document.getElementById('addExerciseFactorBtn')?.addEventListener('click', () => getHabits().addHabitFactor('exercise'));
    document.getElementById('addMealFactorBtn')?.addEventListener('click', () => getHabits().addHabitFactor('meal'));
    document.getElementById('saveHabitSettingsBtn')?.addEventListener('click', () => getHabits().saveHabitSettingsForm());
    document.getElementById('resetHabitDefaultsBtn')?.addEventListener('click', () => getHabits().resetHabitSettingsDefaults());

    // Generate Demo Data
    document.getElementById('generateDemoDataBtn')?.addEventListener('click', () => {
      generate7DayDemoData();
      getAudio().playSound('success');
      getModals().showToast('7-Day clinical dataset generated!');
      getUI().renderAll();
      getAnalytics().renderInsightsTab();
    });

    // Voice Therapy Tab Controls
    document.getElementById('fg-voice-btn-calibrate')?.addEventListener('click', () => getVoice().calibrateVoiceMic());
    document.getElementById('fg-voice-btn-start')?.addEventListener('click', () => getVoice().startVoiceSession());
    document.getElementById('fg-voice-btn-stop')?.addEventListener('click', () => getVoice().stopVoiceSession());
    document.querySelectorAll('.fg-voice-mode').forEach(btn => {
      btn.addEventListener('click', () => getVoice().setVoiceMode(btn.dataset.mode));
    });

    // Settings Panel Controls
    document.getElementById('btnTestSound')?.addEventListener('click', () => {
      getAudio().playSound('success');
      getModals().showToast('🔔 Chime sound played!');
    });

    const metronomeSlider = document.getElementById('settingsMetronomeBpm');
    const bpmDisplay = document.getElementById('settingsBpmDisplay');
    if (metronomeSlider && bpmDisplay) {
      metronomeSlider.addEventListener('input', () => {
        bpmDisplay.textContent = metronomeSlider.value;
      });
    }

    document.getElementById('btnSaveSettingsLimits')?.addEventListener('click', () => {
      const state = getState();
      const exerVal = parseInt(document.getElementById('settingsExerLimitInput')?.value || '3', 10);
      const mealVal = parseInt(document.getElementById('settingsMealLimitInput')?.value || '3', 10);
      state.exerciseTargetLimit = Math.max(1, Math.min(10, exerVal));
      state.mealTargetLimit = Math.max(1, Math.min(10, mealVal));
      saveState();
      getHabits().syncHabitsWithActivityOrMeal('exercise');
      getHabits().syncHabitsWithActivityOrMeal('meal');
      getUI().renderAll();
      getAudio().playSound('success');
      getModals().showToast('✅ Daily goal limits saved!');
    });

    document.getElementById('settingsDoctorReportBtn')?.addEventListener('click', () => {
      document.getElementById('doctorReportBtn')?.click();
    });
    document.getElementById('settingsMedicalIdBtn')?.addEventListener('click', () => {
      document.getElementById('medicalIdBtn')?.click();
    });
    document.getElementById('settingsExportDataBtn')?.addEventListener('click', () => {
      document.getElementById('exportDataBtn')?.click();
    });
    document.getElementById('settingsImportDataBtn')?.addEventListener('click', () => {
      document.getElementById('importDataBtn')?.click();
    });
    document.getElementById('settingsDemoDataBtn')?.addEventListener('click', () => {
      document.getElementById('generateDemoDataBtn')?.click();
    });
    document.getElementById('settingsClearDataBtn')?.addEventListener('click', () => {
      document.getElementById('clearDataBtn')?.click();
    });

    // Global Keyboard Shortcuts for Quick Logging
    document.addEventListener('keydown', (e) => {
      // Escape to close any open modal
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (openModal) {
          getModals().closeModal(openModal.id);
          e.preventDefault();
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 's') {
          e.preventDefault();
          openSymptomModal();
        } else if (k === 'm') {
          e.preventDefault();
          openActivityLog('food');
        } else if (k === 'd') {
          e.preventDefault();
          openActivityLog('drink');
        } else if (k === 'e') {
          e.preventDefault();
          openActivityLog('exercise');
        } else if (k === 'g') {
          e.preventDefault();
          openGaitModal();
        } else if (k === 'k') {
          e.preventDefault();
          document.getElementById('openMedModalBtn')?.click();
        }
      }
    });
  }

  function syncSettingsInputs() {
    const state = getState();
    const exerInput = document.getElementById('settingsExerLimitInput');
    const mealInput = document.getElementById('settingsMealLimitInput');
    if (exerInput) exerInput.value = state.exerciseTargetLimit || 3;
    if (mealInput) mealInput.value = state.mealTargetLimit || 3;
  }

  function logMotorState(stateName) {
    const state = getState();
    const { uid, nowHM, todayStr } = getHelpers();
    const logId = uid();
    state.onOffLogs.unshift({
      id: logId,
      state: stateName,
      time: nowHM(),
      date: todayStr()
    });
    saveState();
    getUI().renderAll();
    getHabits().bumpRhythmStreak();
    getAudio().playSound('success');
    getModals().showUndoToast(`Motor state logged: ${stateName}`, () => {
      const s = getState();
      s.onOffLogs = (s.onOffLogs || []).filter(x => x.id !== logId);
      saveState();
      getUI().renderAll();
    });
  }

  function openSymptomModal() {
    const { nowHM } = getHelpers();
    document.getElementById('sxTime').value = nowHM();
    document.getElementById('sxNotes').value = '';
    document.getElementById('sxOtherInput').value = '';
    const wrap = document.getElementById('sxOtherWrap');
    if (wrap) wrap.style.display = 'none';
    document.querySelectorAll('#symptomWheel .sx-wheel-btn').forEach(x => {
      x.classList.remove('selected');
      x.setAttribute('aria-checked', 'false');
    });
    document.querySelectorAll('#bodyPicker .body-btn').forEach(x => {
      x.classList.remove('selected');
      x.setAttribute('aria-checked', 'false');
    });
    document.querySelectorAll('#sevPicker .sev-btn').forEach(x => {
      x.classList.remove('selected');
      x.setAttribute('aria-checked', 'false');
    });
    selectedSymptoms = [];
    selectedBody = [];
    selectedSev = 3;
    const countEl = document.getElementById('sxCount');
    if (countEl) countEl.textContent = '0 selected';
    document.getElementById('sxPhotoPreview').innerHTML = '';
    document.getElementById('sxVoicePlayer').innerHTML = '';
    document.getElementById('sxVoicePlayer').classList.add('hidden');
    sxVoiceData = '';
    sxPhotoData = '';
    getModals().openModal('sxModal');
  }

  function handleSaveSymptoms() {
    const btn = document.getElementById('addSxBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    try {
      const state = getState();
      const { uid, nowHM, todayStr } = getHelpers();
      const names = [...selectedSymptoms];
      const other = document.getElementById('sxOtherInput').value.trim();
      if (other) names.push(other);
      if (!names.length) {
        alert('Please select at least one symptom.');
        return;
      }
      const time = document.getElementById('sxTime').value || nowHM();
      const notes = document.getElementById('sxNotes').value.trim();
      const newIds = [];

      names.forEach(name => {
        const id = uid();
        newIds.push(id);
        state.symptoms.unshift({
          id,
          name,
          time,
          date: todayStr(),
          severity: selectedSev,
          notes,
          bodyLocation: selectedBody.join(', '),
          voiceMemo: sxVoiceData || '',
          photo: sxPhotoData || ''
        });
      });

      saveState();
      getModals().closeModal('sxModal');
      getUI().renderAll();
      getAudio().playSound('success');
      getModals().showUndoToast('Symptom logged!', () => {
        const s = getState();
        s.symptoms = (s.symptoms || []).filter(x => !newIds.includes(x.id));
        saveState();
        getUI().renderAll();
      });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save symptoms'; }
    }
  }

  function openActivityLog(type) {
    const { nowHM } = getHelpers();
    const tm = { exercise: 'activity', food: 'meal', drink: 'drink' };
    const t = tm[type] || 'activity';
    document.getElementById('logType').value = t;
    document.getElementById('logDetail').value = '';
    document.getElementById('logTime').value = nowHM();
    document.getElementById('logNotes').value = '';
    document.getElementById('logPhotoPreview').innerHTML = '';
    document.getElementById('logVoicePlayer').innerHTML = '';
    document.getElementById('logVoicePlayer').classList.add('hidden');
    document.querySelectorAll('.log-option-chip').forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-checked', 'false');
    });
    updateLogOptions();
    const titles = { exercise: 'Log exercise / activity', food: 'Log meal', drink: 'Log drink' };
    const titleEl = document.getElementById('logModalTitle');
    if (titleEl) titleEl.textContent = titles[type] || 'Log entry';
    getModals().openModal('logModal');
  }

  function updateLogOptions() {
    const t = document.getElementById('logType').value;
    document.getElementById('drinkOptions')?.classList.toggle('visible', t === 'drink');
    document.getElementById('mealOptions')?.classList.toggle('visible', t === 'meal');
    const mealField = document.getElementById('mealTypeField');
    const detailField = document.getElementById('detailField');
    if (mealField) mealField.style.display = t === 'meal' ? 'block' : 'none';
    if (detailField) detailField.style.display = t === 'meal' ? 'none' : 'block';
  }

  function handleSaveLog() {
    const btn = document.getElementById('addLogBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    try {
      const state = getState();
      const { uid, nowHM, todayStr } = getHelpers();
      const type = document.getElementById('logType').value;
      const time = document.getElementById('logTime').value || nowHM();
      const notes = document.getElementById('logNotes').value.trim();
      let detail = '';

      if (type === 'meal') {
        if (!selectedMealType) { alert('Select a meal type.'); return; }
        detail = selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1);
      } else if (type === 'drink') {
        if (!selectedDrinkType) { alert('Select a drink type.'); return; }
        detail = selectedDrinkType.charAt(0).toUpperCase() + selectedDrinkType.slice(1);
      } else {
        detail = document.getElementById('logDetail').value.trim();
        if (!detail) { alert('Please describe what you did.'); return; }
      }

      const opts = [...document.querySelectorAll('.log-option-chip.selected')].map(c => c.dataset.opt);
      const logId = uid();
      state.logs.unshift({
        id: logId,
        type,
        detail,
        time,
        date: todayStr(),
        notes,
        voiceMemo: logVoiceData || '',
        options: opts.length ? opts : undefined,
        mealType: selectedMealType || undefined,
        drinkType: selectedDrinkType || undefined
      });

      getHabits().syncHabitsWithActivityOrMeal(type, detail);
      saveState();
      getModals().closeModal('logModal');
      getUI().renderAll();
      getAudio().playSound('success');
      getModals().showUndoToast(`${detail} logged!`, () => {
        const s = getState();
        s.logs = (s.logs || []).filter(x => x.id !== logId);
        saveState();
        getUI().renderAll();
      });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save entry'; }
    }
  }

  function openSleepModal() {
    const state = getState();
    const { todayStr } = getHelpers();
    const ex = (state.sleep || []).find(s => s.date === todayStr() && !s.dismissed);
    const r = ex ? ex.rating : 0;
    document.getElementById('sleepNotes').value = ex ? (ex.notes || '') : '';
    window._sleepRating = r;
    
    document.querySelectorAll('#sleepModalStars .sleep-star').forEach(s => {
      const starVal = Number(s.dataset.s);
      const on = starVal <= r;
      s.textContent = on ? '★' : '☆';
      s.style.color = on ? 'var(--accent)' : '';
    });
    getModals().openModal('sleepModal');
  }

  function handleSaveSleep() {
    const btn = document.getElementById('addSleepBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    try {
      const state = getState();
      const { uid, todayStr } = getHelpers();
      const r = window._sleepRating || 0;
      if (!r) { alert('Select a rating.'); return; }
      const notes = document.getElementById('sleepNotes').value.trim();
      const exIndex = (state.sleep || []).findIndex(s => s.date === todayStr() && !s.dismissed);
      const prevEntry = exIndex >= 0 ? { ...state.sleep[exIndex] } : null;
      const sleepId = uid();

      if (exIndex >= 0) {
        state.sleep[exIndex].rating = r;
        state.sleep[exIndex].notes = notes;
      } else {
        state.sleep.unshift({ id: sleepId, date: todayStr(), rating: r, notes });
      }
      saveState();
      getModals().closeModal('sleepModal');
      getUI().renderAll();
      getAudio().playSound('success');
      getModals().showUndoToast('Sleep rating saved!', () => {
        const s = getState();
        if (prevEntry) {
          const idx = (s.sleep || []).findIndex(x => x.date === todayStr() && !x.dismissed);
          if (idx >= 0) s.sleep[idx] = prevEntry;
        } else {
          s.sleep = (s.sleep || []).filter(x => x.id !== sleepId);
        }
        saveState();
        getUI().renderAll();
      });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save rating'; }
    }
  }

  function openGaitModal() {
    const { nowHM } = getHelpers();
    document.getElementById('gaitTime').value = nowHM();
    document.getElementById('gaitLocation').value = '';
    document.getElementById('gaitActivity').value = '';
    document.getElementById('gaitNotes').value = '';
    document.getElementById('gaitSeverity').value = 3;
    document.getElementById('gaitSevVal').textContent = '😟';
    document.querySelectorAll('#gaitTypePicker [data-gait]').forEach(b => b.classList.remove('primary'));
    selectedGaitType = null;
    getModals().openModal('gaitModal');
  }

  function handleSaveGait() {
    if (!selectedGaitType) { alert('Select what happened.'); return; }
    const btn = document.getElementById('addGaitBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    try {
      const state = getState();
      const { uid, nowHM, todayStr } = getHelpers();
      const location = document.getElementById('gaitLocation').value.trim();
      const activity = document.getElementById('gaitActivity').value.trim();
      const severity = Number(document.getElementById('gaitSeverity').value);
      const time = document.getElementById('gaitTime').value || nowHM();
      const notes = document.getElementById('gaitNotes').value.trim();
      const gaitId = uid();

      state.gait.unshift({
        id: gaitId,
        type: selectedGaitType,
        location,
        activity,
        severity,
        time,
        date: todayStr(),
        notes
      });

      getHabits().syncHabitsWithActivityOrMeal('gait', activity || selectedGaitType);
      saveState();
      getModals().closeModal('gaitModal');
      getUI().renderAll();
      getAudio().playSound('success');
      getModals().showUndoToast(`${selectedGaitType} logged!`, () => {
        const s = getState();
        s.gait = (s.gait || []).filter(x => x.id !== gaitId);
        saveState();
        getUI().renderAll();
      });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save gait event'; }
    }
  }

  function handleSaveMed() {
    const btn = document.getElementById('addMedBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    try {
      const state = getState();
      const { uid } = getHelpers();
      const n = document.getElementById('medName').value.trim();
      const d = document.getElementById('medDose').value.trim();
      const f = document.getElementById('medTime').value;
      const i = parseFloat(document.getElementById('medInterval').value);
      const c = parseInt(document.getElementById('medCount').value);
      if (!n || !f || !i || !c) { alert('Fill all fields.'); return; }

      const times = getMeds().genTimes(f, i, c);
      state.meds.push({ id: uid(), name: n, dose: d, times, first: f, interval: i, count: c });
      saveState();
      getModals().closeModal('medModal');
      getUI().renderAll();
      getAudio().playSound('success');
      getModals().showToast('Medication saved!');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save schedule'; }
    }
  }

  function openMedicalIdModal() {
    const state = getState();
    const id = state.medicalId || {};
    document.getElementById('medIdPatientName').value = id.patientName || '';
    document.getElementById('medIdEmergencyContact').value = id.emergencyContact || '';
    document.getElementById('medIdNeurologist').value = id.neurologist || '';
    document.getElementById('medIdCriticalNotes').value = id.notes || '';
    getModals().openModal('medicalIdModal');
  }

  function handleSaveMedicalId() {
    const state = getState();
    state.medicalId = {
      patientName: document.getElementById('medIdPatientName').value.trim(),
      emergencyContact: document.getElementById('medIdEmergencyContact').value.trim(),
      neurologist: document.getElementById('medIdNeurologist').value.trim(),
      notes: document.getElementById('medIdCriticalNotes').value.trim()
    };
    saveState();
    getModals().closeModal('medicalIdModal');
    getAudio().playSound('success');
    getModals().showToast('Medical ID saved!');
  }

  function handlePrintMedicalId() {
    const state = getState();
    const m = state.medicalId || {};
    const name = document.getElementById('medIdPatientName')?.value.trim() || m.patientName || '—';
    const contact = document.getElementById('medIdEmergencyContact')?.value.trim() || m.emergencyContact || '—';
    const neuro = document.getElementById('medIdNeurologist')?.value.trim() || m.neurologist || '—';
    const notes = document.getElementById('medIdCriticalNotes')?.value.trim() || m.notes || '—';
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) { getModals().showToast('Allow pop-ups to print the card'); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>Emergency Medical ID</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;max-width:400px;margin:0 auto;color:#111}
        h1{font-size:1.4rem;border-bottom:3px solid #d94a3a;padding-bottom:8px}
        .row{margin:14px 0}.lbl{font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#666;font-weight:700}
        .val{font-size:1.15rem;font-weight:600;margin-top:2px}
        .alert{background:#fff5f5;border:2px solid #d94a3a;border-radius:10px;padding:12px;margin-top:18px;font-size:.95rem}
        @media print{body{padding:12px}}
      </style></head><body>
      <h1>🆘 EMERGENCY MEDICAL ID</h1>
      <div class="row"><div class="lbl">Patient</div><div class="val">${name.replace(/</g,'')}</div></div>
      <div class="row"><div class="lbl">Emergency contact</div><div class="val">${contact.replace(/</g,'')}</div></div>
      <div class="row"><div class="lbl">Neurologist / care team</div><div class="val">${neuro.replace(/</g,'')}</div></div>
      <div class="alert"><strong>Critical notes</strong><br>${notes.replace(/</g,'').replace(/\n/g,'<br>')}</div>
      <p style="margin-top:24px;font-size:.8rem;color:#666">Generated by Cadence · Keep with wallet or on fridge</p>
      <script>window.onload=()=>window.print()<\/script>
      </body></html>`);
    w.document.close();
  }

  function showMorningSleepPopup() {
    const state = getState();
    const { isToday, uid, todayStr } = getHelpers();
    const now = new Date();
    if (now.getHours() >= 11) return;
    if ((state.sleep || []).some(s => isToday(s.date))) return;
    const popup = document.getElementById('sleepPopup');
    if (popup) popup.classList.remove('hidden');

    document.querySelectorAll('.sleep-popup-star').forEach(el => {
      el.addEventListener('click', () => {
        const r = Number(el.dataset.s);
        window._sleepPopupRating = r;
        document.querySelectorAll('.sleep-popup-star').forEach(s => {
          const on = Number(s.dataset.s) <= r;
          s.textContent = on ? '★' : '☆';
          s.className = 'sleep-popup-star' + (on ? ' on' : '');
        });
        const saveBtn = document.getElementById('sleepPopupSaveBtn');
        if (saveBtn) saveBtn.disabled = false;
      });
    });

    document.getElementById('sleepPopupSaveBtn')?.addEventListener('click', () => {
      const r = window._sleepPopupRating || 0;
      if (!r) return;
      state.sleep.unshift({ id: uid(), date: todayStr(), rating: r });
      saveState();
      document.getElementById('sleepPopup')?.classList.add('hidden');
      getUI().renderAll();
      getAudio().playSound('success');
      getModals().showToast('Sleep rating saved!');
    });

    document.getElementById('sleepPopupDismissBtn')?.addEventListener('click', () => {
      state.sleep.unshift({ id: uid(), date: todayStr(), rating: 0, dismissed: true });
      saveState();
      document.getElementById('sleepPopup')?.classList.add('hidden');
    });
  }

  function checkMealNudges() {
    const state = getState();
    const { isToday, todayStr } = getHelpers();
    const h = new Date().getHours();
    const nudges = [
      { id: 'breakfast', el: 'breakfastPopup', yesBtn: 'breakfastYesBtn', notBtn: 'breakfastNotYetBtn', start: 11, end: 13, keyword: 'breakfast' },
      { id: 'lunch', el: 'lunchPopup', yesBtn: 'lunchYesBtn', notBtn: 'lunchNotYetBtn', start: 15, end: 17, keyword: 'lunch' },
      { id: 'dinner', el: 'dinnerPopup', yesBtn: 'dinnerYesBtn', notBtn: 'dinnerNotYetBtn', start: 22, end: 23, keyword: 'dinner' }
    ];

    nudges.forEach(n => {
      const el = document.getElementById(n.el);
      if (!el) return;
      if (h < n.start || h >= n.end) { el.classList.add('hidden'); return; }
      if (state._nudgeDismissed && state._nudgeDismissed[n.id] === todayStr()) return;
      const hasMeal = (state.logs || []).some(l => isToday(l.date) && (l.type === 'meal' || l.detail?.toLowerCase().includes(n.keyword)));
      if (hasMeal) return;
      el.classList.remove('hidden');

      document.getElementById(n.yesBtn)?.addEventListener('click', () => {
        el.classList.add('hidden');
        openActivityLog('food');
      }, { once: true });
      document.getElementById(n.notBtn)?.addEventListener('click', () => {
        el.classList.add('hidden');
        if (!state._nudgeDismissed) state._nudgeDismissed = {};
        state._nudgeDismissed[n.id] = todayStr();
        saveState();
      }, { once: true });
    });
  }

  window.Cadence.main = {
    initApp,
    initTabs,
    bindEventHandlers,
    logMotorState,
    openSymptomModal,
    openActivityLog,
    openSleepModal,
    openGaitModal
  };

  // Safe bootstrap supporting both file:// protocol and DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
