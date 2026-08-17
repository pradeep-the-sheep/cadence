/**
 * Cadence · Parkinson's Daily Companion
 * modalManager.js - Dynamic modal injection, visibility, voice/photo inputs, and toasts
 */

window.Cadence = window.Cadence || {};

(function() {
  let toastTimer = null;

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    const sr = document.getElementById('srAnnounce');
    if (sr) sr.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    const focusable = modal.querySelector('button, input, select, textarea');
    if (focusable) focusable.focus();
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  }

  function injectAllModals(container = document.body) {
    const Templates = window.Cadence.templates;
    const modalHolder = document.createElement('div');
    modalHolder.id = 'dynamicModalsContainer';
    modalHolder.innerHTML = `
      ${Templates.getFullscreenGameOverlayTemplate()}
      ${Templates.getConsentGateTemplate()}
      ${Templates.getAlarmGateTemplate()}
      ${Templates.getSymptomModalTemplate()}
      ${Templates.getQuickLogModalTemplate()}
      ${Templates.getSleepModalTemplate()}
      ${Templates.getGaitModalTemplate()}
      ${Templates.getMedModalTemplate()}
      ${Templates.getViewEntryModalTemplate()}
      ${Templates.getMedicalIdModalTemplate()}
      ${Templates.getDoctorModalTemplate()}
      ${Templates.getPopupsAndNudgesTemplate()}
    `;
    container.appendChild(modalHolder);

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => closeModal(m.id));
      }
    });
  }

  function initRecorder(btnId, playerId, storageObj) {
    const btn = document.getElementById(btnId);
    const pl = document.getElementById(playerId);
    if (!btn || !pl) return;

    let rec = false;
    let recorder = null;
    let chunks = [];

    btn.addEventListener('click', async () => {
      if (rec) {
        if (recorder) {
          recorder.stop();
          recorder.stream.getTracks().forEach(t => t.stop());
        }
        btn.textContent = '🎤 Voice note';
        btn.classList.remove('recording');
        rec = false;
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorder = new MediaRecorder(stream);
        chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          pl.innerHTML = `<audio controls src="${url}" style="flex:1;min-height:44px"></audio><button class="media-btn" style="flex:none;padding:6px 14px;">✕</button>`;
          pl.classList.remove('hidden');
          pl.querySelector('button')?.addEventListener('click', () => {
            pl.innerHTML = '';
            pl.classList.add('hidden');
            storageObj.value = '';
          });
          const reader = new FileReader();
          reader.onloadend = () => { storageObj.value = reader.result; };
          reader.readAsDataURL(blob);
        };
        recorder.start();
        rec = true;
        btn.textContent = '⏹ Stop';
        btn.classList.add('recording');
      } catch (e) {
        showToast('Could not access microphone.');
      }
    });
  }

  function initPhoto(btnId, inputId, previewId, storageObj) {
    const btn = document.getElementById(btnId);
    const inp = document.getElementById(inputId);
    const prv = document.getElementById(previewId);
    if (!btn || !inp || !prv) return;

    btn.addEventListener('click', () => inp.click());
    inp.addEventListener('change', () => {
      if (!inp.files || !inp.files[0]) return;
      const file = inp.files[0];
      if (file.size > 500000) {
        showToast('Photo too large (max 500KB).');
        return;
      }
      const r = new FileReader();
      r.onloadend = () => {
        const data = r.result;
        const img = document.createElement('img');
        img.src = data;
        img.alt = 'Photo';
        const w = document.createElement('div');
        w.style.cssText = 'position:relative;display:inline-block;';
        w.appendChild(img);
        const d = document.createElement('button');
        d.textContent = '✕';
        d.style.cssText = 'position:absolute;top:-8px;right:-8px;width:28px;height:28px;border-radius:50%;background:var(--alert);color:#fff;border:2px solid #fff;font-size:14px;display:flex;align-items:center;justify-content:center;';
        d.addEventListener('click', () => {
          w.remove();
          storageObj.value = '';
        });
        w.appendChild(d);
        prv.appendChild(w);
        storageObj.value = data;
      };
      r.readAsDataURL(file);
    });
  }

  window.Cadence.modalManager = {
    showToast,
    openModal,
    closeModal,
    injectAllModals,
    initRecorder,
    initPhoto
  };
})();
