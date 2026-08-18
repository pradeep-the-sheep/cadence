/**
 * Cadence · Parkinson's Daily Companion
 * exergameEngine.js - Fullscreen Exergame iframe launcher and postMessage score communication
 */

window.Cadence = window.Cadence || {};

(function() {
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
  function getFingerGym() {
    return window.Cadence.fingerGymEngine;
  }

  function launchExergame(gameType) {
    const overlay = document.getElementById('fullscreenGameOverlay');
    const iframe = document.getElementById('fullscreenGameIframe');
    if (!overlay || !iframe) return;
    
    // Pause main webcam tracker to give iframe camera access
    try { getFingerGym().stopFingerGymTracker(); } catch (e) {}
    
    if (gameType === 'boxing') {
      iframe.src = 'games/boxing.html';
    } else if (gameType === 'dino') {
      iframe.src = 'games/dino.html';
    }
    
    overlay.classList.remove('hidden');
    getModals().showToast("Launching Exergame in Fullscreen Mode!");
  }

  function exitExergame() {
    const overlay = document.getElementById('fullscreenGameOverlay');
    const iframe = document.getElementById('fullscreenGameIframe');
    if (!overlay || !iframe) return;
    
    iframe.src = 'about:blank';
    overlay.classList.add('hidden');
    
    const tab = document.getElementById('tabFingerGym');
    if (tab && tab.getAttribute('aria-selected') === 'true') {
      try { getFingerGym().startFingerGymTracker(); } catch (e) {}
    }
    getModals().showToast("Game session finished!");
  }

  function initExergameListener() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'EXERGAME_SCORE') {
        const { exercise, score, speed, consistency } = event.data;
        const { uid, todayStr, nowHM } = getHelpers();
        const state = getState();
        const record = {
          id: uid(),
          date: todayStr(),
          time: nowHM(),
          exercise: exercise || "Wii Exergame",
          speed: speed || 0,
          consistency: consistency || 0,
          score: score || 0
        };
        state.fingerGymLogs.unshift(record);
        getHabits().syncHabitsWithActivityOrMeal('activity', record.exercise);
        saveState();
        getFingerGym().renderFingerGymHistory();
        getAudio().playSound('success');
        getModals().showToast(`🏆 ${record.exercise} score saved: ${record.score} pts!`);
      }
    });

    document.getElementById('btnLaunchBoxing')?.addEventListener('click', () => launchExergame('boxing'));
    document.getElementById('btnLaunchDino')?.addEventListener('click', () => launchExergame('dino'));
    document.getElementById('btnExitFullscreenGame')?.addEventListener('click', exitExergame);

    document.addEventListener('keydown', (e) => {
      const overlay = document.getElementById('fullscreenGameOverlay');
      if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
        exitExergame();
      }
    });
  }

  window.Cadence.exergameEngine = {
    launchExergame,
    exitExergame,
    initExergameListener
  };
})();
