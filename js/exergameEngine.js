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

  const EXERCISE_LIBRARY = [
    { id: 'squats', name: 'Squats', icon: '🦵', desc: 'Hip & knee flexion; lower body strength and balance', defaultReps: 10, cueDown: 'Lower hips into squat', cueUp: 'Stand up tall!' },
    { id: 'bicep_curls', name: 'Bicep Curls', icon: '💪', desc: 'Elbow articulation; upper arm mobility & control', defaultReps: 10, cueDown: 'Curl arms up', cueUp: 'Lower with control' },
    { id: 'arm_raises', name: 'Overhead Arm Raises', icon: '🙋', desc: 'Shoulder amplitude & thoracic spine posture', defaultReps: 10, cueDown: 'Raise arms wide & high', cueUp: 'Lower arms down' },
    { id: 'shoulder_press', name: 'Shoulder Press', icon: '🏋️', desc: 'Upper extremity strength & upright posture', defaultReps: 10, cueDown: 'Press arms overhead', cueUp: 'Lower to shoulders' },
    { id: 'forward_reach', name: 'Forward Arm Reach', icon: '👐', desc: 'Large amplitude reach; combats small movements (hypometria)', defaultReps: 10, cueDown: 'Reach straight forward & wide', cueUp: 'Lower to sides' },
    { id: 'high_knees', name: 'High Knee Marches', icon: '🦿', desc: 'Hip flexion amplitude & single-leg balance', defaultReps: 10, cueDown: 'March knees high', cueUp: 'Lower foot down' },
    { id: 'side_leg_raises', name: 'Side Leg Raises', icon: '🤸', desc: 'Lateral hip abduction; improves balance & prevents falls', defaultReps: 10, cueDown: 'Lift leg outward to side', cueUp: 'Lower foot to center' },
    { id: 'torso_twists', name: 'Torso Twists', icon: '🔄', desc: 'Trunk rotation; reduces axial rigidity and spine stiffness', defaultReps: 10, cueDown: 'Rotate torso smoothly side-to-side', cueUp: 'Center posture' },
    { id: 'punches', name: 'Front Punches', icon: '🥊', desc: 'Arm reach extension, speed & bilateral coordination', defaultReps: 12, cueDown: 'Extend punches with intent', cueUp: 'Guard up!' },
    { id: 'sit_to_stand', name: 'Chair Sit-to-Stand', icon: '🪑', desc: 'Functional power & sit-to-stand daily mobility', defaultReps: 8, cueDown: 'Stand up tall', cueUp: 'Sit down gently' },
    { id: 'calf_raises', name: 'Calf Raises (Heel Lifts)', icon: '🦶', desc: 'Ankle push-off power; reduces foot dragging & shuffling', defaultReps: 12, cueDown: 'Rise onto balls of feet', cueUp: 'Lower heels down' }
  ];

  let currentWorkoutState = EXERCISE_LIBRARY.map((ex, idx) => ({
    ...ex,
    included: idx < 3,
    targetReps: ex.defaultReps
  }));

  function getWorkoutRoutine() {
    return currentWorkoutState.filter(ex => ex.included);
  }

  function renderWorkoutBuilder() {
    const grid = document.getElementById('workoutBuilderGrid');
    if (!grid) return;

    grid.innerHTML = currentWorkoutState.map(ex => {
      return `
        <div class="workout-square-tile ${ex.included ? 'included' : ''}" data-id="${ex.id}" role="button" tabindex="0" aria-pressed="${ex.included}">
          <div class="tile-check-indicator">${ex.included ? '✓' : ''}</div>
          <div class="tile-emoji">${ex.icon}</div>
          <div class="tile-name">${ex.name}</div>
          
          <div class="tile-rep-stepper">
            <button type="button" class="tile-rep-btn btn-rep-minus" data-id="${ex.id}" aria-label="Decrease reps for ${ex.name}">-</button>
            <span class="tile-rep-val">${ex.targetReps} reps</span>
            <button type="button" class="tile-rep-btn btn-rep-plus" data-id="${ex.id}" aria-label="Increase reps for ${ex.name}">+</button>
          </div>

          <!-- Hover Description Overlay -->
          <div class="tile-desc-overlay">
            <div class="tile-desc-title">${ex.icon} ${ex.name}</div>
            <div class="tile-desc-text">${ex.desc}</div>
          </div>
        </div>
      `;
    }).join('');

    // Update summary counts
    const activeEx = getWorkoutRoutine();
    const totalReps = activeEx.reduce((acc, ex) => acc + ex.targetReps, 0);
    const estMinutes = Math.max(1, Math.round(totalReps * 0.12));

    const cntEl = document.getElementById('workoutTotalExCount');
    const repsEl = document.getElementById('workoutTotalRepsCount');
    const timeEl = document.getElementById('workoutEstTime');

    if (cntEl) cntEl.textContent = `${activeEx.length} Exercise${activeEx.length === 1 ? '' : 's'}`;
    if (repsEl) repsEl.textContent = `${totalReps} Reps`;
    if (timeEl) timeEl.textContent = `~${estMinutes} mins`;

    // Clicking tile (outside stepper buttons) toggles selection
    grid.querySelectorAll('.workout-square-tile').forEach(tile => {
      tile.addEventListener('click', (e) => {
        if (e.target.closest('.tile-rep-stepper')) return;
        getAudio().playSound('click');
        const id = tile.dataset.id;
        const item = currentWorkoutState.find(x => x.id === id);
        if (item) {
          item.included = !item.included;
          saveWorkoutToStorage();
          renderWorkoutBuilder();
        }
      });

      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.tile-rep-stepper')) return;
          e.preventDefault();
          tile.click();
        }
      });
    });

    grid.querySelectorAll('.btn-rep-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        getAudio().playSound('click');
        const id = e.currentTarget.dataset.id;
        const item = currentWorkoutState.find(x => x.id === id);
        if (item && item.targetReps > 4) {
          item.targetReps = Math.max(4, item.targetReps - 2);
          saveWorkoutToStorage();
          renderWorkoutBuilder();
        }
      });
    });

    grid.querySelectorAll('.btn-rep-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        getAudio().playSound('click');
        const id = e.currentTarget.dataset.id;
        const item = currentWorkoutState.find(x => x.id === id);
        if (item && item.targetReps < 40) {
          item.targetReps = Math.min(40, item.targetReps + 2);
          saveWorkoutToStorage();
          renderWorkoutBuilder();
        }
      });
    });
  }

  function saveWorkoutToStorage() {
    try {
      const active = getWorkoutRoutine();
      localStorage.setItem('CADENCE_CURRENT_WORKOUT', JSON.stringify(active));
    } catch(e) {}
  }

  function applyWorkoutPreset(presetKey) {
    const ids = {
      mobility: ['squats', 'bicep_curls', 'arm_raises', 'torso_twists'],
      upper: ['bicep_curls', 'arm_raises', 'shoulder_press', 'forward_reach', 'punches'],
      lower: ['squats', 'high_knees', 'side_leg_raises', 'calf_raises', 'sit_to_stand'],
      full: ['squats', 'shoulder_press', 'high_knees', 'forward_reach', 'punches', 'torso_twists'],
      seated: ['bicep_curls', 'forward_reach', 'arm_raises', 'punches', 'torso_twists', 'sit_to_stand']
    };

    const targetList = ids[presetKey] || ids.mobility;
    currentWorkoutState.forEach(ex => {
      ex.included = targetList.includes(ex.id);
      ex.targetReps = ex.defaultReps;
    });

    saveWorkoutToStorage();
    renderWorkoutBuilder();
  }

  function launchExergame(gameType) {
    const overlay = document.getElementById('fullscreenGameOverlay');
    const iframe = document.getElementById('fullscreenGameIframe');
    if (!overlay || !iframe) return;
    
    // Pause main webcam tracker to give iframe camera access
    try { getFingerGym().stopFingerGymTracker(); } catch (e) {}
    
    if (gameType === 'workout') {
      saveWorkoutToStorage();
      iframe.src = 'games/workout_builder.html';
      getModals().showToast("🏋️ Launching Workout Routine in Fullscreen Mode!");
    } else if (gameType === 'boxing') {
      iframe.src = 'games/boxing.html';
      getModals().showToast("Launching Exergame in Fullscreen Mode!");
    } else if (gameType === 'dino') {
      iframe.src = 'games/dino.html';
      getModals().showToast("Launching Exergame in Fullscreen Mode!");
    } else if (gameType === 'reach') {
      iframe.src = 'games/clock_reach.html';
      getModals().showToast("Launching Exergame in Fullscreen Mode!");
    }
    
    overlay.classList.remove('hidden');
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
          exercise: exercise || "Workout Routine",
          speed: speed || 0,
          consistency: consistency || 0,
          score: score || 0
        };
        state.fingerGymLogs.unshift(record);

        // Also add an activity log to state.logs for seamless Rhythm & Doctor Report integration
        const actLog = {
          id: uid(),
          type: 'activity',
          date: todayStr(),
          time: nowHM(),
          detail: exercise || "Workout Routine",
          options: ['exercise', 'exergame'],
          score: score || 0
        };
        state.logs.unshift(actLog);

        getHabits().syncHabitsWithActivityOrMeal('activity', record.exercise);
        saveState();
        getFingerGym().renderFingerGymHistory();
        getAudio().playSound('success');
        exitExergame();
        getModals().showToast(`🏆 ${record.exercise} saved: ${record.score} pts!`);
      } else if (event.data && event.data.type === 'EXERGAME_EXIT') {
        exitExergame();
      }
    });

    document.getElementById('btnLaunchWorkoutSession')?.addEventListener('click', () => launchExergame('workout'));
    document.getElementById('btnLaunchBoxing')?.addEventListener('click', () => launchExergame('boxing'));
    document.getElementById('btnLaunchDino')?.addEventListener('click', () => launchExergame('dino'));
    document.getElementById('btnLaunchReach')?.addEventListener('click', () => launchExergame('reach'));
    document.getElementById('btnExitFullscreenGame')?.addEventListener('click', exitExergame);

    // Preset selector chips
    document.querySelectorAll('.workout-preset-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        getAudio().playSound('click');
        document.querySelectorAll('.workout-preset-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        applyWorkoutPreset(this.dataset.preset);
      });
    });

    document.getElementById('btnResetWorkoutDefaults')?.addEventListener('click', () => {
      getAudio().playSound('click');
      document.querySelectorAll('.workout-preset-chip').forEach(c => c.classList.remove('active'));
      document.querySelector('.workout-preset-chip[data-preset="mobility"]')?.classList.add('active');
      applyWorkoutPreset('mobility');
    });

    document.addEventListener('keydown', (e) => {
      const overlay = document.getElementById('fullscreenGameOverlay');
      if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
        exitExergame();
      }
    });

    // Initialize workout builder UI
    renderWorkoutBuilder();
  }

  window.Cadence.exergameEngine = {
    renderWorkoutBuilder,
    getWorkoutRoutine,
    applyWorkoutPreset,
    launchExergame,
    exitExergame,
    initExergameListener
  };
})();
