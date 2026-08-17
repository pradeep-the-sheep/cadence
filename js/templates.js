/**
 * Cadence · Parkinson's Daily Companion
 * templates.js - Dynamic HTML template literals for all modals and dialogs
 */

window.Cadence = window.Cadence || {};

(function() {
  function getFullscreenGameOverlayTemplate() {
    return `
      <div class="fullscreen-game-overlay hidden" id="fullscreenGameOverlay">
        <div class="fullscreen-game-header">
          <button type="button" class="btn-exit-game" id="btnExitFullscreenGame">✕ Exit Game to Cadence</button>
        </div>
        <iframe id="fullscreenGameIframe" class="fullscreen-game-frame" allow="camera; microphone; accelerometer; gyroscope; fullscreen"></iframe>
      </div>
    `;
  }

  function getConsentGateTemplate() {
    return `
      <div class="gate" id="consentGate" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
        <div class="gatecard">
          <h1 id="gateTitle">Before you start</h1>
          <p class="lead">Cadence helps you track Parkinson's-related health data including medications, symptoms, gait, sleep, and diet. Under the GDPR, this qualifies as health data and requires your explicit consent.</p>
          <div class="policytext" tabindex="0" aria-label="Privacy notice">
            <h3>What data is processed</h3><p>Medication schedules &amp; doses, symptom logs, gait/balance events, sleep ratings, meal logs, activity records, voice memos, and photos — all classified as health data under Art. 9 GDPR.</p>
            <h3>Where &amp; how it's stored</h3><p>All data is stored exclusively in your browser's <strong>localStorage</strong> on this device. No data is transmitted, uploaded, or shared with any server, third party, or cloud service.</p>
            <h3>Legal basis (Art. 6 &amp; 9 GDPR)</h3><p>Processing is based on your <strong>explicit consent</strong> (Art. 9(2)(a)). You may withdraw at any time, which permanently deletes all data.</p>
            <h3>Data retention</h3><p>Data is retained indefinitely on this device until you either <strong>delete it</strong> (footer → Clear all data) or <strong>withdraw consent</strong> (footer → Withdraw consent), which triggers permanent erasure.</p>
            <h3>Your rights (Art. 15–22 GDPR)</h3><ul><li><strong>Access</strong> — export your data anytime via footer.</li><li><strong>Rectification</strong> — edit or delete individual entries.</li><li><strong>Erasure</strong> — delete all data or withdraw consent.</li><li><strong>Portability</strong> — export as JSON, import on any device.</li><li><strong>Withdraw consent</strong> — deletes all data immediately.</li></ul>
            <h3>Data Protection Officer</h3><p><strong>Not applicable</strong> — no data leaves this device. No processing outside your control occurs. For any privacy questions, contact <strong>cadence@app.local</strong>.</p>
            <h3>Age requirement</h3><p>You must be <strong>16 years or older</strong> to use Cadence. If you are under 16, please do not use this application.</p>
          </div>
          <div class="consentrow">
            <input type="checkbox" id="consentCheck">
            <label for="consentCheck">I am <strong>16 or older</strong>, have read the notice above, and <strong>consent</strong> to Cadence processing my health data (medications, symptoms, gait, sleep, and other personal health information) on this device for personal health tracking. I understand my data is stored <strong>only locally</strong> and may be deleted or exported anytime under my <strong>GDPR rights</strong>.</label>
          </div>
          <div class="gateactions">
            <button class="btn primary" id="consentContinueBtn" disabled>Begin my day with Cadence →</button>
          </div>
        </div>
      </div>
    `;
  }

  function getAlarmGateTemplate() {
    return `
      <div class="alarmgate hidden" id="alarmGate" role="alertdialog" aria-modal="true" aria-labelledby="alarmTitle" aria-live="assertive">
        <div class="alarmcard">
          <div class="bell" aria-hidden="true">💊</div>
          <h1 id="alarmTitle">Time for your medication</h1>
          <div class="medline" id="alarmMedLine">—</div>
          <div class="subline">Have you taken this dose?</div>
          <div class="alarmactions">
            <button class="btn primary" id="alarmTakenBtn">✅ Yes, I've taken it</button>
            <button class="btn accent" id="alarmSnoozeBtn">⏰ Push forward 30 minutes</button>
            <button class="btn ghost" id="alarmSkipBtn">❌ Skip this dose</button>
          </div>
        </div>
      </div>
    `;
  }

  function getSymptomModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="sxModal" role="dialog" aria-modal="true" aria-labelledby="sxTitle">
        <div class="modal-card wide">
          <h2 id="sxTitle" style="text-align:center;">Log symptom</h2>
          <div class="field sx-step">
            <label>1. What symptoms are you experiencing?</label>
            <div class="symp-count" id="sxCount">0 selected</div>
            <div class="symptom-wheel" id="symptomWheel" role="group" aria-label="Symptom selection">
              <button type="button" class="sx-wheel-btn" data-symptom="Tremor" role="checkbox" aria-checked="false"><span class="sx-icon">🫨</span><span class="sx-label">Tremor</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Stiffness" role="checkbox" aria-checked="false"><span class="sx-icon">🦵</span><span class="sx-label">Stiffness</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Freezing" role="checkbox" aria-checked="false"><span class="sx-icon">🦶</span><span class="sx-label">Freezing</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Dyskinesia" role="checkbox" aria-checked="false"><span class="sx-icon">🌀</span><span class="sx-label">Dyskinesia</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Fatigue" role="checkbox" aria-checked="false"><span class="sx-icon">🥱</span><span class="sx-label">Fatigue</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Brain Fog" role="checkbox" aria-checked="false"><span class="sx-icon">🧠</span><span class="sx-label">Brain Fog</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Dizziness" role="checkbox" aria-checked="false"><span class="sx-icon">💫</span><span class="sx-label">Dizziness</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Pain" role="checkbox" aria-checked="false"><span class="sx-icon">🤕</span><span class="sx-label">Pain</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Anxiety" role="checkbox" aria-checked="false"><span class="sx-icon">🧠</span><span class="sx-label">Anxiety</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Constipation" role="checkbox" aria-checked="false"><span class="sx-icon">🚽</span><span class="sx-label">Constipation</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Sleep Issues" role="checkbox" aria-checked="false"><span class="sx-icon">🛌✨</span><span class="sx-label">Sleep Issues</span></button>
              <button type="button" class="sx-wheel-btn" data-symptom="Speech Issues" role="checkbox" aria-checked="false"><span class="sx-icon">🗣️</span><span class="sx-label">Speech Issues</span></button>
              <button type="button" class="sx-wheel-btn" id="sxOtherBtn" data-symptom="Other" role="checkbox" aria-checked="false" style="grid-column:1/-1;"><span class="sx-icon">✏️</span><span class="sx-label">Other</span></button>
            </div>
            <div id="sxOtherWrap" style="display:none;margin-top:10px;text-align:center;">
              <input type="text" id="sxOtherInput" placeholder="Type your symptom..." style="width:100%;max-width:400px;border:3px solid var(--line);border-radius:var(--radius-sm);padding:14px 18px;font-size:1.1rem;background:var(--surface-2);color:inherit;min-height:52px;">
            </div>
          </div>
          <div class="field sx-step">
            <label>2. Where does it affect you?</label>
            <div class="body-grid" id="bodyPicker" role="group" aria-label="Body location">
              <button type="button" class="body-btn" data-part="head" role="checkbox" aria-checked="false">🫣 Head</button>
              <button type="button" class="body-btn" data-part="neck" role="checkbox" aria-checked="false">🦒 Neck</button>
              <button type="button" class="body-btn" data-part="shoulder" role="checkbox" aria-checked="false">🫳 Shoulder</button>
              <button type="button" class="body-btn" data-part="arm" role="checkbox" aria-checked="false">💪 Arm</button>
              <button type="button" class="body-btn" data-part="hand" role="checkbox" aria-checked="false">🤚 Hand</button>
              <button type="button" class="body-btn" data-part="chest" role="checkbox" aria-checked="false">🫀 Chest</button>
              <button type="button" class="body-btn" data-part="back" role="checkbox" aria-checked="false">🔙 Back</button>
              <button type="button" class="body-btn" data-part="stomach" role="checkbox" aria-checked="false">🫃 Stomach</button>
              <button type="button" class="body-btn" data-part="leg" role="checkbox" aria-checked="false">🦵 Leg</button>
            </div>
          </div>
          <div class="field sx-step" style="text-align:center;">
            <label>3. How severe is it?</label>
            <div class="sev-row" id="sevPicker" role="radiogroup" aria-label="Severity level">
              <button type="button" class="sev-btn" data-sev="1" role="radio" aria-checked="false" aria-label="Mild"><span class="sev-emoji">😌</span><span class="sev-label">Mild</span></button>
              <button type="button" class="sev-btn" data-sev="2" role="radio" aria-checked="false" aria-label="Moderate"><span class="sev-emoji">🙂</span><span class="sev-label">Moderate</span></button>
              <button type="button" class="sev-btn" data-sev="3" role="radio" aria-checked="false" aria-label="Moderate-severe"><span class="sev-emoji">😟</span><span class="sev-label">Moderate-Severe</span></button>
              <button type="button" class="sev-btn" data-sev="4" role="radio" aria-checked="false" aria-label="Severe"><span class="sev-emoji">😢</span><span class="sev-label">Severe</span></button>
              <button type="button" class="sev-btn" data-sev="5" role="radio" aria-checked="false" aria-label="Very severe"><span class="sev-emoji">😭</span><span class="sev-label">Very Severe</span></button>
            </div>
          </div>
          <div class="field sx-step">
            <label for="sxTime">Time</label>
            <input type="time" id="sxTime" style="text-align:center;">
          </div>
          <div class="field sx-step">
            <label for="sxNotes">Notes (optional)</label>
            <textarea id="sxNotes" placeholder="Any additional details..." style="text-align:center;"></textarea>
            <div class="media-row" style="justify-content:center;">
              <button type="button" class="media-btn" id="sxVoiceBtn" aria-label="Record voice memo">🎤 Voice note</button>
              <button type="button" class="media-btn" id="sxPhotoBtn" aria-label="Take or upload photo">📷 Add photo</button>
            </div>
            <div id="sxPhotoPreview" class="photo-preview" role="region" aria-label="Photo previews" style="text-align:center;"></div>
            <div id="sxVoicePlayer" class="voice-player hidden" role="region" aria-label="Voice recording"></div>
          </div>
          <input type="file" id="sxPhotoInput" accept="image/*" capture="environment" style="display:none">
          <div class="modal-actions" style="justify-content:center;">
            <button class="btn primary" id="addSxBtn">Save symptoms</button>
            <button class="btn" id="closeSxModal">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  function getQuickLogModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="logModal" role="dialog" aria-modal="true" aria-labelledby="logModalTitle">
        <div class="modal-card">
          <h2 id="logModalTitle">Log entry</h2>
          <div class="field">
            <label for="logType">Type</label>
            <select id="logType">
              <option value="meal">Food / Meal</option>
              <option value="drink">Drink</option>
              <option value="activity">Exercise / Activity</option>
            </select>
          </div>
          <div class="field" id="mealTypeField" style="display:none;">
            <label>Meal type</label>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;" id="mealTypePicker" role="radiogroup" aria-label="Meal type">
              <button type="button" class="btn" data-meal="breakfast" role="radio" aria-checked="false" style="min-height:56px;">🍳 Breakfast</button>
              <button type="button" class="btn" data-meal="lunch" role="radio" aria-checked="false" style="min-height:56px;">🥪 Lunch</button>
              <button type="button" class="btn" data-meal="dinner" role="radio" aria-checked="false" style="min-height:56px;">🍲 Dinner</button>
              <button type="button" class="btn" data-meal="snack" role="radio" aria-checked="false" style="min-height:56px;">🍎 Snack</button>
            </div>
          </div>
          <div class="field" id="detailField">
            <label for="logDetail">What did you do?</label>
            <input type="text" id="logDetail" placeholder="e.g. Went for a walk" list="activitySuggestions">
            <datalist id="activitySuggestions">
              <option value="Walking"><option value="Shopping"><option value="Cooking"><option value="Light stretching">
              <option value="Physiotherapy"><option value="Housework"><option value="Gardening"><option value="Climbing stairs">
              <option value="Cycling"><option value="Swimming"><option value="Yoga / Tai Chi"><option value="Dancing">
              <option value="Resistance bands"><option value="Weight training"><option value="Pilates"><option value="Bowling">
              <option value="Golf"><option value="Light jogging"><option value="Stationary bike"><option value="Chair exercises">
            </datalist>
          </div>
          <div class="field log-options" id="drinkOptions">
            <label>Drink type</label>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;" id="drinkTypePicker" role="radiogroup" aria-label="Drink type">
              <button type="button" class="btn" data-drink="water" role="radio" aria-checked="false" style="min-height:56px;">💧 Water</button>
              <button type="button" class="btn" data-drink="coffee" role="radio" aria-checked="false" style="min-height:56px;">☕ Coffee</button>
              <button type="button" class="btn" data-drink="tea" role="radio" aria-checked="false" style="min-height:56px;">🍵 Tea</button>
              <button type="button" class="btn" data-drink="alcohol" role="radio" aria-checked="false" style="min-height:56px;">🍷 Alcohol</button>
              <button type="button" class="btn" data-drink="juice" role="radio" aria-checked="false" style="min-height:56px;">🧃 Juice</button>
              <button type="button" class="btn" data-drink="soda" role="radio" aria-checked="false" style="min-height:56px;">🥤 Soda</button>
              <button type="button" class="btn" data-drink="milk" role="radio" aria-checked="false" style="min-height:56px;">🥛 Milk</button>
              <button type="button" class="btn" data-drink="other" role="radio" aria-checked="false" style="min-height:56px;">📦 Other</button>
            </div>
          </div>
          <div class="field log-options" id="mealOptions">
            <label>Food options</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="log-option-chip" data-opt="protein" role="switch" aria-checked="false">🥩 Protein</button>
              <button type="button" class="log-option-chip" data-opt="sugar" role="switch" aria-checked="false">🍬 Sugar</button>
              <button type="button" class="log-option-chip" data-opt="fats" role="switch" aria-checked="false">🧈 Fats</button>
              <button type="button" class="log-option-chip" data-opt="carbohydrates" role="switch" aria-checked="false">🍞 Carbohydrates</button>
            </div>
          </div>
          <div class="field">
            <label for="logNotes">Notes (optional)</label>
            <textarea id="logNotes" placeholder="How did it go?"></textarea>
            <div class="media-row">
              <button type="button" class="media-btn" id="logVoiceBtn" aria-label="Record voice memo">🎤 Voice note</button>
              <button type="button" class="media-btn" id="logPhotoBtn" aria-label="Take or upload photo">📷 Add photo</button>
            </div>
            <div id="logPhotoPreview" class="photo-preview" role="region" aria-label="Photo previews"></div>
            <div id="logVoicePlayer" class="voice-player hidden" role="region" aria-label="Voice recording"></div>
          </div>
          <div class="field"><label for="logTime">Time</label><input type="time" id="logTime"></div>
          <input type="file" id="logPhotoInput" accept="image/*" capture="environment" style="display:none">
          <div class="modal-actions">
            <button class="btn primary" id="addLogBtn">Save</button>
            <button class="btn" id="closeLogModal">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  function getSleepModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="sleepModal" role="dialog" aria-modal="true" aria-labelledby="sleepTitle">
        <div class="modal-card">
          <h2 id="sleepTitle">Log sleep quality</h2>
          <div class="field"><label>How well did you sleep?</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;" id="sleepModalStars" role="radiogroup" aria-label="Sleep rating">
              <span class="sleep-star" data-s="1" role="radio" aria-checked="false" tabindex="0" aria-label="1 out of 5">☆</span>
              <span class="sleep-star" data-s="2" role="radio" aria-checked="false" tabindex="-1" aria-label="2 out of 5">☆</span>
              <span class="sleep-star" data-s="3" role="radio" aria-checked="false" tabindex="-1" aria-label="3 out of 5">☆</span>
              <span class="sleep-star" data-s="4" role="radio" aria-checked="false" tabindex="-1" aria-label="4 out of 5">☆</span>
              <span class="sleep-star" data-s="5" role="radio" aria-checked="false" tabindex="-1" aria-label="5 out of 5">☆</span>
            </div>
          </div>
          <div class="field"><label for="sleepNotes">Notes (optional)</label><textarea id="sleepNotes" placeholder="How did you sleep? Any details..."></textarea></div>
          <div class="modal-actions">
            <button class="btn primary" id="addSleepBtn">Save</button>
            <button class="btn" id="closeSleepModal">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  function getGaitModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="gaitModal" role="dialog" aria-modal="true" aria-labelledby="gaitTitle">
        <div class="modal-card">
          <h2 id="gaitTitle">🦯 Gait &amp; Balance Log</h2>
          <div class="field">
            <label>What happened?</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;" id="gaitTypePicker" role="radiogroup" aria-label="Gait event type">
              <button type="button" class="btn" data-gait="fall" role="radio" aria-checked="false" style="flex:1;min-width:80px;">⚠️ Fall</button>
              <button type="button" class="btn" data-gait="freeze" role="radio" aria-checked="false" style="flex:1;min-width:80px;">🧊 Freezing</button>
              <button type="button" class="btn" data-gait="gait" role="radio" aria-checked="false" style="flex:1;min-width:80px;">🦯 Gait Disturbance</button>
            </div>
          </div>
          <div class="field">
            <label>Severity</label>
            <div style="display:flex;align-items:center;gap:12px;">
              <input type="range" id="gaitSeverity" min="1" max="5" value="3" style="flex:1;">
              <span id="gaitSevVal" class="range-val" style="min-width:40px;font-size:1.5rem;">😟</span>
            </div>
          </div>
          <div class="field"><label for="gaitLocation">Location</label><input type="text" id="gaitLocation" placeholder="e.g. Kitchen, Stairs, Living room"></div>
          <div class="field"><label for="gaitActivity">What were you doing?</label><input type="text" id="gaitActivity" placeholder="e.g. Turning, Standing up, Walking"></div>
          <div class="field"><label for="gaitTime">Time</label><input type="time" id="gaitTime"></div>
          <div class="field"><label for="gaitNotes">Notes</label><textarea id="gaitNotes" placeholder="Any additional details..."></textarea></div>
          <div class="modal-actions">
            <button class="btn primary" id="addGaitBtn">Save</button>
            <button class="btn" id="closeGaitModal">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  function getMedModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="medModal" role="dialog" aria-modal="true" aria-labelledby="medTitle">
        <div class="modal-card">
          <h2 id="medTitle">Add medication</h2>
          <div class="field"><label for="medName">Name</label><input type="text" id="medName" placeholder="e.g. Levodopa/Carbidopa"></div>
          <div class="field"><label for="medDose">Dose</label><input type="text" id="medDose" placeholder="e.g. 100/25mg"></div>
          <div class="field"><label for="medTime">First dose time</label><input type="time" id="medTime" value="08:00"></div>
          <div class="field"><label for="medInterval">Interval (hours)</label><input type="number" id="medInterval" min="1" max="12" value="4" step="0.5"></div>
          <div class="field"><label for="medCount">Number of doses</label><input type="number" id="medCount" min="1" max="12" value="4"></div>
          <div class="modal-actions">
            <button class="btn primary" id="addMedBtn">Save</button>
            <button class="btn" id="closeMedModal">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  function getViewEntryModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="viewEntryModal" role="dialog" aria-modal="true" aria-labelledby="viewEntryTitle">
        <div class="modal-card">
          <h2 id="viewEntryTitle">View entry</h2>
          <div id="viewEntryContent"></div>
          <div class="modal-actions">
            <button class="btn primary" id="saveEditBtn">Save changes</button>
            <button class="btn" id="closeViewModal">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function getMedicalIdModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="medicalIdModal" role="dialog" aria-modal="true" aria-labelledby="medicalIdTitle">
        <div class="modal-card">
          <h2 id="medicalIdTitle">🆘 Emergency Medical ID &amp; Caregiver Contact</h2>
          <p style="color:var(--ink-soft);margin-bottom:18px;font-size:1rem;">Keep key medical information ready for emergency responders or hospital visits.</p>
          <div class="field"><label for="medIdPatientName">Patient Name</label><input type="text" id="medIdPatientName" placeholder="e.g. John Doe"></div>
          <div class="field"><label for="medIdEmergencyContact">Emergency Contact Name &amp; Phone</label><input type="text" id="medIdEmergencyContact" placeholder="e.g. Jane Doe (Spouse) - +44 7123 456789"></div>
          <div class="field"><label for="medIdNeurologist">Neurologist / Care Team</label><input type="text" id="medIdNeurologist" placeholder="e.g. Dr. Smith - General Hospital (+44 20 1234 5678)"></div>
          <div class="field"><label for="medIdCriticalNotes">Critical Medical Notes / DBS Settings</label><textarea id="medIdCriticalNotes" placeholder="e.g. Parkinson's Disease. Do NOT omit Levodopa doses. Deep Brain Stimulation (Medtronic, Left 2.5V, Right 2.8V)."></textarea></div>
          <div class="modal-actions">
            <button class="btn primary" id="saveMedicalIdBtn">Save Medical ID</button>
            <button class="btn accent" id="printMedIdBtn">🖨️ Print emergency card</button>
            <button class="btn" id="closeMedicalIdModal">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function getDoctorModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="doctorModal" role="dialog" aria-modal="true" aria-labelledby="doctorTitle">
        <div class="modal-card" style="max-width:720px;">
          <h2 id="doctorTitle">🩺 Clinical summary — last 30 days</h2>
          <div id="doctorReportContent"></div>
          <div class="modal-actions">
            <button class="btn primary" id="printReportBtn">🖨️ Print / Save PDF</button>
            <button class="btn" id="closeDoctorModal">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function getPopupsAndNudgesTemplate() {
    return `
      <div class="sleep-popup hidden" id="sleepPopup" role="dialog" aria-modal="true" aria-labelledby="sleepPopupTitle">
        <div class="sleep-popup-card">
          <div class="sleep-popup-title" id="sleepPopupTitle">🌅 Good morning!</div>
          <div class="sleep-popup-sub">How well did you sleep last night?</div>
          <div class="sleep-popup-stars" id="sleepPopupStars" role="radiogroup" aria-label="Sleep rating">
            <span class="sleep-popup-star" data-s="1" role="radio" aria-checked="false" tabindex="0" aria-label="1 out of 5">☆</span>
            <span class="sleep-popup-star" data-s="2" role="radio" aria-checked="false" tabindex="-1" aria-label="2 out of 5">☆</span>
            <span class="sleep-popup-star" data-s="3" role="radio" aria-checked="false" tabindex="-1" aria-label="3 out of 5">☆</span>
            <span class="sleep-popup-star" data-s="4" role="radio" aria-checked="false" tabindex="-1" aria-label="4 out of 5">☆</span>
            <span class="sleep-popup-star" data-s="5" role="radio" aria-checked="false" tabindex="-1" aria-label="5 out of 5">☆</span>
          </div>
          <div class="sleep-popup-actions">
            <button class="btn primary" id="sleepPopupSaveBtn" disabled style="flex:1;">Save</button>
            <button class="btn ghost" id="sleepPopupDismissBtn" style="flex:none;">✕</button>
          </div>
        </div>
      </div>

      <div class="popup-nudge hidden" id="priorityNudgePopup" role="dialog" aria-modal="true">
        <div class="popup-nudge-card" style="border: 3px solid var(--primary); text-align: left;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 8px;">
            <span style="font-weight: 800; font-size: 1.1rem;" id="priorityNudgeTitle">Priority Alert</span>
            <button type="button" id="closePriorityNudgeBtn" style="background:none; border:none; font-size:1.6rem; cursor:pointer; color:var(--ink-soft); line-height:1; padding:0 4px;">&times;</button>
          </div>
          <div id="priorityNudgeContent"></div>
        </div>
      </div>

      <div class="popup-nudge hidden" id="breakfastPopup" role="dialog" aria-modal="true">
        <div class="popup-nudge-card">
          <div class="popup-nudge-icon">🍳</div>
          <div class="popup-nudge-title">Have you had breakfast yet?</div>
          <div class="popup-nudge-sub">Logging your meals helps track how food affects your symptoms.</div>
          <div class="popup-nudge-actions">
            <button class="btn primary" id="breakfastYesBtn" style="flex:1;">Yes! Let's log it</button>
            <button class="btn ghost" id="breakfastNotYetBtn" style="flex:none;">Not yet</button>
          </div>
        </div>
      </div>

      <div class="popup-nudge hidden" id="lunchPopup" role="dialog" aria-modal="true">
        <div class="popup-nudge-card">
          <div class="popup-nudge-icon">🥗</div>
          <div class="popup-nudge-title">Have you had lunch yet?</div>
          <div class="popup-nudge-sub">Logging meals helps spot patterns with your symptoms.</div>
          <div class="popup-nudge-actions">
            <button class="btn primary" id="lunchYesBtn" style="flex:1;">Yes! Let's log it</button>
            <button class="btn ghost" id="lunchNotYetBtn" style="flex:none;">Not yet</button>
          </div>
        </div>
      </div>

      <div class="popup-nudge hidden" id="dinnerPopup" role="dialog" aria-modal="true">
        <div class="popup-nudge-card">
          <div class="popup-nudge-icon">🍝</div>
          <div class="popup-nudge-title">Have you had dinner yet?</div>
          <div class="popup-nudge-sub">Logging meals helps track how food affects your symptoms.</div>
          <div class="popup-nudge-actions">
            <button class="btn primary" id="dinnerYesBtn" style="flex:1;">Yes! Let's log it</button>
            <button class="btn ghost" id="dinnerNotYetBtn" style="flex:none;">Not yet</button>
          </div>
        </div>
      </div>

      <div class="popup-nudge hidden" id="proteinConflictPopup" role="dialog" aria-modal="true" style="bottom: 230px;">
        <div class="popup-nudge-card" style="border-color: var(--accent);">
          <div class="popup-nudge-icon">🍖</div>
          <div class="popup-nudge-title">Protein &amp; Levodopa Conflict</div>
          <div class="popup-nudge-sub">A high-protein meal was logged near Levodopa dose (<span id="proteinConflictTime">8:45am</span>). Protein can compete with Levodopa absorption. Clinicians suggest taking Levodopa 30–60 mins before or 1–2 hours after protein-rich meals.</div>
          <div class="popup-nudge-actions">
            <button class="btn primary" id="proteinConflictDismissBtn" style="flex:1;">Got it</button>
          </div>
        </div>
      </div>
    `;
  }

  window.Cadence.templates = {
    getFullscreenGameOverlayTemplate,
    getConsentGateTemplate,
    getAlarmGateTemplate,
    getSymptomModalTemplate,
    getQuickLogModalTemplate,
    getSleepModalTemplate,
    getGaitModalTemplate,
    getMedModalTemplate,
    getViewEntryModalTemplate,
    getMedicalIdModalTemplate,
    getDoctorModalTemplate,
    getPopupsAndNudgesTemplate
  };
})();
