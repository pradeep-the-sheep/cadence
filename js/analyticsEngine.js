/**
 * Cadence · Parkinson's Daily Companion
 * analyticsEngine.js - 2-silo cross-correlation engine, SVG charts, daily burden index & weekly health digest
 */

window.Cadence = window.Cadence || {};

(function() {
  function getState() {
    return window.Cadence.dataStore.state;
  }
  function getHelpers() {
    return window.Cadence.helpers;
  }

  function createSvgElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let k in attrs) { el.setAttribute(k, attrs[k]); }
    return el;
  }

  function drawAxisAndGrid(svg, width, height, padLeft, padRight, padTop, padBottom, yTicks, xLabels) {
    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    for (let i = 0; i <= yTicks; i++) {
      const y = padTop + chartHeight * (1 - i / yTicks);
      const grid = createSvgElement('line', { x1: padLeft, y1: y, x2: width - padRight, y2: y, class: 'chart-grid-line' });
      svg.appendChild(grid);

      const val = Math.round(i * (100 / yTicks));
      const lbl = createSvgElement('text', { x: padLeft - 8, y: y + 4, class: 'chart-label-text', 'text-anchor': 'end' });
      lbl.textContent = val + '%';
      svg.appendChild(lbl);
    }

    xLabels.forEach((label, idx) => {
      const x = padLeft + 16 + (chartWidth - 32) * (idx / (xLabels.length - 1));
      const lbl = createSvgElement('text', { x: x, y: height - padBottom + 18, class: 'chart-label-text', 'text-anchor': 'middle' });
      lbl.textContent = label;
      svg.appendChild(lbl);
    });

    const xAxis = createSvgElement('line', { x1: padLeft, y1: height - padBottom, x2: width - padRight, y2: height - padBottom, class: 'chart-axis-line' });
    const yAxis = createSvgElement('line', { x1: padLeft, y1: padTop, x2: padLeft, y2: height - padBottom, class: 'chart-axis-line' });
    svg.appendChild(xAxis);
    svg.appendChild(yAxis);
  }

  function buildSiloData(days = 30) {
    const state = getState();
    const { getPastDateString, timeToMinutes } = getHelpers();
    const lifestyle = [];
    const symptoms = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = getPastDateString(i);
      
      const dayLogs = (state.logs || []).filter(l => l.date === d);
      const dayMeds = (state.medLog || []).filter(l => l.date === d);
      const dayMissed = (state.missedDoses || []).filter(l => l.date === d);
      const daySleep = (state.sleep || []).find(s => s.date === d);
      
      const meals = dayLogs.filter(l => l.type === 'meal');
      const drinks = dayLogs.filter(l => l.type === 'drink');
      const activities = dayLogs.filter(l => l.type === 'activity');
      
      const proteinFlag = meals.some(m => (m.detail || '').toLowerCase().includes('protein') || (m.options || []).includes('protein')) ? 1 : 0;
      const caffeineFlag = drinks.some(dr => (dr.detail || '').toLowerCase().match(/coffee|tea|caffeine|espresso/i)) ? 1 : 0;
      const alcoholFlag = drinks.some(dr => (dr.detail || '').toLowerCase().match(/alcohol|wine|beer|liquor/i)) ? 1 : 0;
      
      let caffeineTime = null;
      if (caffeineFlag) {
        const firstCaff = drinks.find(dr => (dr.detail || '').toLowerCase().match(/coffee|tea|caffeine|espresso/i));
        if (firstCaff && firstCaff.time) caffeineTime = parseInt(firstCaff.time.split(':')[0], 10);
      }

      const exerciseDuration = activities.length * 30;
      let exerciseTimeOfDay = null;
      if (activities.length > 0 && activities[0].time) {
        exerciseTimeOfDay = parseInt(activities[0].time.split(':')[0], 10);
      }
      
      let mealTimingRelToMed = null;
      if (meals.length > 0 && dayMeds.length > 0) {
        let minDelta = Infinity;
        meals.forEach(m => {
          const mMin = timeToMinutes(m.time);
          dayMeds.forEach(med => {
            const medMin = timeToMinutes(med.time);
            const delta = Math.abs(mMin - medMin);
            if (delta < minDelta) minDelta = delta;
          });
        });
        mealTimingRelToMed = minDelta;
      }

      const medAdherenceRate = dayMeds.length / Math.max(dayMeds.length + dayMissed.length, 1);
      const missedDoseFlag = dayMissed.length > 0 ? 1 : 0;
      
      let medTimingDelta = 0;
      if (dayMeds.length > 0) {
        let totalLate = 0;
        let countLate = 0;
        dayMeds.forEach(med => {
          if (med.takenAt && med.time) {
            const expectedMin = timeToMinutes(med.time);
            const actualMin = timeToMinutes(med.takenAt);
            totalLate += Math.max(0, actualMin - expectedMin);
            countLate++;
          }
        });
        medTimingDelta = countLate > 0 ? totalLate / countLate : 0;
      }

      const sleepRating = daySleep ? daySleep.rating : 3;

      lifestyle.push({
        date: d,
        proteinFlag,
        mealTimingRelToMed: mealTimingRelToMed !== null ? mealTimingRelToMed : 0,
        mealCount: meals.length,
        caffeineFlag,
        caffeineTime: caffeineTime !== null ? caffeineTime : 0,
        alcoholFlag,
        exerciseDuration,
        exerciseTimeOfDay: exerciseTimeOfDay !== null ? exerciseTimeOfDay : 0,
        medAdherenceRate,
        medTimingDelta,
        missedDoseFlag,
        sleepRating
      });

      const daySymptoms = (state.symptoms || []).filter(s => s.date === d);
      const dayOnOff = (state.onOffLogs || []).filter(l => l.date === d);
      const dayGait = (state.gait || []).filter(g => g.date === d);

      const avgSymptomSeverity = daySymptoms.length > 0 ? daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length : 0;
      const maxSymptomSeverity = daySymptoms.length > 0 ? Math.max(...daySymptoms.map(s => s.severity)) : 0;
      
      const tremors = daySymptoms.filter(s => (s.name || s.symptom || '').toLowerCase().includes('tremor'));
      const tremorSeverity = tremors.length > 0 ? tremors.reduce((sum, s) => sum + s.severity, 0) / tremors.length : 0;

      const stiffness = daySymptoms.filter(s => (s.name || s.symptom || '').toLowerCase().includes('stiff'));
      const stiffnessSeverity = stiffness.length > 0 ? stiffness.reduce((sum, s) => sum + s.severity, 0) / stiffness.length : 0;

      const fatigue = daySymptoms.filter(s => (s.name || s.symptom || '').toLowerCase().includes('fatigue'));
      const fatigueSeverity = fatigue.length > 0 ? fatigue.reduce((sum, s) => sum + s.severity, 0) / fatigue.length : 0;

      const freezes = dayGait.filter(g => g.type === 'freeze').length + daySymptoms.filter(s => (s.name || s.symptom || '').toLowerCase().includes('freez')).length;
      
      const offStateProportion = dayOnOff.length > 0 ? dayOnOff.filter(l => l.state === 'OFF').length / dayOnOff.length : 0;
      const onStateProportion = dayOnOff.length > 0 ? dayOnOff.filter(l => l.state === 'ON').length / dayOnOff.length : 0;
      const dyskinesiaCount = dayOnOff.filter(l => l.state === 'ON_DYSKINESIA').length;

      symptoms.push({
        date: d,
        avgSymptomSeverity,
        maxSymptomSeverity,
        tremorSeverity,
        stiffnessSeverity,
        fatigueSeverity,
        fogCount: freezes,
        offStateProportion,
        onStateProportion,
        dyskinesiaCount,
        sleepQualityOutcome: sleepRating
      });
    }

    return { lifestyle, symptoms };
  }

  function computeCrossSiloCorrelations(siloData) {
    const { confidenceTier, pearsonR } = getHelpers();
    const results = [];
    if (!siloData || !siloData.lifestyle || !siloData.symptoms || siloData.lifestyle.length === 0) return results;

    const lifestyleKeys = Object.keys(siloData.lifestyle[0]).filter(k => k !== 'date');
    const symptomKeys = Object.keys(siloData.symptoms[0]).filter(k => k !== 'date');

    const labels = {
      proteinFlag: 'Protein Intake', mealTimingRelToMed: 'Meal-Med Gap', mealCount: 'Meal Count',
      caffeineFlag: 'Caffeine Intake', caffeineTime: 'Caffeine Timing', alcoholFlag: 'Alcohol Intake',
      exerciseDuration: 'Exercise Duration', exerciseTimeOfDay: 'Exercise Timing', medAdherenceRate: 'Medication Adherence',
      medTimingDelta: 'Medication Delay', missedDoseFlag: 'Missed Doses', sleepRating: 'Sleep Rating (Lifestyle)',
      avgSymptomSeverity: 'Avg Symptom Severity', maxSymptomSeverity: 'Max Symptom Severity',
      tremorSeverity: 'Tremor Severity', stiffnessSeverity: 'Stiffness Severity', fatigueSeverity: 'Fatigue Severity',
      fogCount: 'Freezing of Gait', offStateProportion: 'OFF-State Proportion', onStateProportion: 'ON-State Proportion',
      dyskinesiaCount: 'Dyskinesia Frequency', sleepQualityOutcome: 'Sleep Quality (Outcome)'
    };

    for (const lKey of lifestyleKeys) {
      for (const sKey of symptomKeys) {
        if (lKey === 'sleepRating' && sKey === 'sleepQualityOutcome') continue;

        const xs = [];
        const ys = [];
        const dates = [];

        for (let i = 0; i < siloData.lifestyle.length; i++) {
          const lx = siloData.lifestyle[i][lKey];
          const sy = siloData.symptoms[i][sKey];
          
          if (typeof lx === 'number' && typeof sy === 'number' && !isNaN(lx) && !isNaN(sy)) {
            xs.push(lx);
            ys.push(sy);
            dates.push(siloData.lifestyle[i].date);
          }
        }

        const n = xs.length;
        if (confidenceTier(n) === 'Low') continue;

        const xVar = xs.some(x => x !== xs[0]);
        const yVar = ys.some(y => y !== ys[0]);
        if (!xVar || !yVar) continue;

        const r = pearsonR(xs, ys);

        if (Math.abs(r) >= 0.7) {
          const direction = r > 0 ? 'positive' : 'negative';
          const dirWord = r > 0 ? 'increase' : 'decrease';
          const sentence = `On days when your ${labels[lKey]} is higher, your ${labels[sKey]} tends to ${dirWord}.`;
          
          let suggestion = `Consider observing how adjusting your ${labels[lKey]} affects your ${labels[sKey]}.`;
          if (r > 0 && ['avgSymptomSeverity', 'offStateProportion', 'dyskinesiaCount', 'tremorSeverity'].includes(sKey)) {
            suggestion = `You may want to monitor if reducing ${labels[lKey]} helps improve your ${labels[sKey]}.`;
          } else if (r < 0 && ['avgSymptomSeverity', 'offStateProportion'].includes(sKey)) {
            suggestion = `You may want to see if maintaining or gently increasing ${labels[lKey]} provides more relief from ${labels[sKey]}.`;
          }

          results.push({
            lifestyleVar: lKey,
            symptomVar: sKey,
            lifestyleLabel: labels[lKey] || lKey,
            symptomLabel: labels[sKey] || sKey,
            r,
            n,
            direction,
            sentence,
            suggestion,
            xs,
            ys,
            dates
          });
        }
      }
    }
    
    return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }

  function computeDailyBurdenIndex(dateStr) {
    const state = getState();
    const dayOnOffLogs = (state.onOffLogs || []).filter(l => l.date === dateStr);
    const offCount = dayOnOffLogs.filter(l => l.state === 'OFF').length;
    const offProp = dayOnOffLogs.length > 0 ? offCount / dayOnOffLogs.length : 0;

    const dyskCount = dayOnOffLogs.filter(l => l.state === 'ON_DYSKINESIA').length;
    const dyskScore = Math.min(dyskCount / Math.max(dayOnOffLogs.length, 1), 1);

    const daySymptoms = (state.symptoms || []).filter(s => s.date === dateStr);
    const avgSev = daySymptoms.length > 0 ? daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length : 0;
    const sevScore = avgSev / 5;

    const dayGait = (state.gait || []).filter(g => g.date === dateStr && g.type === 'freeze');
    const dayFogSymp = daySymptoms.filter(s => (s.name || s.symptom || '').toLowerCase().includes('freez'));
    const fogCount = dayGait.length + dayFogSymp.length;
    const fogScore = Math.min(fogCount / 3, 1);

    const index = (offProp * 0.3 + dyskScore * 0.2 + sevScore * 0.3 + fogScore * 0.2) * 100;
    return Math.round(index);
  }

  function renderBurdenIndexChart() {
    const container = document.getElementById('burdenIndexChart');
    if (!container) return;
    container.innerHTML = '';

    const width = 400;
    const height = 200;
    const svg = createSvgElement('svg', { 
      viewBox: `0 0 ${width} ${height}`, 
      class: 'chart-svg-wrap' 
    });

    const days = 7;
    const data = [];
    const xLabels = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = getHelpers().getPastDateString(i);
      data.push(computeDailyBurdenIndex(d));
      xLabels.push(d.substring(5));
    }

    const padLeft = 40, padRight = 20, padTop = 20, padBottom = 30;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;
    const xStep = chartW / Math.max(1, days - 1);

    drawAxisAndGrid(svg, width, height, padLeft, padRight, padTop, padBottom, 4, xLabels);

    const points = data.map((val, idx) => {
      const x = padLeft + idx * xStep;
      const y = padTop + chartH - (val / 100) * chartH;
      return { x, y, val };
    });

    if (points.length > 0) {
      const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
      const path = createSvgElement('path', {
        d: pathD,
        fill: 'none',
        stroke: 'var(--accent)',
        'stroke-width': '3',
        class: 'chart-line-path'
      });
      svg.appendChild(path);

      points.forEach(p => {
        const circle = createSvgElement('circle', {
          cx: p.x, cy: p.y, r: 4,
          fill: 'var(--accent-dark, var(--accent))',
          class: 'chart-line-dot'
        });
        svg.appendChild(circle);

        const text = createSvgElement('text', {
          x: p.x, y: p.y - 10,
          fill: 'var(--ink)',
          'font-size': '10',
          'text-anchor': 'middle',
          class: 'chart-label-text'
        });
        text.textContent = p.val;
        svg.appendChild(text);
      });
    }

    container.appendChild(svg);
  }

  function renderCorrelationCards(correlations) {
    const container = document.getElementById('correlationCards');
    if (!container) return;
    container.innerHTML = '';

    if (correlations.length === 0) {
      container.innerHTML = `
        <div class="card" style="padding: 24px; text-align: center; color: var(--ink-soft); background: var(--surface); border: 2px dashed var(--line); border-radius: var(--radius-md);">
          <div style="font-size: 2rem; margin-bottom: 6px;">💡</div>
          <div style="font-weight: 800; font-size: 1.15rem; color: var(--ink); margin-bottom: 4px;">No Patterns Discovered Yet</div>
          <div style="font-size: 0.95rem;">Keep logging daily entries, or tap <strong>"🧪 Generate Clinical 7-Day Dataset"</strong> below to see sample connection boxes.</div>
        </div>`;
      return;
    }

    const seenCategoryPairs = new Set();
    const topTakeaways = [];

    correlations.forEach(corr => {
      let lCat = corr.lifestyleVar.toLowerCase().includes('exercise') ? 'exercise'
        : corr.lifestyleVar.toLowerCase().includes('protein') ? 'protein'
        : corr.lifestyleVar.toLowerCase().includes('meal') ? 'meal'
        : corr.lifestyleVar.toLowerCase().includes('caffeine') ? 'caffeine'
        : corr.lifestyleVar.toLowerCase().includes('alcohol') ? 'alcohol'
        : corr.lifestyleVar;

      let sCat = corr.symptomVar.toLowerCase().includes('onstate') || corr.symptomVar.toLowerCase().includes('offstate') ? 'motor_state'
        : corr.symptomVar.toLowerCase().includes('fog') || corr.symptomVar.toLowerCase().includes('gait') ? 'fog'
        : corr.symptomVar.toLowerCase().includes('severity') || corr.symptomVar.toLowerCase().includes('tremor') || corr.symptomVar.toLowerCase().includes('stiff') || corr.symptomVar.toLowerCase().includes('fatigue') ? 'symptom_severity'
        : corr.symptomVar;

      const pairKey = `${lCat}_${sCat}`;
      if (!seenCategoryPairs.has(pairKey) && topTakeaways.length < 3) {
        seenCategoryPairs.add(pairKey);
        topTakeaways.push(corr);
      }
    });

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '14px';

    topTakeaways.forEach((corr) => {
      let icon1 = '💡';
      let icon2 = '📊';
      let simpleExplanation = '';
      let isPositiveEffect = true;

      const lName = corr.lifestyleVar.toLowerCase();
      const sName = corr.symptomVar.toLowerCase();

      if (lName.includes('exercise')) icon1 = '🏃';
      else if (lName.includes('protein')) icon1 = '🥩';
      else if (lName.includes('meal')) icon1 = '🍽️';
      else if (lName.includes('caffeine')) icon1 = '☕';
      else if (lName.includes('alcohol')) icon1 = '🍷';
      else if (lName.includes('sleep')) icon1 = '🛌';
      else if (lName.includes('med')) icon1 = '💊';

      if (sName.includes('onstate')) {
        icon2 = '🟢';
        isPositiveEffect = (corr.r > 0);
        simpleExplanation = isPositiveEffect
          ? "More daily exercise ➡️ Increases your good ON-state movement time."
          : "Less exercise ➡️ Reduces your good ON-state movement time.";
      } else if (sName.includes('offstate')) {
        icon2 = '🔴';
        isPositiveEffect = (corr.r < 0);
        simpleExplanation = (corr.r < 0)
          ? "Regular exercise ➡️ Helps reduce bad OFF-state stiffness and immobility."
          : "Skipping exercise ➡️ Leads to more OFF-state periods during the day.";
      } else if (sName.includes('fog') || sName.includes('gait')) {
        icon2 = '🧊';
        isPositiveEffect = (corr.r < 0);
        if (lName.includes('protein')) {
          simpleExplanation = "Eating protein near medication time ➡️ Leads to more freezing of gait (blocks pill absorption).";
        } else if (lName.includes('meal')) {
          simpleExplanation = "Spacing meals away from medication ➡️ Leads to fewer freezing episodes and smoother walking.";
        } else {
          simpleExplanation = `Adjusting ${corr.lifestyleLabel} ➡️ Directly affects freezing of gait.`;
        }
      } else if (sName.includes('severity') || sName.includes('tremor') || sName.includes('stiff') || sName.includes('fatigue')) {
        icon2 = '🤒';
        isPositiveEffect = (corr.r < 0);
        simpleExplanation = (corr.r < 0)
          ? `Higher ${corr.lifestyleLabel} ➡️ Helps lower your overall symptom severity.`
          : `Higher ${corr.lifestyleLabel} ➡️ Tends to increase your symptom discomfort.`;
      } else {
        icon2 = (corr.r > 0) ? '📈' : '📉';
        isPositiveEffect = (corr.r > 0);
        simpleExplanation = corr.sentence;
      }

      const tagText = isPositiveEffect ? '🟢 Positive Outcome' : '🔴 Symptom Risk';
      const tagBg = isPositiveEffect ? '#DCFCE7' : '#FEE2E2';
      const tagColor = isPositiveEffect ? '#15803D' : '#B91C1C';
      const boxAccentBorder = isPositiveEffect ? '2px solid #86EFAC' : '2px solid #FCA5A5';

      const box = document.createElement('div');
      box.className = 'card';
      box.style.padding = '18px 20px';
      box.style.backgroundColor = 'var(--surface)';
      box.style.border = boxAccentBorder;
      box.style.borderRadius = '16px';
      box.style.boxShadow = 'var(--shadow-sm)';

      const { escapeHtml } = getHelpers();

      box.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px; background: var(--surface-2); padding: 8px 16px; border-radius: 999px; border: 1px solid var(--line);">
            <span style="font-size: 1.6rem;">${icon1}</span>
            <span style="font-size: 1.1rem; color: var(--primary); font-weight: 900;">➡️</span>
            <span style="font-size: 1.6rem;">${icon2}</span>
          </div>
          <span style="font-size: 0.8rem; font-weight: 800; background: ${tagBg}; color: ${tagColor}; padding: 4px 12px; border-radius: 999px;">
            ${tagText}
          </span>
        </div>

        <div style="font-weight: 800; font-size: 1.1rem; color: var(--ink); margin-bottom: 6px;">
          ${escapeHtml(corr.lifestyleLabel)} &amp; ${escapeHtml(corr.symptomLabel)}
        </div>

        <div style="font-size: 1.05rem; color: var(--ink); line-height: 1.5; font-weight: 600; margin-bottom: 10px; background: var(--surface-2); padding: 10px 14px; border-radius: 10px; border-left: 4px solid ${isPositiveEffect ? '#22C55E' : '#EF4444'};">
          ${escapeHtml(simpleExplanation)}
        </div>

        <div style="font-size: 0.95rem; color: var(--ink-soft); font-weight: 600;">
          💡 <strong>Simple Tip:</strong> ${escapeHtml(corr.suggestion)}
        </div>
      `;

      wrapper.appendChild(box);
    });

    container.appendChild(wrapper);
  }

  function generateWeeklyDigest() {
    const { getPastDateString } = getHelpers();
    let thisWeekBurdenSum = 0;
    for (let i = 0; i < 7; i++) {
      thisWeekBurdenSum += computeDailyBurdenIndex(getPastDateString(i));
    }
    const thisWeekBurdenAvg = Math.round(thisWeekBurdenSum / 7);

    let lastWeekBurdenSum = 0;
    for (let i = 7; i < 14; i++) {
      lastWeekBurdenSum += computeDailyBurdenIndex(getPastDateString(i));
    }
    const lastWeekBurdenAvg = Math.round(lastWeekBurdenSum / 7);
    
    const burdenDiff = thisWeekBurdenAvg - lastWeekBurdenAvg;
    let burdenMsg = '';
    if (burdenDiff < 0) {
      burdenMsg = `🟢 Your composite <strong>Symptom Burden Index improved</strong> to <strong>${thisWeekBurdenAvg}/100</strong> this week (down from <strong>${lastWeekBurdenAvg}/100</strong> last week, a reduction of <strong>${Math.abs(burdenDiff)}</strong> points).`;
    } else if (burdenDiff > 0) {
      burdenMsg = `🔴 Your composite <strong>Symptom Burden Index increased</strong> to <strong>${thisWeekBurdenAvg}/100</strong> this week (up from <strong>${lastWeekBurdenAvg}/100</strong> last week, an increase of <strong>${burdenDiff}</strong> points).`;
    } else {
      burdenMsg = `➡️ Your composite <strong>Symptom Burden Index remained stable</strong> at <strong>${thisWeekBurdenAvg}/100</strong> (same as last week).`;
    }

    const silo14 = buildSiloData(14);
    const correlations = computeCrossSiloCorrelations(silo14);
    
    let correlationMsg = '';
    if (correlations.length > 0) {
      const topCorr = correlations[0];
      const lKey = topCorr.lifestyleVar;
      const sKey = topCorr.symptomVar;
      
      let thisLSum = 0, lastLSum = 0;
      let thisSSum = 0, lastSSum = 0;
      
      for (let i = 0; i < 7; i++) {
        thisLSum += silo14.lifestyle[13 - i][lKey] || 0;
        thisSSum += silo14.symptoms[13 - i][sKey] || 0;
      }
      for (let i = 7; i < 14; i++) {
        lastLSum += silo14.lifestyle[13 - i][lKey] || 0;
        lastSSum += silo14.symptoms[13 - i][sKey] || 0;
      }
      
      const thisLAvg = Math.round((thisLSum / 7) * 10) / 10;
      const lastLAvg = Math.round((lastLSum / 7) * 10) / 10;
      const thisSAvg = Math.round((thisSSum / 7) * 10) / 10;
      const lastSAvg = Math.round((lastSSum / 7) * 10) / 10;
      
      let lTrend = thisLAvg > lastLAvg ? 'increased' : thisLAvg < lastLAvg ? 'decreased' : 'stayed constant';
      let sTrend = thisSAvg > lastSAvg ? 'worsened' : thisSAvg < lastSAvg ? 'improved' : 'stayed constant';
      if (sKey === 'onStateProportion' || sKey === 'sleepQualityOutcome') {
        sTrend = thisSAvg > lastSAvg ? 'improved' : thisSAvg < lastSAvg ? 'worsened' : 'stayed constant';
      }
      
      correlationMsg = `💡 <strong>Key Correlation Update:</strong> Your top pattern connects <strong>${topCorr.lifestyleLabel}</strong> with <strong>${topCorr.symptomLabel}</strong> (coefficient r = ${topCorr.r}). This week, your ${topCorr.lifestyleLabel} ${lTrend} (avg ${thisLAvg} vs ${lastLAvg} last week), and consequently your ${topCorr.symptomLabel} ${sTrend} (avg ${thisSAvg} vs ${lastSAvg} last week).`;
    } else {
      correlationMsg = `💡 <strong>Key Correlation Update:</strong> No strong correlation patterns have been identified yet. Log more daily activities, meals, and symptoms to discover links between your lifestyle and motor states.`;
    }

    return `
      <div class="card" id="insightsDigestCard" style="background: linear-gradient(135deg, var(--surface), var(--surface-2)) !important; border: 3.5px solid var(--primary) !important; padding: 22px 24px; border-radius: var(--radius-lg); position: relative; margin-bottom: 22px; box-shadow: var(--shadow-md);">
        <button id="btnDismissDigest" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--ink-soft); outline: none;">✕</button>
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">✨ Weekly Health Digest</h3>
        <div style="font-size: 1.05rem; line-height: 1.6; display: flex; flex-direction: column; gap: 10px;">
          <p style="margin: 0;">${burdenMsg}</p>
          <p style="margin: 0;">${correlationMsg}</p>
        </div>
        <div style="margin-top: 14px; font-size: 0.82rem; color: var(--ink-faint); font-weight: 600;">
          Digest compares last 7 days to the previous 7 days (days 7-13).
        </div>
      </div>
    `;
  }

  function renderAnalytics() {
    const state = getState();
    const { getPastDateString, timeToMinutes } = getHelpers();
    const w = 400, h = 200;
    const padLeft = 55, padRight = 20, padTop = 20, padBottom = 35;
    const days = [];
    const dayLabels = [];

    for (let i = 6; i >= 0; i--) {
      const dStr = getPastDateString(i);
      days.push(dStr);
      const d = new Date(dStr + 'T00:00:00Z');
      dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }));
    }

    // Chart 1: Medication Adherence
    const chartAdh = document.getElementById('chartAdherence');
    if (chartAdh) {
      chartAdh.innerHTML = '';
      const svg = createSvgElement('svg', { viewBox: `0 0 ${w} ${h}` });
      drawAxisAndGrid(svg, w, h, padLeft, padRight, padTop, padBottom, 4, dayLabels);

      days.forEach((day, idx) => {
        const taken = (state.medLog || []).filter(l => l.date === day).length;
        const missed = (state.missedDoses || []).filter(l => l.date === day).length;
        const total = taken + missed;
        const rate = total ? taken / total : (taken > 0 ? 1 : 0);
        const pct = Math.round(rate * 100);

        const x = padLeft + 16 + (w - padLeft - padRight - 32) * (idx / 6) - 10;
        const barH = (h - padTop - padBottom) * rate;
        const y = h - padBottom - barH;

        const rect = createSvgElement('rect', {
          x: x, y: y, width: 20, height: Math.max(barH, 2),
          class: 'chart-bar-adherence',
          style: 'cursor: pointer; transition: opacity 0.2s;'
        });
        rect.style.fill = 'var(--primary)';
        
        const tooltip = createSvgElement('title');
        tooltip.textContent = `📅 ${dayLabels[idx]} (${day}): ${pct}% Adherence (${taken} taken, ${missed} missed out of ${total || taken} scheduled doses)`;
        rect.appendChild(tooltip);

        svg.appendChild(rect);

        const txt = createSvgElement('text', { x: x + 10, y: y - 5, class: 'chart-label-text', 'text-anchor': 'middle' });
        txt.textContent = pct + '%';
        svg.appendChild(txt);
      });
      chartAdh.appendChild(svg);
    }

    // Chart 2: Motor States
    const chartMtr = document.getElementById('chartMotorStates');
    if (chartMtr) {
      chartMtr.innerHTML = '';
      const svg = createSvgElement('svg', { viewBox: `0 0 ${w} ${h}` });
      drawAxisAndGrid(svg, w, h, padLeft, padRight, padTop, padBottom, 4, dayLabels);

      days.forEach((day, idx) => {
        const logs = (state.onOffLogs || []).filter(l => l.date === day);
        const ct = { ON: 0, ON_DYSKINESIA: 0, OFF: 0 };
        logs.forEach(l => { if (ct[l.state] !== undefined) ct[l.state]++; });

        const total = ct.ON + ct.ON_DYSKINESIA + ct.OFF || 1;
        const ratioOn = ct.ON / total;
        const ratioDys = ct.ON_DYSKINESIA / total;
        const ratioOff = ct.OFF / total;

        const x = padLeft + 16 + (w - padLeft - padRight - 32) * (idx / 6) - 10;
        const fullH = h - padTop - padBottom;

        const hOn = fullH * ratioOn;
        const hDys = fullH * ratioDys;
        const hOff = fullH * ratioOff;

        let curY = h - padBottom;

        if (hOff > 0) {
          curY -= hOff;
          const rect = createSvgElement('rect', { x: x, y: curY, width: 20, height: hOff, style: 'cursor: pointer;' });
          rect.style.fill = '#DC2626';
          const title = createSvgElement('title');
          title.textContent = `🔴 ${dayLabels[idx]} (${day}) OFF State: ${Math.round(ratioOff * 100)}% (${ct.OFF} periods)`;
          rect.appendChild(title);
          svg.appendChild(rect);
        }
        if (hDys > 0) {
          curY -= hDys;
          const rect = createSvgElement('rect', { x: x, y: curY, width: 20, height: hDys, style: 'cursor: pointer;' });
          rect.style.fill = '#CA8A04';
          const title = createSvgElement('title');
          title.textContent = `🟡 ${dayLabels[idx]} (${day}) Dyskinesia State: ${Math.round(ratioDys * 100)}% (${ct.ON_DYSKINESIA} periods)`;
          rect.appendChild(title);
          svg.appendChild(rect);
        }
        if (hOn > 0) {
          curY -= hOn;
          const rect = createSvgElement('rect', { x: x, y: curY, width: 20, height: hOn, style: 'cursor: pointer;' });
          rect.style.fill = '#16A34A';
          const title = createSvgElement('title');
          title.textContent = `🟢 ${dayLabels[idx]} (${day}) ON State: ${Math.round(ratioOn * 100)}% (${ct.ON} periods)`;
          rect.appendChild(title);
          svg.appendChild(rect);
        }
      });
      chartMtr.appendChild(svg);
    }

    // Chart 3: Severity & Context
    const chartSx = document.getElementById('chartSymptomSeverity');
    if (chartSx) {
      chartSx.innerHTML = '';
      const svg = createSvgElement('svg', { viewBox: `0 0 ${w} ${h}` });

      const chartWidth = w - padLeft - padRight;
      const chartHeight = h - padTop - padBottom;

      for (let i = 1; i <= 5; i++) {
        const y = padTop + chartHeight * (1 - (i - 1) / 4);
        const grid = createSvgElement('line', { x1: padLeft, y1: y, x2: w - padRight, y2: y, class: 'chart-grid-line' });
        svg.appendChild(grid);

        const lbl = createSvgElement('text', { x: padLeft - 8, y: y + 4, class: 'chart-label-text', 'text-anchor': 'end' });
        lbl.textContent = i === 1 ? '1 (Mild)' : i === 5 ? '5 (Sev)' : i;
        svg.appendChild(lbl);
      }

      dayLabels.forEach((label, idx) => {
        const x = padLeft + 16 + (chartWidth - 32) * (idx / 6);
        const lbl = createSvgElement('text', { x: x, y: h - padBottom + 18, class: 'chart-label-text', 'text-anchor': 'middle' });
        lbl.textContent = label;
        svg.appendChild(lbl);
      });

      const xAxis = createSvgElement('line', { x1: padLeft, y1: h - padBottom, x2: w - padRight, y2: h - padBottom, class: 'chart-axis-line' });
      const yAxis = createSvgElement('line', { x1: padLeft, y1: padTop, x2: padLeft, y2: h - padBottom, class: 'chart-axis-line' });
      svg.appendChild(xAxis);
      svg.appendChild(yAxis);

      const points = [];
      days.forEach((day, idx) => {
        const daySx = (state.symptoms || []).filter(s => s.date === day);
        if (daySx.length) {
          const avg = daySx.reduce((acc, curr) => acc + curr.severity, 0) / daySx.length;
          const x = padLeft + 16 + (chartWidth - 32) * (idx / 6);
          const y = padTop + chartHeight * (1 - (avg - 1) / 4);
          points.push({ x, y, val: Math.round(avg * 10) / 10, date: day, count: daySx.length, dayLabel: dayLabels[idx] });
        }
      });

      if (points.length > 1) {
        const pathData = 'M ' + points.map(p => `${p.x},${p.y}`).join(' L ');
        const path = createSvgElement('path', { d: pathData, class: 'chart-line-path' });
        path.style.stroke = 'var(--accent)';
        svg.appendChild(path);
      }

      points.forEach(p => {
        const dayLogs = (state.logs || []).filter(l => l.date === p.date);
        let iconStr = '';
        if (dayLogs.some(l => l.detail?.toLowerCase().includes('walk') || l.detail?.toLowerCase().includes('stretch'))) iconStr += '🚶 Exercise ';
        if (dayLogs.some(l => l.detail?.toLowerCase().includes('wine') || l.detail?.toLowerCase().includes('alcohol') || l.detail?.toLowerCase().includes('beer'))) iconStr += '🍷 Alcohol ';
        if (dayLogs.some(l => l.detail?.toLowerCase().includes('coffee') || l.detail?.toLowerCase().includes('tea'))) iconStr += '☕ Caffeine ';

        const dot = createSvgElement('circle', { cx: p.x, cy: p.y, r: 6, class: 'chart-line-dot', style: 'cursor: pointer;' });
        dot.style.fill = 'var(--accent-dark)';
        
        const title = createSvgElement('title');
        title.textContent = `🤒 ${p.dayLabel} (${p.date}): Avg Symptom Severity ${p.val} / 5 (${p.count} entries logged)${iconStr ? '\nContext: ' + iconStr : ''}`;
        dot.appendChild(title);
        svg.appendChild(dot);

        if (iconStr) {
          const iconTxt = createSvgElement('text', { x: p.x, y: p.y + 16, style: "font-size:12px; text-anchor:middle; cursor: pointer;" });
          iconTxt.textContent = iconStr.split(' ')[0];
          const iconTitle = createSvgElement('title');
          iconTitle.textContent = `Context on ${p.dayLabel}: ${iconStr}`;
          iconTxt.appendChild(iconTitle);
          svg.appendChild(iconTxt);
        }

        const txt = createSvgElement('text', { x: p.x, y: p.y - 8, class: 'chart-label-text', 'text-anchor': 'middle' });
        txt.textContent = p.val;
        svg.appendChild(txt);
      });

      chartSx.appendChild(svg);
    }

    // Chart 4: Gait Events
    const chartGait = document.getElementById('chartGaitIncidents');
    if (chartGait) {
      chartGait.innerHTML = '';
      const svg = createSvgElement('svg', { viewBox: `0 0 ${w} ${h}` });

      const chartWidth = w - padLeft - padRight;
      const chartHeight = h - padTop - padBottom;

      for (let i = 1; i <= 5; i++) {
        const y = padTop + chartHeight * (1 - (i - 1) / 4);
        const grid = createSvgElement('line', { x1: padLeft, y1: y, x2: w - padRight, y2: y, class: 'chart-grid-line' });
        svg.appendChild(grid);

        const lbl = createSvgElement('text', { x: padLeft - 8, y: y + 4, class: 'chart-label-text', 'text-anchor': 'end' });
        lbl.textContent = i === 1 ? 'L1 (Minor)' : i === 5 ? 'L5 (Severe)' : 'L' + i;
        svg.appendChild(lbl);
      }

      dayLabels.forEach((label, idx) => {
        const x = padLeft + 16 + (chartWidth - 32) * (idx / 6);
        const lbl = createSvgElement('text', { x: x, y: h - padBottom + 18, class: 'chart-label-text', 'text-anchor': 'middle' });
        lbl.textContent = label;
        svg.appendChild(lbl);
      });

      const xAxis = createSvgElement('line', { x1: padLeft, y1: h - padBottom, x2: w - padRight, y2: h - padBottom, class: 'chart-axis-line' });
      const yAxis = createSvgElement('line', { x1: padLeft, y1: padTop, x2: padLeft, y2: h - padBottom, class: 'chart-axis-line' });
      svg.appendChild(xAxis);
      svg.appendChild(yAxis);

      days.forEach((day, idx) => {
        const dayGaitEvents = (state.gait || []).filter(g => g.date === day);
        dayGaitEvents.forEach(e => {
          const x = padLeft + 16 + (chartWidth - 32) * (idx / 6);
          const y = padTop + chartHeight * (1 - (e.severity - 1) / 4);
          const r = 8 + e.severity * 2.5;

          const dayMeals = (state.logs || []).filter(l => l.date === day && l.type === 'meal' && (l.options?.includes('protein') || l.detail?.toLowerCase().includes('protein')));
          let isProteinConflict = false;
          dayMeals.forEach(meal => {
            const mealMin = timeToMinutes(meal.time);
            const eventMin = timeToMinutes(e.time);
            if (Math.abs(mealMin - eventMin) <= 60) {
              isProteinConflict = true;
            }
          });

          const bubble = createSvgElement('circle', {
            cx: x, cy: y, r: r,
            class: e.type === 'fall' ? 'chart-bubble-fall' : e.type === 'freeze' ? 'chart-bubble-freeze' : 'chart-bubble-gait',
            style: 'cursor: pointer;'
          });

          if (isProteinConflict) {
            bubble.setAttribute('stroke', '#EF4444');
            bubble.setAttribute('stroke-width', '2.5px');
            bubble.setAttribute('stroke-dasharray', '2,2');
          }

          const typeName = e.type === 'fall' ? 'Fall Event ⚠️' : e.type === 'freeze' ? 'Freezing of Gait 🧊' : 'Gait Event 🦯';
          const title = createSvgElement('title');
          title.textContent = `🦯 ${dayLabels[idx]} (${day}): ${typeName} (Severity ${e.severity}/5) at ${e.time || 'daytime'}${isProteinConflict ? '\n🚨 Protein meal eaten within 60 mins of med dose!' : ''}`;
          bubble.appendChild(title);

          svg.appendChild(bubble);

          const textChar = e.type === 'fall' ? '⚠️' : e.type === 'freeze' ? '🧊' : '🦯';
          const txt = createSvgElement('text', { x: x, y: y + 4, style: "font-size:10px; text-anchor:middle; fill:#fff; pointer-events: none;" });
          txt.textContent = textChar;
          svg.appendChild(txt);
        });
      });

      chartGait.appendChild(svg);
    }
  }

  function renderInsightsTab() {
    renderAnalytics();
    renderBurdenIndexChart();

    const digestArea = document.getElementById('insightsDigestArea');
    if (digestArea) {
      if (!window._insightsDigestSeen) {
        digestArea.innerHTML = generateWeeklyDigest();
        document.getElementById('btnDismissDigest')?.addEventListener('click', () => {
          window._insightsDigestSeen = true;
          const card = document.getElementById('insightsDigestCard');
          if (card) card.style.display = 'none';
        });
      } else {
        digestArea.innerHTML = '';
      }
    }

    const siloData = buildSiloData(7);
    const correlations = computeCrossSiloCorrelations(siloData);
    renderCorrelationCards(correlations);
  }

  window.Cadence.analyticsEngine = {
    createSvgElement,
    drawAxisAndGrid,
    buildSiloData,
    computeCrossSiloCorrelations,
    computeDailyBurdenIndex,
    renderBurdenIndexChart,
    renderCorrelationCards,
    generateWeeklyDigest,
    renderAnalytics,
    renderInsightsTab
  };
})();
