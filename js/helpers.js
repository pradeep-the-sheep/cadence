/**
 * Cadence · Parkinson's Daily Companion
 * helpers.js - Utility functions for formatting, math, and data manipulation
 */

window.Cadence = window.Cadence || {};

(function() {
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowHM() {
    return new Date().toTimeString().slice(0, 5);
  }

  function fmtTime(hm) {
    if (!hm) return '';
    const [h, m] = hm.split(':').map(Number);
    const ap = h >= 12 ? 'pm' : 'am';
    const hour12 = ((h + 11) % 12 + 1);
    return hour12 + ':' + String(m).padStart(2, '0') + ap;
  }

  function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function isToday(d) {
    return d === todayStr();
  }

  function isInRange(d, daysBack) {
    if (!daysBack) return isToday(d);
    const now = new Date();
    const then = new Date(d + 'T00:00:00Z');
    const diffMs = now.getTime() - then.getTime();
    return diffMs < daysBack * 86400000 && diffMs >= 0;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function occKey(id, t) {
    return id + '|' + t + '|' + todayStr();
  }

  function getPastDateString(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }

  function confidenceTier(n) {
    if (n >= 14) return 'High';
    if (n >= 5) return 'Medium';
    return 'Low';
  }

  function pearsonR(xs, ys) {
    const n = xs.length;
    if (n < 2) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      dx += (xs[i] - mx) ** 2;
      dy += (ys[i] - my) ** 2;
    }
    return dx && dy ? num / Math.sqrt(dx * dy) : 0;
  }

  window.Cadence.helpers = {
    uid,
    todayStr,
    nowHM,
    fmtTime,
    timeToMinutes,
    isToday,
    isInRange,
    escapeHtml,
    occKey,
    getPastDateString,
    confidenceTier,
    pearsonR
  };
})();
