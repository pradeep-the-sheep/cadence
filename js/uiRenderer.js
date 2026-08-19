/**
 * Cadence · Parkinson's Daily Companion
 * uiRenderer.js - Central UI coordinator for DOM manipulation, clock, meds, day ribbon & entries
 */

window.Cadence = window.Cadence || {};

(function() {
  const DOT_COLORS = {
    sleep: 'var(--dot-sleep)',
    exercise: 'var(--dot-exercise)',
    food: 'var(--dot-food)',
    drink: 'var(--dot-drink)',
    activity: 'var(--dot-activity)',
    symptoms: 'var(--dot-symptoms)',
    gait: 'var(--dot-gait)'
  };

  const DOT_BORDERS = {
    sleep: '#5B21B6',
    exercise: '#047857',
    food: '#B45309',
    drink: '#1D4ED8',
    activity: '#8B6914',
    symptoms: '#B91C1C',
    gait: '#5B21B6'
  };

  const PANEL_LABELS = {
    sleep: 'Sleep',
    exercise: 'Exercise / Activity',
    food: 'Food',
    drink: 'Drink',
    activity: 'Exercise / Activity',
    symptoms: 'Symptoms',
    medication: 'Medication',
    gait: 'Gait & Balance',
    motor: 'Motor State',
    mood: 'Mood Check-in',
    fingerGym: 'Movement Assessment'
  };

  const PANEL_ICONS = {
    sleep: '🛌',
    exercise: '🏃',
    food: '🍽️',
    drink: '🥤',
    activity: '🎯',
    symptoms: '🤒',
    gait: '🦯',
    motor: '⚡',
    mood: '💭',
    fingerGym: '🏃'
  };

  let editingMedId = null;
  let editingEntry = null;
  let _lastDigitalSec = -1;

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
  function getMeds() {
    return window.Cadence.medicationEngine;
  }
  function getHabits() {
    return window.Cadence.habitEngine;
  }
  function getAnalytics() {
    return window.Cadence.analyticsEngine;
  }

  function buildClock() {
    const f = document.getElementById('clockFace');
    if (!f) return;
    f.querySelectorAll('.marker, .hand, .activity-dot, .med-schedule-label, .orbit-ring, .clock-num').forEach(e => e.remove());
    
    // Outer PM Orbit Track Guide Ring (Second 12 Hours)
    const orbit = document.createElement('div');
    orbit.className = 'orbit-ring pm-orbit';
    f.appendChild(orbit);

    for (let i = 0; i < 60; i++) {
      const m = document.createElement('div');
      m.className = 'marker' + (i % 5 === 0 ? ' major' : ' minor');
      m.style.transform = 'rotate(' + (i * 6) + 'deg)';
      f.appendChild(m);
    }

    // High-Legibility Hour Numerals 1 to 12 - Precisely centered
    const cx = 185, cy = 185, rNum = 140;
    for (let h = 1; h <= 12; h++) {
      const angle = (h * 30) * Math.PI / 180;
      const nx = cx + rNum * Math.sin(angle);
      const ny = cy - rNum * Math.cos(angle);
      const numEl = document.createElement('span');
      numEl.className = 'clock-num' + (h % 3 === 0 ? ' cardinal' : '');
      numEl.style.left = nx + 'px';
      numEl.style.top = ny + 'px';
      numEl.textContent = h;
      f.appendChild(numEl);
    }

    ['second', 'minute', 'hour'].forEach(s => {
      const h = document.createElement('div');
      h.className = 'hand ' + s;
      f.appendChild(h);
      if (s === 'second') window._secHand = h;
      else if (s === 'minute') window._minHand = h;
      else window._hrHand = h;
    });
  }

  function timeToAngle(t) {
    const [h, m] = t.split(':').map(Number);
    return ((h % 12) * 60 + m) / 720 * 360;
  }

  const MEAL_EMOJIS = {
    breakfast: '🍳',
    lunch: '🥪',
    dinner: '🍲',
    snack: '🍎'
  };

  const DRINK_EMOJIS = {
    water: '💧',
    coffee: '☕',
    tea: '🍵',
    alcohol: '🍷',
    juice: '🧃',
    soda: '🥤',
    milk: '🥛',
    other: '📦'
  };

  const SYMPTOM_EMOJIS = {
    'tremor': '🫨',
    'stiff': '🦵',
    'freez': '🦶',
    'dyskines': '🌀',
    'fatigue': '🥱',
    'tired': '🥱',
    'fog': '🧠',
    'brain': '🧠',
    'anxiet': '🧠',
    'mood': '🧠',
    'dizz': '💫',
    'pain': '🤕',
    'ache': '🤕',
    'constipat': '🚽',
    'sleep': '🛌✨',
    'speech': '🗣️',
    'voice': '🗣️',
    'cramp': '⚡',
    'spasm': '⚡'
  };

  function resolveMealEmoji(log) {
    if (log && log.mealType && MEAL_EMOJIS[log.mealType.toLowerCase()]) {
      return MEAL_EMOJIS[log.mealType.toLowerCase()];
    }
    const d = ((log && (log.detail || log.name)) || '').toLowerCase();
    if (d.includes('breakfast') || d.includes('egg') || d.includes('cereal') || d.includes('toast') || d.includes('waffle') || d.includes('pancake')) return '🍳';
    if (d.includes('lunch') || d.includes('sandwich') || d.includes('salad') || d.includes('wrap') || d.includes('burger')) return '🥪';
    if (d.includes('dinner') || d.includes('soup') || d.includes('stew') || d.includes('pasta') || d.includes('rice') || d.includes('curry')) return '🍲';
    if (d.includes('snack') || d.includes('fruit') || d.includes('apple') || d.includes('banana') || d.includes('nut') || d.includes('cookie')) return '🍎';
    if (log && log.options && log.options.includes('protein') || d.includes('protein') || d.includes('meat') || d.includes('steak') || d.includes('chicken') || d.includes('fish')) return '🥩';
    return '🍽️';
  }

  function resolveDrinkEmoji(log) {
    if (log && log.drinkType && DRINK_EMOJIS[log.drinkType.toLowerCase()]) {
      return DRINK_EMOJIS[log.drinkType.toLowerCase()];
    }
    const d = ((log && (log.detail || log.name)) || '').toLowerCase();
    if (d.includes('water') || d.includes('h2o') || d.includes('fluid')) return '💧';
    if (d.includes('coffee') || d.includes('espresso') || d.includes('latte') || d.includes('cappuccino') || d.includes('caffeine')) return '☕';
    if (d.includes('tea') || d.includes('chai') || d.includes('matcha') || d.includes('herbal')) return '🍵';
    if (d.includes('alcohol') || d.includes('wine') || d.includes('beer') || d.includes('liquor') || d.includes('cocktail') || d.includes('spirits')) return '🍷';
    if (d.includes('juice') || d.includes('smoothie') || d.includes('orange') || d.includes('apple juice')) return '🧃';
    if (d.includes('soda') || d.includes('cola') || d.includes('pop') || d.includes('fizzy') || d.includes('coke') || d.includes('pepsi')) return '🥤';
    if (d.includes('milk') || d.includes('dairy') || d.includes('latte')) return '🥛';
    if (d.includes('other')) return '📦';
    return '🥤';
  }

  function resolveSymptomEmoji(name) {
    if (!name) return '🤒';
    const n = String(name).toLowerCase();
    for (const [key, emoji] of Object.entries(SYMPTOM_EMOJIS)) {
      if (n.includes(key)) return emoji;
    }
    return '🤒';
  }

  function resolveActivityEmoji(detail) {
    const d = String(detail || '').toLowerCase();
    if (d.includes('clock') || d.includes('reach') || d.includes('lsvt') || d.includes('sky')) return '🎯';
    if (d.includes('pataka') || d.includes('diadochokinesis')) return '🗣️';
    if (d.includes('walk') || d.includes('step') || d.includes('stroll')) return '🚶';
    if (d.includes('run') || d.includes('jog')) return '🏃';
    if (d.includes('cycl') || d.includes('bike') || d.includes('ride')) return '🚴';
    if (d.includes('swim') || d.includes('pool')) return '🏊';
    if (d.includes('yoga') || d.includes('stretch') || d.includes('pilates') || d.includes('tai chi')) return '🧘';
    if (d.includes('danc')) return '💃';
    if (d.includes('box') || d.includes('punch')) return '🥊';
    if (d.includes('dino') || d.includes('jump')) return '🦖';
    if (d.includes('voice') || d.includes('speech') || d.includes('sing') || d.includes('loud')) return '🗣️';
    if (d.includes('finger') || d.includes('tap') || d.includes('gym')) return '🖐️';
    if (d.includes('weight') || d.includes('resistance')) return '🏋️';
    return '🏃';
  }

  function resolveGaitEmoji(type) {
    if (!type) return '🦯';
    const t = String(type).toLowerCase();
    if (t.includes('fall')) return '⚠️';
    if (t.includes('freez')) return '🧊';
    if (t.includes('shuffle')) return '👣';
    return '🦯';
  }

  function getDayEvents(targetDate) {
    const state = getState();
    const { todayStr, isToday, escapeHtml, fmtTime, timeToMinutes, nowHM } = getHelpers();
    const { medTakenToday, isSkippedToday } = getMeds();
    const date = targetDate || todayStr();
    const isTargetToday = isToday(date);
    const events = [];

    const short = (s, n) => {
      s = String(s || '');
      return s.length > (n || 12) ? s.slice(0, n || 12) + '…' : s;
    };

    // 1. Scheduled Meds (Scheduled, Taken, Skipped)
    (state.meds || []).forEach(m => {
      (m.times || []).forEach(t => {
        const taken = (state.medLog || []).some(l => l.medId === m.id && l.time === t && l.date === date);
        const skipped = (state.medSkips || []).some(s => s.medId === m.id && s.time === t && s.date === date);
        
        if (isTargetToday || taken || skipped) {
          const icon = taken ? '✅' : skipped ? '⏭️' : '💊';
          const kind = taken ? 'med-taken' : skipped ? 'med-skip' : 'med';
          const borderColor = taken ? '#16A34A' : skipped ? '#9CA3AF' : '#E11D48';
          const statusText = taken ? 'taken' : skipped ? 'skipped' : 'scheduled';
          events.push({
            type: 'medication',
            medId: m.id,
            id: m.id + '_' + t,
            time: t,
            icon: icon,
            emoji: icon,
            label: short(m.name.split(/[\s/]/)[0], 10),
            kind: kind,
            borderColor: borderColor,
            tip: (m.name || '') + (m.dose ? ' ' + m.dose : '') + ' · ' + statusText,
            onClick: () => {
              if (isTargetToday && !taken && !skipped) {
                getMeds().logDoseTaken(m.id, t);
              } else {
                getModals().showToast(`${m.name} (${fmtTime(t)}) · ${statusText}`);
              }
            }
          });
        }
      });
    });

    // 2. Motor States (ON, DYSKINESIA, OFF)
    (state.onOffLogs || []).filter(l => l.date === date).forEach(l => {
      const map = {
        ON: { icon: '🟢', label: 'ON', kind: 'motor-on', borderColor: '#16A34A' },
        ON_DYSKINESIA: { icon: '🟡', label: 'Dysk', kind: 'motor-dys', borderColor: '#CA8A04' },
        OFF: { icon: '🔴', label: 'OFF', kind: 'motor-off', borderColor: '#DC2626' }
      };
      const m = map[l.state] || { icon: '⚡', label: l.state, kind: 'motor-on', borderColor: '#16A34A' };
      events.push({
        type: 'motor',
        id: l.id,
        time: l.time,
        icon: m.icon,
        emoji: m.icon,
        label: m.label,
        kind: m.kind,
        borderColor: m.borderColor,
        tip: 'Motor: ' + l.state,
        onClick: () => viewEntry('motor', l.id)
      });
    });

    // 3. Mood Logs
    (state.moodLogs || []).filter(m => m.date === date).forEach(m => {
      const icons = { great: '😊', ok: '😐', low: '😔', anxious: '😰', foggy: '🌫️' };
      const icon = icons[m.mood] || '💭';
      events.push({
        type: 'mood',
        id: m.id,
        time: m.time,
        icon: icon,
        emoji: icon,
        label: short(m.mood, 10),
        kind: 'mood',
        borderColor: '#8B5CF6',
        tip: 'Mood: ' + m.mood,
        onClick: () => viewEntry('mood', m.id)
      });
    });

    // 4. Meal & Drink & Activity Logs
    (state.logs || []).filter(l => l.date === date).forEach(l => {
      if (l.type === 'meal') {
        const isP = l.options && l.options.includes('protein');
        const icon = resolveMealEmoji(l);
        const kind = isP ? 'protein' : 'meal';
        events.push({
          type: 'meal',
          id: l.id,
          time: l.time,
          icon: icon,
          emoji: icon,
          label: short(l.detail || (isP ? 'Protein' : 'Meal'), 12),
          kind: kind,
          borderColor: isP ? '#D97706' : '#B45309',
          tip: l.detail || (isP ? 'Protein Meal' : 'Meal'),
          onClick: () => viewEntry('food', l.id)
        });
      } else if (l.type === 'drink') {
        const icon = resolveDrinkEmoji(l);
        events.push({
          type: 'drink',
          id: l.id,
          time: l.time,
          icon: icon,
          emoji: icon,
          label: short(l.detail || 'Drink', 12),
          kind: 'drink',
          borderColor: '#1D4ED8',
          tip: l.detail || 'Drink',
          onClick: () => viewEntry('drink', l.id)
        });
      } else if (l.type === 'activity' || l.type === 'exercise') {
        const icon = resolveActivityEmoji(l.detail);
        events.push({
          type: 'activity',
          id: l.id,
          time: l.time,
          icon: icon,
          emoji: icon,
          label: short(l.detail || 'Activity', 12),
          kind: 'exercise',
          borderColor: '#047857',
          tip: l.detail || 'Activity',
          onClick: () => viewEntry('activity', l.id)
        });
      }
    });

    // 5. Symptoms
    (state.symptoms || []).filter(s => s.date === date).forEach(s => {
      const names = Array.isArray(s.name) ? s.name.join(', ') : (s.name || 'Symptom');
      const icon = resolveSymptomEmoji(names);
      events.push({
        type: 'symptoms',
        id: s.id,
        time: s.time,
        icon: icon,
        emoji: icon,
        label: short(names, 12),
        kind: 'symptom',
        borderColor: '#B91C1C',
        tip: names + (s.severity ? ' · sev ' + s.severity : ''),
        onClick: () => viewEntry('symptoms', s.id)
      });
    });

    // 6. Gait & Balance
    (state.gait || []).filter(g => g.date === date).forEach(g => {
      const icon = resolveGaitEmoji(g.type);
      const borders = { fall: '#DC2626', freeze: '#0284C7', gait: '#7C3AED', shuffle: '#64748B' };
      events.push({
        type: 'gait',
        id: g.id,
        time: g.time,
        icon: icon,
        emoji: icon,
        label: short(g.type || 'Gait', 10),
        kind: 'gait',
        borderColor: borders[g.type] || '#5B21B6',
        tip: (g.type || 'gait') + (g.location ? ' · ' + g.location : ''),
        onClick: () => viewEntry('gait', g.id)
      });
    });

    // 7. Finger Gym & Exergame & Voice Logs
    (state.fingerGymLogs || []).filter(r => r.date === date).forEach(r => {
      const icon = resolveActivityEmoji(r.exercise);
      events.push({
        type: 'fingerGym',
        id: r.id,
        time: r.time,
        icon: icon,
        emoji: icon,
        label: short(r.exercise || 'Activity', 12),
        kind: 'exercise',
        borderColor: '#047857',
        tip: (r.exercise || 'Session') + (r.score != null ? ' · score ' + r.score : ''),
        onClick: () => viewEntry('fingerGym', r.id)
      });
    });

    // 8. Sleep Logs
    (state.sleep || []).filter(s => s.date === date && !s.dismissed).forEach(s => {
      events.push({
        type: 'sleep',
        id: s.id,
        time: s.time || '07:00',
        icon: '🛌',
        emoji: '🛌',
        label: s.rating ? `${s.rating}★ Sleep` : 'Sleep',
        kind: 'sleep',
        borderColor: '#7C3AED',
        tip: 'Sleep: ' + (s.rating ? s.rating + '/5 stars' : 'Logged') + (s.notes ? ' — ' + s.notes : ''),
        onClick: () => viewEntry('sleep', s.id)
      });
    });

    events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return events;
  }

  function getTodayEvents() {
    return getDayEvents(getHelpers().todayStr());
  }

  function renderClockDots() {
    const f = document.getElementById('clockFace');
    if (!f) return;
    f.querySelectorAll('.activity-dot, .med-schedule-label').forEach(e => e.remove());
    const cx = 185;
    const cy = 185;

    const state = getState();
    const { fmtTime } = getHelpers();
    const events = getTodayEvents();

    events.forEach(entry => {
      if (!entry.time) return;
      const a = timeToAngle(entry.time) * Math.PI / 180;
      const [h, m] = entry.time.split(':').map(Number);
      
      // Daytime 6:00 AM to 6:00 PM (360 to 1080 mins): Rim of clock (182px)
      // Nighttime 6:00 PM to 6:00 AM: Outer orbit ring (230px)
      const totalMinutes = h * 60 + (m || 0);
      const isDaytime = totalMinutes >= 360 && totalMinutes < 1080;
      const dotR = isDaytime ? 182 : 230;

      const dot = document.createElement('button');
      dot.className = 'activity-dot ' + (isDaytime ? 'dot-am' : 'dot-pm');
      dot.style.left = (cx + dotR * Math.sin(a) - 19) + 'px';
      dot.style.top = (cy - dotR * Math.cos(a) - 19) + 'px';
      dot.style.borderColor = entry.borderColor || 'var(--primary)';
      dot.style.background = 'var(--surface)';
      dot.innerHTML = entry.icon;
      dot.dataset.entryType = entry.type;
      dot.dataset.entryId = entry.id;
      dot.title = (entry.tip || entry.label) + ' (' + fmtTime(entry.time) + ' · ' + (isDaytime ? 'Day' : 'Night') + ')';
      dot.setAttribute('aria-label', (entry.tip || entry.label) + ' at ' + fmtTime(entry.time));
      dot.addEventListener('click', () => {
        getAudio().playSound('click');
        if (entry.onClick) entry.onClick();
        else viewEntry(entry.type, entry.id);
      });
      f.appendChild(dot);
    });

    (state.meds || []).forEach(m => {
      (m.times || []).forEach(t => {
        const angle = timeToAngle(t);
        const a = angle * Math.PI / 180;
        const rText = 142;
        const label = document.createElement('div');
        label.className = 'med-schedule-label';
        label.style.position = 'absolute';
        label.style.left = (cx + rText * Math.sin(a)) + 'px';
        label.style.top = (cy - rText * Math.cos(a)) + 'px';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.fontSize = '0.72rem';
        label.style.fontWeight = '800';
        label.style.color = '#E11D48';
        label.style.background = 'var(--surface)';
        label.style.border = '1.5px solid #FDA4AF';
        label.style.borderRadius = '5px';
        label.style.padding = '2px 4px';
        label.style.zIndex = '3';
        label.style.pointerEvents = 'none';
        label.style.boxShadow = 'var(--shadow-sm)';
        label.textContent = fmtTime(t);
        f.appendChild(label);
      });
    });
  }

  function updateClock() {
    const n = new Date();
    if (window._secHand) window._secHand.style.transform = 'rotate(' + ((n.getSeconds() + n.getMilliseconds() / 1000) * 6) + 'deg)';
    if (window._minHand) window._minHand.style.transform = 'rotate(' + ((n.getMinutes() + n.getSeconds() / 60) * 6) + 'deg)';
    if (window._hrHand) window._hrHand.style.transform = 'rotate(' + ((n.getHours() % 12 + n.getMinutes() / 60) * 30) + 'deg)';
    
    const sec = n.getSeconds();
    if (sec !== _lastDigitalSec) {
      _lastDigitalSec = sec;
      const dtEl = document.getElementById('clockDateTime');
      if (dtEl) {
        const hours = n.getHours();
        const mins = String(n.getMinutes()).padStart(2, '0');
        const secs = String(n.getSeconds()).padStart(2, '0');
        const isPM = hours >= 12;
        const displayHours = hours % 12 || 12;
        const ampm = isPM ? 'PM' : 'AM';

        let periodTag = '☀️ Morning';
        let periodClass = 'morning';
        if (hours >= 21 || hours < 6) {
          periodTag = '🌙 Night';
          periodClass = 'night';
        } else if (hours >= 17) {
          periodTag = '🌅 Evening';
          periodClass = 'evening';
        } else if (hours >= 12) {
          periodTag = '🌤️ Afternoon';
          periodClass = 'afternoon';
        }

        const dayName = n.toLocaleDateString(undefined, { weekday: 'long' });
        const dateStr = n.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

        dtEl.innerHTML = `
          <div class="chrono-date-side">
            <div class="chrono-day-line">
              <span class="chrono-cal-dot">🗓️</span>
              <span class="chrono-day-name">${dayName}</span>
              <span class="chrono-period-badge ${periodClass}">${periodTag}</span>
            </div>
            <div class="chrono-date-sub-line">
              <span class="chrono-date-sub">${dateStr}</span>
              <button type="button" class="btn-chrono-history" id="openHistoryModalBtn" aria-label="View previous entries and recorded rhythms">
                <span>📅 Previous entries</span>
              </button>
            </div>
          </div>
          <div class="chrono-time-side">
            <div class="chrono-digits-wrap">
              <span class="chrono-hours-mins">${displayHours}:${mins}</span>
              <span class="chrono-seconds">:${secs}</span>
              <span class="chrono-ampm">${ampm}</span>
            </div>
          </div>
        `;
      }
    }
  }

  function renderMeds() {
    const w = document.getElementById('medList');
    if (!w) return;
    w.innerHTML = '';
    const state = getState();
    const { escapeHtml, fmtTime, nowHM } = getHelpers();
    const { medTakenToday, isSnoozed, isSkippedToday, logDoseTaken, delMed, calculateAdherenceStreak } = getMeds();

    const emptyEl = document.getElementById('medEmpty');
    if (emptyEl) emptyEl.style.display = (state.meds && state.meds.length) ? 'none' : 'block';
    const n = nowHM();

    (state.meds || []).forEach(m => {
      const r = document.createElement('div');
      r.className = 'med-row';
      r.innerHTML = `
        <div class="med-header">
          <span class="med-name">${escapeHtml(m.name)}</span>
          <span class="med-dose">${escapeHtml(m.dose || '')}</span>
          <button class="med-edit-btn" data-edit="${m.id}" aria-label="Edit" style="margin-left:auto;color:var(--primary);font-size:1.2rem;padding:6px 12px;border-radius:10px;border:none;background:var(--surface-2);cursor:pointer;">✏️ Edit</button>
          <button class="med-del" data-del="${m.id}" aria-label="Remove">✕</button>
        </div>
        <div class="med-times">${m.times.map(t => {
          const tk = medTakenToday(m.id, t);
          const sz = isSnoozed(m.id, t);
          const du = !tk && !sz && t <= n && !isSkippedToday(m.id, t);
          let c = 'med-pill', l = fmtTime(t);
          if (tk) { c += ' taken'; l += ' ✓'; }
          else if (sz) { c += ' snoozed'; l += ' 💤'; }
          else if (du) { c += ' due'; l += ' ⏰'; }
          return `<button class="${c}" data-med="${m.id}" data-time="${t}" aria-label="${l}">${l}</button>`;
        }).join('')}</div>
      `;
      w.appendChild(r);
    });

    w.querySelectorAll('[data-med]').forEach(b => {
      b.addEventListener('click', function() {
        if (!medTakenToday(this.dataset.med, this.dataset.time)) {
          logDoseTaken(this.dataset.med, this.dataset.time);
        }
      });
    });

    w.querySelectorAll('[data-edit]').forEach(b => {
      b.addEventListener('click', function() {
        openEditMedModal(this.dataset.edit);
      });
    });

    w.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', function() {
        if (confirm('Remove medication and all related logs?')) delMed(this.dataset.del);
      });
    });

    const streakDisplay = document.getElementById('adherenceStreakDisplay');
    if (streakDisplay) {
      const streak = calculateAdherenceStreak();
      if (streak > 0) {
        streakDisplay.textContent = `🔥 ${streak}-day adherence streak`;
        streakDisplay.style.display = 'inline-block';
      } else {
        streakDisplay.style.display = 'none';
      }
    }
  }

  function openEditMedModal(id) {
    const state = getState();
    const med = (state.meds || []).find(m => m.id === id);
    if (!med) return;
    editingMedId = id;
    const title = document.getElementById('medTitle');
    if (title) title.textContent = '✏️ Edit medication';
    document.getElementById('medName').value = med.name || '';
    document.getElementById('medDose').value = med.dose || '';
    document.getElementById('medTime').value = med.first || med.times[0] || '08:00';
    document.getElementById('medInterval').value = med.interval || 4;
    document.getElementById('medCount').value = med.count || med.times.length || 4;
    getModals().openModal('medModal');
  }

  function renderLogStatus() {
    const c = { sleep: 0, exercise: 0, food: 0, drink: 0, symptoms: 0, gait: 0 };
    const state = getState();
    const { isToday } = getHelpers();

    (state.sleep || []).filter(s => isToday(s.date) && !s.dismissed).forEach(() => c.sleep++);
    (state.symptoms || []).filter(s => isToday(s.date)).forEach(() => c.symptoms++);
    (state.gait || []).filter(g => isToday(g.date)).forEach(() => c.gait++);
    (state.logs || []).filter(l => isToday(l.date)).forEach(l => {
      let t = l.type === 'meal' ? 'food' : l.type;
      if (t === 'activity') t = 'exercise';
      if (c[t] !== undefined) c[t]++;
    });

    Object.entries(c).forEach(([t, ct]) => {
      const el = document.getElementById('logStatus-' + t);
      if (!el) return;
      if (t === 'sleep') {
        const sleepEntry = (state.sleep || []).find(s => isToday(s.date) && !s.dismissed);
        const btn = document.querySelector('.log-panel.sleep .btn-log');
        const starsDisplay = document.getElementById('sleepStarsDisplay');
        if (sleepEntry && sleepEntry.rating) {
          el.textContent = sleepEntry.rating + '/5 stars';
          if (starsDisplay) starsDisplay.textContent = '★'.repeat(sleepEntry.rating) + '☆'.repeat(5 - sleepEntry.rating);
          if (btn) btn.textContent = 'Edit sleep';
        } else if (ct > 0) {
          el.textContent = '✅ logged';
          if (starsDisplay) starsDisplay.textContent = '';
          if (btn) btn.textContent = 'Edit sleep';
        } else {
          el.textContent = '—';
          if (starsDisplay) starsDisplay.textContent = '';
          if (btn) btn.textContent = 'Log sleep';
        }
      } else {
        el.textContent = ct > 0 ? ct + ' logged' : 'Not logged';
      }
    });
  }

  function updateOnOffBadge() {
    const txt = document.getElementById('onOffStateText');
    const bOn = document.getElementById('btnStateOn');
    const bDys = document.getElementById('btnStateDys');
    const bOff = document.getElementById('btnStateOff');

    if (!txt || !bOn) return;
    [bOn, bDys, bOff].forEach(b => b.classList.remove('active'));

    const state = getState();
    const { todayStr, fmtTime } = getHelpers();
    const todayLogs = (state.onOffLogs || []).filter(l => l.date === todayStr());
    if (!todayLogs.length) {
      txt.textContent = 'Not logged today';
      txt.style.color = 'var(--ink-soft)';
      return;
    }

    const latest = todayLogs[0];
    if (latest.state === 'ON') {
      txt.textContent = '🟢 ON State (' + fmtTime(latest.time) + ')';
      txt.style.color = '#16A34A';
      bOn.classList.add('active');
    } else if (latest.state === 'ON_DYSKINESIA') {
      txt.textContent = '🟡 ON + Dyskinesia (' + fmtTime(latest.time) + ')';
      txt.style.color = '#CA8A04';
      bDys.classList.add('active');
    } else if (latest.state === 'OFF') {
      txt.textContent = '🔴 OFF State (' + fmtTime(latest.time) + ')';
      txt.style.color = '#DC2626';
      bOff.classList.add('active');
    }
  }

  function renderDayRibbon() {
    getHabits().renderHabitTracker();
    const el = document.getElementById('dayRibbon');
    if (!el) return;
    const { escapeHtml, fmtTime, timeToMinutes, nowHM } = getHelpers();
    const items = getTodayEvents();
    const nowMin = timeToMinutes(nowHM());

    if (!items.length) {
      el.innerHTML = '<div class="ribbon-slot" style="min-width:180px;opacity:.7;">Nothing logged yet today</div>';
      return;
    }

    el.innerHTML = items.map(it => {
      const tMin = timeToMinutes(it.time || '12:00');
      const isNow = Math.abs(tMin - nowMin) <= 30;
      const tip = escapeHtml(it.tip || it.label);
      return `<div class="ribbon-slot ${it.kind}${isNow ? ' now' : ''}" role="listitem" title="${tip} at ${fmtTime(it.time)}" style="cursor:pointer;">
        <span class="r-time">${fmtTime(it.time)}</span>
        <span class="r-icon">${it.icon}</span>
        <span>${escapeHtml(it.label)}</span>
      </div>`;
    }).join('');

    el.querySelectorAll('.ribbon-slot').forEach((slot, idx) => {
      const it = items[idx];
      if (it && it.onClick) {
        slot.addEventListener('click', () => {
          getAudio().playSound('click');
          it.onClick();
        });
      }
    });
  }

  function viewEntry(type, id) {
    const state = getState();
    const { escapeHtml, fmtTime } = getHelpers();
    let entry;
    if (type === 'sleep') entry = (state.sleep || []).find(e => e.id === id);
    else if (type === 'symptoms') entry = (state.symptoms || []).find(e => e.id === id);
    else if (type === 'gait') entry = (state.gait || []).find(e => e.id === id);
    else if (type === 'motor') entry = (state.onOffLogs || []).find(e => e.id === id);
    else if (type === 'mood') entry = (state.moodLogs || []).find(e => e.id === id);
    else if (type === 'fingerGym' || type === 'exergame') entry = (state.fingerGymLogs || []).find(e => e.id === id);
    else entry = (state.logs || []).find(e => e.id === id);

    if (!entry) {
      getModals().showToast('Entry not found.');
      return;
    }

    editingEntry = { type, id, entry };
    const c = document.getElementById('viewEntryContent');
    let icon = PANEL_ICONS[type] || '📌';
    if (type === 'food' || type === 'meal') icon = resolveMealEmoji(entry);
    else if (type === 'drink') icon = resolveDrinkEmoji(entry);
    else if (type === 'symptoms') icon = resolveSymptomEmoji(entry.name);
    else if (type === 'gait') icon = resolveGaitEmoji(entry.type);
    else if (type === 'activity' || type === 'exercise') icon = resolveActivityEmoji(entry.detail);
    else if (type === 'motor') icon = entry.state === 'OFF' ? '🔴' : entry.state === 'ON_DYSKINESIA' ? '🟡' : '🟢';
    else if (type === 'mood') icon = '💭';
    else if (type === 'fingerGym' || type === 'exergame') icon = resolveActivityEmoji(entry.exercise);

    const title = PANEL_LABELS[type] || 'Entry';

    let media = '';
    if (entry.photo) media += '<div class="photo-preview"><img src="' + entry.photo + '" alt="Photo"></div>';
    if (entry.voiceMemo) media += '<div class="voice-player"><audio controls src="' + entry.voiceMemo + '" style="flex:1;min-height:44px"></audio></div>';

    if (type === 'sleep') {
      c.innerHTML = `
        <div class="view-field"><span class="vf-label">Type</span><div class="vf-value">${icon} ${title}</div></div>
        <div class="view-field"><span class="vf-label">Rating</span><div style="display:flex;gap:8px;font-size:2.4rem;">${[1,2,3,4,5].map(i => '<span class="edit-star" data-s="' + i + '" role="button" tabindex="0" style="cursor:pointer;color:' + (i <= entry.rating ? 'var(--accent)' : 'var(--ink-faint)') + ';">' + (i <= entry.rating ? '★' : '☆') + '</span>').join('')}</div></div>
        <div class="view-field"><span class="vf-label">Time</span><input type="time" id="editTime" value="${entry.time || ''}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;"></div>
        <div class="view-field"><span class="vf-label">Notes</span><textarea id="editNotes" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;min-height:80px;">${escapeHtml(entry.notes || '')}</textarea></div>
        ${media}
      `;
    } else if (type === 'symptoms') {
      c.innerHTML = `
        <div class="view-field"><span class="vf-label">Type</span><div class="vf-value">${icon} ${title}</div></div>
        <div class="view-field"><span class="vf-label">Symptom</span>
          <input type="text" id="editName" value="${escapeHtml(entry.name || '')}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
        <div class="view-field"><span class="vf-label">Severity (1-5)</span>
          <div style="display:flex;align-items:center;gap:12px;">
            <input type="range" id="editSeverity" min="1" max="5" value="${entry.severity || 3}" style="flex:1;">
            <span id="editSevVal" style="font-size:1.5rem;">${['😌','🙂','😟','😢','😭'][(entry.severity || 3) - 1]}</span>
          </div>
        </div>
        <div class="view-field"><span class="vf-label">Body location</span>
          <div class="vf-value">${escapeHtml(entry.bodyLocation || '—')}</div>
        </div>
        <div class="view-field"><span class="vf-label">Time</span>
          <input type="time" id="editTime" value="${entry.time || ''}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
        <div class="view-field"><span class="vf-label">Notes</span>
          <textarea id="editNotes" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;min-height:80px;">${escapeHtml(entry.notes || '')}</textarea>
        </div>
        ${media}
      `;
    } else if (type === 'gait') {
      c.innerHTML = `
        <div class="view-field"><span class="vf-label">Type</span><div class="vf-value">${icon} ${title}</div></div>
        <div class="view-field"><span class="vf-label">Event</span>
          <div class="vf-value">${escapeHtml(entry.type || '—')}</div>
        </div>
        <div class="view-field"><span class="vf-label">Severity (1-5)</span>
          <div style="display:flex;align-items:center;gap:12px;">
            <input type="range" id="editSeverity" min="1" max="5" value="${entry.severity || 3}" style="flex:1;">
            <span id="editSevVal" style="font-size:1.5rem;">${['😌','🙂','😟','😢','😭'][(entry.severity || 3) - 1]}</span>
          </div>
        </div>
        <div class="view-field"><span class="vf-label">Location</span>
          <input type="text" id="editLocation" value="${escapeHtml(entry.location || '')}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
        <div class="view-field"><span class="vf-label">Activity</span>
          <input type="text" id="editActivity" value="${escapeHtml(entry.activity || '')}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
        <div class="view-field"><span class="vf-label">Time</span>
          <input type="time" id="editTime" value="${entry.time || ''}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
        <div class="view-field"><span class="vf-label">Notes</span>
          <textarea id="editNotes" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;min-height:80px;">${escapeHtml(entry.notes || '')}</textarea>
        </div>
      `;
    } else if (type === 'motor') {
      c.innerHTML = `
        <div class="view-field"><span class="vf-label">Type</span><div class="vf-value">⚡ Motor State Check-in</div></div>
        <div class="view-field"><span class="vf-label">Motor State</span>
          <select id="editMotorState" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;background:var(--surface);color:var(--ink);">
            <option value="ON" ${entry.state === 'ON' ? 'selected' : ''}>🟢 ON (Medication working smoothly)</option>
            <option value="ON_DYSKINESIA" ${entry.state === 'ON_DYSKINESIA' ? 'selected' : ''}>🟡 ON + Dyskinesia (Involuntary movements)</option>
            <option value="OFF" ${entry.state === 'OFF' ? 'selected' : ''}>🔴 OFF (Medication wearing off / stiff)</option>
          </select>
        </div>
        <div class="view-field"><span class="vf-label">Time</span>
          <input type="time" id="editTime" value="${entry.time || ''}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
      `;
    } else if (type === 'mood') {
      c.innerHTML = `
        <div class="view-field"><span class="vf-label">Type</span><div class="vf-value">💭 Mood Check-in</div></div>
        <div class="view-field"><span class="vf-label">Mood</span>
          <input type="text" id="editMood" value="${escapeHtml(entry.mood || '')}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
        <div class="view-field"><span class="vf-label">Time</span>
          <input type="time" id="editTime" value="${entry.time || ''}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
      `;
    } else if (type === 'fingerGym' || type === 'exergame') {
      c.innerHTML = `
        <div class="view-field"><span class="vf-label">Type</span><div class="vf-value">🏃 Movement Assessment Log</div></div>
        <div class="view-field"><span class="vf-label">Exercise</span>
          <div class="vf-value">${escapeHtml(entry.exercise || 'Exercise')} (Score: ${entry.score != null ? entry.score : '—'})</div>
        </div>
        <div class="view-field"><span class="vf-label">Time</span>
          <input type="time" id="editTime" value="${entry.time || ''}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
      `;
    } else {
      const typeLabel = entry.type === 'meal' ? 'Food' : entry.type === 'drink' ? 'Drink' : 'Activity';
      c.innerHTML = `
        <div class="view-field"><span class="vf-label">Type</span><div class="vf-value">${icon} ${typeLabel}</div></div>
        <div class="view-field"><span class="vf-label">${entry.type === 'meal' ? 'Meal' : entry.type === 'drink' ? 'Drink' : 'Activity'}</span>
          <input type="text" id="editDetail" value="${escapeHtml(entry.detail || '')}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
        ${entry.options && entry.options.length ? `<div class="view-field"><span class="vf-label">Options</span><div class="vf-value">${entry.options.join(', ')}</div></div>` : ''}
        <div class="view-field"><span class="vf-label">Time</span>
          <input type="time" id="editTime" value="${entry.time || ''}" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;">
        </div>
        <div class="view-field"><span class="vf-label">Notes</span>
          <textarea id="editNotes" style="width:100%;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;font-size:1.05rem;min-height:80px;">${escapeHtml(entry.notes || '')}</textarea>
        </div>
        ${media}
      `;
    }

    document.getElementById('viewEntryTitle').textContent = '✏️ Edit ' + title;
    getModals().openModal('viewEntryModal');
  }

  function saveEditedEntry() {
    if (!editingEntry) return;
    const { type, entry } = editingEntry;

    const time = document.getElementById('editTime')?.value || entry.time;
    const notes = document.getElementById('editNotes')?.value.trim() || '';

    if (type === 'sleep') {
      let rating = 0;
      document.querySelectorAll('.edit-star').forEach(s => {
        if (s.textContent === '★') rating = Math.max(rating, Number(s.dataset.s));
      });
      entry.rating = rating || entry.rating;
      entry.time = time;
      entry.notes = notes;
    } else if (type === 'symptoms') {
      entry.name = document.getElementById('editName')?.value.trim() || entry.name;
      entry.severity = Number(document.getElementById('editSeverity')?.value || entry.severity);
      entry.notes = notes;
      entry.time = time;
    } else if (type === 'gait') {
      entry.severity = Number(document.getElementById('editSeverity')?.value || entry.severity);
      entry.location = document.getElementById('editLocation')?.value.trim() || entry.location || '';
      entry.activity = document.getElementById('editActivity')?.value.trim() || entry.activity || '';
      entry.notes = notes;
      entry.time = time;
    } else if (type === 'motor') {
      entry.state = document.getElementById('editMotorState')?.value || entry.state;
      entry.time = time;
    } else if (type === 'mood') {
      entry.mood = document.getElementById('editMood')?.value.trim() || entry.mood;
      entry.time = time;
    } else if (type === 'fingerGym' || type === 'exergame') {
      entry.time = time;
    } else {
      entry.detail = document.getElementById('editDetail')?.value.trim() || entry.detail;
      entry.notes = notes;
      entry.time = time;
    }

    saveState();
    getModals().closeModal('viewEntryModal');
    editingEntry = null;
    renderAll();
    getAudio().playSound('success');
    getModals().showToast('Saved!');
  }

  function deleteCurrentEntry() {
    if (!editingEntry) return;
    const { type, id } = editingEntry;
    const state = getState();

    if (!confirm('🗑️ Permanently delete this log entry?\n\nIt will be completely removed from Today\'s Rhythm, the 24-Hour Clock, and local storage.')) {
      return;
    }

    if (type === 'sleep') {
      state.sleep = (state.sleep || []).filter(e => e.id !== id);
    } else if (type === 'symptoms') {
      state.symptoms = (state.symptoms || []).filter(e => e.id !== id);
    } else if (type === 'gait') {
      state.gait = (state.gait || []).filter(e => e.id !== id);
    } else if (type === 'motor') {
      state.onOffLogs = (state.onOffLogs || []).filter(e => e.id !== id);
    } else if (type === 'mood') {
      state.moodLogs = (state.moodLogs || []).filter(e => e.id !== id);
    } else if (type === 'fingerGym' || type === 'exergame') {
      state.fingerGymLogs = (state.fingerGymLogs || []).filter(e => e.id !== id);
    } else {
      state.logs = (state.logs || []).filter(e => e.id !== id);
    }

    saveState();
    getModals().closeModal('viewEntryModal');
    editingEntry = null;
    renderAll();
    getAudio().playSound('click');
    getModals().showToast('Log entry deleted 🗑️');
  }

  function renderDoctorReport() {
    const c = document.getElementById('doctorReportContent');
    if (!c) return;
    const state = getState();
    const { escapeHtml, todayStr } = getHelpers();
    const days30 = 30;
    const today = todayStr();

    let takenDoses = 0, missedDoses = 0, skippedDoses = 0;
    for (let i = 0; i < days30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      takenDoses += (state.medLog || []).filter(l => l.date === ds).length;
      missedDoses += (state.missedDoses || []).filter(l => l.date === ds).length;
      skippedDoses += (state.medSkips || []).filter(l => l.date === ds).length;
    }
    const totalTracked = takenDoses + missedDoses + skippedDoses;
    const adherence = totalTracked ? Math.round((takenDoses / totalTracked) * 100) : 100;

    const sxCounts = {};
    (state.symptoms || []).filter(s => {
      const sd = new Date(s.date + 'T00:00:00Z');
      return Date.now() - sd.getTime() < days30 * 86400000;
    }).forEach(s => {
      sxCounts[s.name] = (sxCounts[s.name] || 0) + 1;
    });
    const topSx = Object.entries(sxCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const sleepData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const sleep = (state.sleep || []).find(s => s.date === ds);
      const sx = (state.symptoms || []).filter(s => s.date === ds).length;
      if (sleep || sx) sleepData.push({ date: ds, rating: sleep?.rating || 0, sxCount: sx });
    }

    c.innerHTML = `
      <div class="report-section"><h3>📊 Medication adherence</h3>
        <div class="report-grid">
          <div class="report-card"><div class="rc-num">${adherence}%</div><div class="rc-label">Doses taken on time</div></div>
          <div class="report-card"><div class="rc-num">${takenDoses}/${totalTracked || takenDoses}</div><div class="rc-label">Doses taken</div></div>
        </div>
        <div class="report-bar" style="margin-top:12px;"><div class="report-bar-fill" style="width:${adherence}%"></div></div>
      </div>
      <div class="report-section"><h3>🔍 Top symptoms (30 days)</h3>
        ${topSx.length ? topSx.map(([n, ct]) => '<div class="report-stat"><span>' + escapeHtml(n) + '</span><span class="rs-val">' + ct + 'x</span></div>').join('') : '<div style="color:var(--ink-faint);">No symptoms logged.</div>'}
      </div>
      <div class="report-section"><h3>😴 Sleep vs. Symptoms (7 days)</h3>
        <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:6px;">
          ${sleepData.map(s => '<div style="text-align:center;padding:8px 4px;background:var(--surface-2);border-radius:var(--radius-sm);border:1.5px solid var(--line);"><div style="font-size:.75rem;color:var(--ink-faint);font-weight:600;margin-bottom:4px;">' + (s.date === today ? 'Today' : s.date.slice(5)) + '</div><div style="font-size:1.3rem;font-weight:700;color:' + (s.rating >= 4 ? 'var(--dot-exercise)' : s.rating >= 2 ? 'var(--dot-food)' : 'var(--dot-symptoms)') + ';">' + (s.rating ? s.rating + '/5' : '—') + '</div><div style="font-size:.8rem;color:var(--ink-soft);">' + s.sxCount + ' sx</div></div>').join('')}
        </div>
        ${sleepData.length ? '' : '<div style="color:var(--ink-faint);padding:12px 0;">Log sleep and symptoms to see correlations.</div>'}
      </div>
    `;
    getModals().openModal('doctorModal');
  }

  function checkProteinConflictNudge() {
    const state = getState();
    const { todayStr, timeToMinutes, fmtTime } = getHelpers();
    const today = todayStr();
    const proteinMeals = (state.logs || []).filter(l => l.date === today && l.type === 'meal' && (l.options?.includes('protein') || l.detail?.toLowerCase().includes('protein')));
    const levodopaMeds = (state.meds || []).filter(m => m.name.toLowerCase().match(/levodopa|sinemet|madopar|stalevo/));
    
    const popupEl = document.getElementById('proteinConflictPopup');
    if (!popupEl) return;

    if (proteinMeals.length && levodopaMeds.length) {
      let conflictMeal = null;
      proteinMeals.forEach(meal => {
        const mMin = timeToMinutes(meal.time);
        (state.medLog || []).filter(l => l.date === today).forEach(medLogItem => {
          const med = (state.meds || []).find(m => m.id === medLogItem.medId);
          if (!med || !med.name.toLowerCase().match(/levodopa|sinemet|madopar|stalevo/)) return;

          const lMin = timeToMinutes(medLogItem.time);
          if (Math.abs(mMin - lMin) <= 60) {
            conflictMeal = meal;
          }
        });
      });

      if (conflictMeal) {
        const dismissedKey = 'protein_conflict_' + today;
        if (state._nudgeDismissed && state._nudgeDismissed[dismissedKey]) {
          popupEl.classList.add('hidden');
          return;
        }
        const timeEl = document.getElementById('proteinConflictTime');
        if (timeEl) timeEl.textContent = fmtTime(conflictMeal.time);
        popupEl.classList.remove('hidden');
      } else {
        popupEl.classList.add('hidden');
      }
    } else {
      popupEl.classList.add('hidden');
    }
  }

  function applyTheme(t) {
    document.body.classList.remove('theme-dark', 'theme-sepia');
    if (t === 'dark') document.body.classList.add('theme-dark');
    if (t === 'sepia') document.body.classList.add('theme-sepia');
    document.querySelectorAll('.theme-group button').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.theme === t ? 'true' : 'false');
    });
    localStorage.setItem(window.Cadence.dataStore.THEME_KEY, t);
  }

  function applyTextSize(sz) {
    document.documentElement.classList.remove('scale-lg', 'scale-xl');
    if (sz === 'lg') document.documentElement.classList.add('scale-lg');
    if (sz === 'xl') document.documentElement.classList.add('scale-xl');
    document.querySelectorAll('.textsize-group button').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.size === sz ? 'true' : 'false');
    });
    localStorage.setItem(window.Cadence.dataStore.TEXTSIZE_KEY, sz);
  }

  let _selectedHistoryDate = '';

  function getSelectedHistoryDate() {
    if (!_selectedHistoryDate) {
      _selectedHistoryDate = getHelpers().getPastDateString(1);
    }
    return _selectedHistoryDate;
  }

  function setSelectedHistoryDate(d) {
    _selectedHistoryDate = d;
    renderHistoryView();
  }

  function stepHistoryDate(delta) {
    const cur = getSelectedHistoryDate();
    const d = new Date(cur + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const newStr = d.toISOString().slice(0, 10);
    const today = getHelpers().todayStr();
    if (newStr > today) return;
    setSelectedHistoryDate(newStr);
  }

  function renderHistoryView() {
    const dStr = getSelectedHistoryDate();
    const { fmtTime, escapeHtml, todayStr, getPastDateString } = getHelpers();
    const today = todayStr();
    const yesterday = getPastDateString(1);

    // Update Date Input & Label
    const dateInput = document.getElementById('histDatePicker');
    const dateLabel = document.getElementById('histSelectedDateLabel');
    const nextBtn = document.getElementById('histNextDayBtn');
    const countBadge = document.getElementById('historyEventCountBadge');
    const dateSub = document.getElementById('histRhythmDateSub');

    if (dateInput) {
      dateInput.value = dStr;
      dateInput.max = today;
    }

    if (nextBtn) {
      nextBtn.disabled = dStr >= today;
    }

    const dObj = new Date(dStr + 'T12:00:00');
    const prettyDate = dObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const isYest = dStr === yesterday;
    const isTod = dStr === today;

    if (dateLabel) {
      dateLabel.textContent = isYest ? `Yesterday (${prettyDate})` : isTod ? `Today (${prettyDate})` : prettyDate;
    }
    if (dateSub) {
      dateSub.textContent = `— ${prettyDate}`;
    }

    const events = getDayEvents(dStr);
    if (countBadge) {
      countBadge.textContent = `${events.length} event${events.length === 1 ? '' : 's'}`;
    }

    // 1. Build & Populate Historical Clock Face
    const f = document.getElementById('histClockFace');
    if (f) {
      f.querySelectorAll('.hist-marker, .hist-orbit-ring, .hist-num, .hist-activity-dot, .hist-center-dot').forEach(e => e.remove());
      
      // Center Dot
      const cDot = document.createElement('div');
      cDot.className = 'hist-center-dot';
      f.appendChild(cDot);

      // Night Orbit Ring
      const orbit = document.createElement('div');
      orbit.className = 'hist-orbit-ring';
      f.appendChild(orbit);

      // Dial Markers (12 hours)
      for (let i = 0; i < 12; i++) {
        const m = document.createElement('div');
        m.className = 'hist-marker' + (i % 3 === 0 ? ' major' : ' minor');
        m.style.transform = 'rotate(' + (i * 30) + 'deg)';
        f.appendChild(m);
      }

      // High contrast numbers 1 to 12
      const cx = 165, cy = 165, rNum = 132;
      for (let h = 1; h <= 12; h++) {
        const angle = (h * 30) * Math.PI / 180;
        const nx = cx + rNum * Math.sin(angle);
        const ny = cy - rNum * Math.cos(angle);
        const numEl = document.createElement('span');
        const isCardinal = (h % 3 === 0);
        numEl.className = 'hist-num' + (isCardinal ? ' cardinal' : '');
        numEl.style.left = nx + 'px';
        numEl.style.top = ny + 'px';
        numEl.textContent = h;
        f.appendChild(numEl);
      }

      // Render Historical Activity Dots
      events.forEach(entry => {
        if (!entry.time) return;
        const a = timeToAngle(entry.time) * Math.PI / 180;
        const [h, m] = entry.time.split(':').map(Number);
        const totalMinutes = h * 60 + (m || 0);
        const isDaytime = totalMinutes >= 360 && totalMinutes < 1080;
        const dotR = isDaytime ? 144 : 186;

        const dot = document.createElement('button');
        dot.className = 'hist-activity-dot ' + (isDaytime ? 'dot-am' : 'dot-pm');
        dot.style.left = (cx + dotR * Math.sin(a) - 19) + 'px';
        dot.style.top = (cy - dotR * Math.cos(a) - 19) + 'px';
        dot.style.borderColor = entry.borderColor || 'var(--primary)';
        dot.style.background = 'var(--surface)';
        dot.innerHTML = entry.icon;
        dot.title = (entry.tip || entry.label) + ' (' + fmtTime(entry.time) + ')';
        dot.setAttribute('aria-label', (entry.tip || entry.label) + ' at ' + fmtTime(entry.time));
        dot.addEventListener('click', () => {
          getAudio().playSound('click');
          if (entry.onClick) entry.onClick();
          else viewEntry(entry.type, entry.id);
        });
        f.appendChild(dot);
      });
    }

    // 2. Replicate Daily Rhythm Event Grid (Fills square panel properly)
    const ribEl = document.getElementById('histDayRibbon');
    if (ribEl) {
      if (!events.length) {
        ribEl.innerHTML = `
          <div class="hist-empty-state" style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 48px 20px; text-align:center; background:var(--surface); border:2px dashed var(--line); border-radius:var(--radius-md); gap:8px; width:100%;">
            <span style="font-size:2.4rem;">📋</span>
            <span style="font-weight:800;font-size:1.1rem;color:var(--ink);">No events recorded on this date</span>
            <span style="color:var(--ink-soft);font-size:0.9rem;">Use ◀ / ▶ or the date selector above to inspect other past days.</span>
          </div>
        `;
      } else {
        ribEl.innerHTML = events.map(it => {
          const tip = escapeHtml(it.tip || it.label);
          const badgeText = escapeHtml((it.kind || it.type || '').replace('med-', '').replace('motor-', ''));
          const showDetail = it.tip && it.tip !== it.label;
          return `
            <div class="hist-event-card ${it.kind}" role="listitem" title="${tip} at ${fmtTime(it.time)}" tabindex="0">
              <div class="hec-header">
                <span class="hec-time">${fmtTime(it.time)}</span>
                <span class="hec-kind-badge">${badgeText}</span>
              </div>
              <div class="hec-body">
                <span class="hec-icon">${it.icon}</span>
                <span class="hec-title">${escapeHtml(it.label)}</span>
              </div>
              ${showDetail ? `<div class="hec-detail">${escapeHtml(it.tip)}</div>` : ''}
            </div>
          `;
        }).join('');

        ribEl.querySelectorAll('.hist-event-card').forEach((card, idx) => {
          const it = events[idx];
          if (it) {
            const handleCardClick = () => {
              getAudio().playSound('click');
              if (it.onClick) it.onClick();
              else viewEntry(it.type, it.id);
            };
            card.addEventListener('click', handleCardClick);
            card.addEventListener('keydown', e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick();
              }
            });
          }
        });
      }
    }
  }

  function renderAll() {
    try { renderMeds(); } catch (e) { console.error("renderMeds failed:", e); }
    try { renderClockDots(); } catch (e) { console.error("renderClockDots failed:", e); }
    try { renderLogStatus(); } catch (e) { console.error("renderLogStatus failed:", e); }
    try { updateOnOffBadge(); } catch (e) { console.error("updateOnOffBadge failed:", e); }
    try { checkProteinConflictNudge(); } catch (e) {}
    try { updateClock(); } catch (e) { console.error("updateClock failed:", e); }
    try { getMeds().updateDoseClock(); } catch (e) { console.error("updateDoseClock failed:", e); }
    try {
      const aPanel = document.getElementById('analyticsPanel');
      if (aPanel && !aPanel.classList.contains('hidden')) {
        getAnalytics().renderInsightsTab();
      }
    } catch (e) { console.error("renderInsightsTab failed:", e); }
    try { renderDayRibbon(); } catch (e) {}
    try { getHabits().renderHabitTracker(); } catch (e) {}
    try { renderHistoryView(); } catch (e) { console.error("renderHistoryView failed:", e); }
  }

  window.Cadence.uiRenderer = {
    buildClock,
    updateClock,
    renderMeds,
    openEditMedModal,
    renderClockDots,
    renderLogStatus,
    updateOnOffBadge,
    renderDayRibbon,
    viewEntry,
    saveEditedEntry,
    deleteCurrentEntry,
    renderDoctorReport,
    checkProteinConflictNudge,
    applyTheme,
    applyTextSize,
    getDayEvents,
    getSelectedHistoryDate,
    setSelectedHistoryDate,
    stepHistoryDate,
    renderHistoryView,
    renderAll
  };
})();
