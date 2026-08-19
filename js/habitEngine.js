/**
 * Cadence · Parkinson's Daily Companion
 * habitEngine.js - Daily rhythm habit tracking, custom limits, encouragement notes & streaks
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

  function initHabitSettings() {
    const state = getState();
    if (!state.habitSettings) {
      state.habitSettings = {
        exerciseLimit: 3,
        mealLimit: 3,
        exercises: [
          { id: 'ex_1', name: 'Morning Stretch & Walk', done: false, date: '', factor: 'Mobility & Balance' },
          { id: 'ex_2', name: 'Finger Gym / Exergame', done: false, date: '', factor: 'Fine Motor Control' },
          { id: 'ex_3', name: 'Voice or Balance Drill', done: false, date: '', factor: 'Vocal / Posture Rhythm' }
        ],
        meals: [
          { id: 'ml_1', name: 'Breakfast', done: false, date: '', factor: 'Morning Nutrition' },
          { id: 'ml_2', name: 'Lunch (Protein-timed)', done: false, date: '', factor: 'Midday Energy' },
          { id: 'ml_3', name: 'Dinner', done: false, date: '', factor: 'Evening Recovery' }
        ]
      };
    }
    if (!Array.isArray(state.habitSettings.exercises)) state.habitSettings.exercises = [];
    if (!Array.isArray(state.habitSettings.meals)) state.habitSettings.meals = [];
    if (!state.habitSettings.exerciseLimit) state.habitSettings.exerciseLimit = 3;
    if (!state.habitSettings.mealLimit) state.habitSettings.mealLimit = 3;
  }

  function syncHabitsWithActivityOrMeal(type, detail) {
    initHabitSettings();
    const state = getState();
    const { todayStr } = getHelpers();
    const today = todayStr();
    const isActivity = ['activity', 'exercise', 'gait', 'freeze'].includes(type) || 
      (type && (String(type).startsWith('Voice') || String(type).startsWith('BIG') || String(type).startsWith('Finger')));
    const isMeal = ['meal', 'food', 'protein', 'drink'].includes(type);

    if (isActivity) {
      const exList = state.habitSettings.exercises || [];
      const nextTodo = exList.find(item => !item.done || item.date !== today);
      if (nextTodo) {
        nextTodo.done = true;
        nextTodo.date = today;
      }
    } else if (isMeal) {
      const mealList = state.habitSettings.meals || [];
      const nextTodo = mealList.find(item => !item.done || item.date !== today);
      if (nextTodo) {
        nextTodo.done = true;
        nextTodo.date = today;
      }
    }
    saveState();
    renderHabitTracker();
    bumpRhythmStreak();
  }

  function bumpRhythmStreak() {
    const state = getState();
    const { todayStr, getPastDateString } = getHelpers();
    const today = todayStr();
    if (typeof state.rhythmStreak !== 'number' || isNaN(state.rhythmStreak) || state.rhythmStreak < 0) {
      state.rhythmStreak = 0;
    }
    if (state.lastActiveDate === today) return;
    const yesterday = getPastDateString(1);
    if (state.lastActiveDate === yesterday) state.rhythmStreak = Math.max(1, (state.rhythmStreak || 0) + 1);
    else state.rhythmStreak = 1;
    if (state.rhythmStreak < 0) state.rhythmStreak = 0;
    state.lastActiveDate = today;
    saveState();
    const el = document.getElementById('rhythmStreak');
    if (el) el.textContent = state.rhythmStreak > 1 ? `🔥 ${state.rhythmStreak}-day rhythm` : '🌱 Day 1';
  }

  function updateExerciseEncouragementNote(doneCount, limit) {
    const noteEl = document.getElementById('smallEncourageNote');
    if (!noteEl) return;

    const remain = Math.max(0, limit - doneCount);
    let icon = '💡';
    let text = '';
    let color = 'var(--primary-dark)';

    if (doneCount === 0) {
      icon = '💡';
      text = `0/${limit} exercises done — start with a 5-min stretch or exergame!`;
      color = 'var(--primary-dark)';
    } else if (doneCount === 1 && limit > 1) {
      icon = '⚡';
      text = `1 done — great start! Do ${remain} more exercise${remain > 1 ? 's' : ''} or exergame${remain > 1 ? 's' : ''} to reach daily limit!`;
      color = '#0EA5E9';
    } else if (doneCount === 2 && limit > 2) {
      icon = '🔥';
      text = `2 done — on fire! Just ${remain} more exercise or exergame to reach your daily target!`;
      color = '#EA580C';
    } else if (doneCount < limit) {
      icon = '🚀';
      text = `${doneCount}/${limit} done — in the groove! Only ${remain} more to hit your daily target limit!`;
      color = '#8B5CF6';
    } else {
      icon = '🌟';
      text = `${doneCount}/${limit} done — limit reached! Outstanding commitment to your motor rhythm!`;
      color = 'var(--success)';
    }

    noteEl.textContent = `${icon} ${text}`;
    noteEl.style.color = color;
  }

  function renderHabitTracker() {
    initHabitSettings();
    const state = getState();
    const { isToday } = getHelpers();
    const settings = state.habitSettings;
    const exLimit = Number(settings.exerciseLimit) || 3;
    const mealLimit = Number(settings.mealLimit) || 3;

    const loggedExercises = (state.logs || []).filter(l => isToday(l.date) && ['activity', 'exercise', 'gait', 'freeze'].includes(l.type)).length;
    const loggedExergames = (state.fingerGymLogs || []).filter(r => isToday(r.date)).length;
    const manualExCount = (settings.exercises || []).filter(item => isToday(item.date) && item.done).length;
    const exerciseDoneCount = Math.max(loggedExercises + loggedExergames, manualExCount);

    const loggedMeals = (state.logs || []).filter(l => isToday(l.date) && ['meal', 'food', 'protein', 'drink'].includes(l.type)).length;
    const manualMealCount = (settings.meals || []).filter(item => isToday(item.date) && item.done).length;
    const mealDoneCount = Math.max(loggedMeals, manualMealCount);

    const exPercent = Math.min(100, Math.round((exerciseDoneCount / Math.max(1, exLimit)) * 100));
    const exCountEl = document.getElementById('exerciseSmallCount');
    const exBarEl = document.getElementById('exerciseSmallBar');
    const exPillEl = document.getElementById('exerciseSmallTracker');
    if (exCountEl) exCountEl.textContent = `${exerciseDoneCount}/${exLimit}`;
    if (exBarEl) exBarEl.style.width = `${exPercent}%`;
    if (exPillEl) {
      if (exerciseDoneCount >= exLimit) {
        exPillEl.style.borderColor = 'var(--success)';
        exPillEl.style.background = 'color-mix(in srgb, var(--success) 15%, var(--surface))';
      } else {
        exPillEl.style.borderColor = 'var(--line)';
        exPillEl.style.background = 'var(--surface)';
      }
    }

    const mealPercent = Math.min(100, Math.round((mealDoneCount / Math.max(1, mealLimit)) * 100));
    const mealCountEl = document.getElementById('mealSmallCount');
    const mealBarEl = document.getElementById('mealSmallBar');
    const mealPillEl = document.getElementById('mealSmallTracker');
    if (mealCountEl) mealCountEl.textContent = `${mealDoneCount}/${mealLimit}`;
    if (mealBarEl) mealBarEl.style.width = `${mealPercent}%`;
    if (mealPillEl) {
      if (mealDoneCount >= mealLimit) {
        mealPillEl.style.borderColor = 'var(--success)';
        mealPillEl.style.background = 'color-mix(in srgb, var(--success) 15%, var(--surface))';
      } else {
        mealPillEl.style.borderColor = 'var(--line)';
        mealPillEl.style.background = 'var(--surface)';
      }
    }

    updateExerciseEncouragementNote(exerciseDoneCount, exLimit);
  }

  function renderHabitEditForm() {
    initHabitSettings();
    const state = getState();
    const { escapeHtml } = getHelpers();
    const settings = state.habitSettings;
    const exLimitEl = document.getElementById('editExerciseLimitInput');
    const mealLimitEl = document.getElementById('editMealLimitInput');
    if (exLimitEl) exLimitEl.value = settings.exerciseLimit || 3;
    if (mealLimitEl) mealLimitEl.value = settings.mealLimit || 3;

    const exListEl = document.getElementById('editExercisesList');
    if (exListEl) {
      exListEl.innerHTML = settings.exercises.map((item, idx) => `
        <div class="habit-edit-item-row" data-type="exercise" data-idx="${idx}">
          <span style="font-weight:800;color:var(--ink-soft);width:24px;">#${idx+1}</span>
          <input type="text" value="${escapeHtml(item.name || '')}" placeholder="Exercise name..." class="edit-ex-input" aria-label="Exercise factor name ${idx+1}">
          <button type="button" class="btn-del-item" data-type="exercise" data-idx="${idx}" title="Delete factor">✕</button>
        </div>
      `).join('');
    }

    const mealListEl = document.getElementById('editMealsList');
    if (mealListEl) {
      mealListEl.innerHTML = settings.meals.map((item, idx) => `
        <div class="habit-edit-item-row" data-type="meal" data-idx="${idx}">
          <span style="font-weight:800;color:var(--ink-soft);width:24px;">#${idx+1}</span>
          <input type="text" value="${escapeHtml(item.name || '')}" placeholder="Meal name..." class="edit-meal-input" aria-label="Meal factor name ${idx+1}">
          <button type="button" class="btn-del-item" data-type="meal" data-idx="${idx}" title="Delete factor">✕</button>
        </div>
      `).join('');
    }

    document.querySelectorAll('.btn-del-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const idx = parseInt(btn.dataset.idx, 10);
        deleteHabitFactor(type, idx);
      });
    });
  }

  function deleteHabitFactor(type, idx) {
    initHabitSettings();
    const state = getState();
    const list = type === 'exercise' ? state.habitSettings.exercises : state.habitSettings.meals;
    if (list && list.length > 1) {
      list.splice(idx, 1);
      renderHabitEditForm();
    } else {
      getModals().showToast('Keep at least 1 factor in the list');
    }
  }

  function addHabitFactor(type) {
    initHabitSettings();
    const state = getState();
    const list = type === 'exercise' ? state.habitSettings.exercises : state.habitSettings.meals;
    const nextNum = (list ? list.length : 0) + 1;
    list.push({
      id: type + '_' + Date.now(),
      name: type === 'exercise' ? `Exercise / Exergame #${nextNum}` : `Meal #${nextNum}`,
      done: false,
      date: '',
      factor: type === 'exercise' ? 'Mobility Factor' : 'Nutrition Factor'
    });
    renderHabitEditForm();
  }

  function saveHabitSettingsForm() {
    initHabitSettings();
    const state = getState();
    const exLimitEl = document.getElementById('editExerciseLimitInput');
    const mealLimitEl = document.getElementById('editMealLimitInput');
    if (exLimitEl) state.habitSettings.exerciseLimit = Math.max(1, parseInt(exLimitEl.value, 10) || 3);
    if (mealLimitEl) state.habitSettings.mealLimit = Math.max(1, parseInt(mealLimitEl.value, 10) || 3);

    const exRows = document.querySelectorAll('#editExercisesList .habit-edit-item-row');
    exRows.forEach((row, idx) => {
      const input = row.querySelector('.edit-ex-input');
      if (input && state.habitSettings.exercises[idx]) {
        state.habitSettings.exercises[idx].name = input.value.trim() || `Exercise #${idx+1}`;
      }
    });

    const mealRows = document.querySelectorAll('#editMealsList .habit-edit-item-row');
    mealRows.forEach((row, idx) => {
      const input = row.querySelector('.edit-meal-input');
      if (input && state.habitSettings.meals[idx]) {
        state.habitSettings.meals[idx].name = input.value.trim() || `Meal #${idx+1}`;
      }
    });

    saveState();
    renderHabitTracker();
    document.getElementById('habitEditPanel')?.classList.add('hidden');
    getModals().showToast('✅ Daily limits & habit factors saved!');
    getAudio().playSound('success');
  }

  function resetHabitSettingsDefaults() {
    const state = getState();
    state.habitSettings = {
      exerciseLimit: 3,
      mealLimit: 3,
      exercises: [
        { id: 'ex_1', name: 'Morning Stretch & Walk', done: false, date: '', factor: 'Mobility & Balance' },
        { id: 'ex_2', name: 'Finger Gym / Exergame', done: false, date: '', factor: 'Fine Motor Control' },
        { id: 'ex_3', name: 'Voice or Balance Drill', done: false, date: '', factor: 'Vocal / Posture Rhythm' }
      ],
      meals: [
        { id: 'ml_1', name: 'Breakfast', done: false, date: '', factor: 'Morning Nutrition' },
        { id: 'ml_2', name: 'Lunch (Protein-timed)', done: false, date: '', factor: 'Midday Energy' },
        { id: 'ml_3', name: 'Dinner', done: false, date: '', factor: 'Evening Recovery' }
      ]
    };
    saveState();
    renderHabitEditForm();
    renderHabitTracker();
    getModals().showToast('🔄 Reset to default 3 exercises & 3 meals');
    getAudio().playSound('click');
  }

  window.Cadence.habitEngine = {
    initHabitSettings,
    syncHabitsWithActivityOrMeal,
    bumpRhythmStreak,
    updateExerciseEncouragementNote,
    renderHabitTracker,
    renderHabitEditForm,
    deleteHabitFactor,
    addHabitFactor,
    saveHabitSettingsForm,
    resetHabitSettingsDefaults
  };
})();
