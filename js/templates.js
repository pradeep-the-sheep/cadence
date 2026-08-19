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
          <p class="lead">Cadence helps you track Parkinson's-related health data including medications, symptoms, gait, sleep, and diet. Under the General Data Protection Regulation (GDPR), this qualifies as special category health data and requires your explicit consent.</p>
          <div class="policytext" tabindex="0" aria-label="Privacy notice">
            <h3>1. What Data is Processed</h3>
            <p>Medication schedules &amp; doses, symptom logs, gait/balance events, sleep ratings, meal logs, activity records, voice memos, and photos — all classified as special category health data under <strong>Art. 9(1) GDPR</strong>.</p>

            <h3>2. Legal Basis — Explicit Consent Only (Art. 9(2)(a) GDPR)</h3>
            <p>Processing of your health data is based <strong>solely and exclusively on your explicit consent</strong> pursuant to <strong>Article 9(2)(a) GDPR</strong> (and Article 6(1)(a) GDPR). No other legal bases (such as legitimate interests or contractual necessity) are relied upon for processing your health data. You may withdraw your consent at any time without detriment, which immediately and permanently erases all data from this device.</p>

            <h3>3. Data Retention Criteria</h3>
            <p>Your health data is retained strictly according to the following criteria:</p>
            <ul>
              <li><strong>Local Device Retention:</strong> Data remains stored in your browser's <code>localStorage</code> for as long as you actively use the application, until you explicitly delete logs, execute <strong>Clear all data</strong>, or <strong>withdraw consent</strong>.</li>
              <li><strong>Zero Server Retention:</strong> <strong>0 seconds / None.</strong> Cadence is an offline client-side application. No health records, metrics, or personal identifiers are ever uploaded, transmitted, or retained on any external server or cloud database.</li>
              <li><strong>Manual Backups:</strong> JSON export files remain stored in your personal local filesystem under your direct custody for as long as you retain the downloaded file.</li>
            </ul>

            <h3>4. Third-Party Processors &amp; CDN Asset Disclosure</h3>
            <p>Cadence operates client-side, but retrieves static libraries and model weights from trusted Content Delivery Networks (CDNs) on initial page load:</p>
            <ul>
              <li><strong>Google Fonts (Google LLC):</strong> Used to deliver interface typography (<code>fonts.googleapis.com</code> / <code>fonts.gstatic.com</code>). When requesting font stylesheets and font files, your browser transmits standard network connection metadata (IP address and User-Agent) to Google's CDN. No health data or personal inputs are ever shared with or accessible to Google Fonts.</li>
              <li><strong>MediaPipe &amp; jsDelivr CDN (Prospect One / Cloudflare):</strong> Delivers client-side computer vision scripts and WebAssembly AI model files (<code>cdn.jsdelivr.net</code>) for local movement analysis. All pose and hand tracking runs <strong>100% locally on your device GPU and memory</strong>. Camera video streams and joint coordinates never leave your device.</li>
            </ul>

            <h3>5. Where &amp; How Data is Stored</h3>
            <p>All records are stored exclusively in your browser's sandboxed <strong>localStorage</strong> on this device. No data is shared with or sold to advertisers, insurers, or data brokers.</p>

            <h3>6. Your Rights under GDPR (Articles 15–22)</h3>
            <ul>
              <li><strong>Right of Access (Art. 15):</strong> Export and inspect your complete health dataset anytime via the footer or settings.</li>
              <li><strong>Right to Rectification (Art. 16):</strong> Directly edit or modify any log entry.</li>
              <li><strong>Right to Erasure (Art. 17):</strong> Permanently delete specific entries, clear all data, or wipe local storage.</li>
              <li><strong>Right to Data Portability (Art. 20):</strong> Export your health data in structured, machine-readable JSON format.</li>
              <li><strong>Right to Withdraw Consent (Art. 7(3)):</strong> Withdraw consent at any time via the footer to instantly revoke authorization and wipe all data.</li>
            </ul>

            <h3>7. Data Protection &amp; Inquiries</h3>
            <p>Because Cadence functions as a zero-telemetry local-first client where you retain exclusive custody of your data, no external data controller processing exists. For any privacy queries, contact <strong>cadence@app.local</strong>.</p>

            <h3>8. Age Requirement</h3>
            <p>You must be <strong>16 years of age or older</strong> to provide valid consent under GDPR Art. 8. If you are under 16, please do not use this application without verified parental/guardian authorization.</p>
          </div>
          <div class="consentrow">
            <input type="checkbox" id="consentCheck">
            <label for="consentCheck">I am <strong>16 or older</strong>, have read the notice above, and grant my <strong>explicit consent</strong> under <strong>Art. 9(2)(a) GDPR</strong> for Cadence to process my health data (medications, symptoms, gait, sleep, and physical activities) locally on this device. I understand that processing is based solely on my consent, that I can export or erase my data anytime, and that third-party CDNs (Google Fonts, jsDelivr/MediaPipe) only deliver static assets without receiving any health data.</label>
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
          <div class="modal-actions edit-modal-actions" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:14px;width:100%;margin-top:30px;">
            <button type="button" class="btn" id="deleteEntryBtn" style="color:#DC2626;border-color:rgba(220,38,38,0.5);background:rgba(220,38,38,0.09);font-weight:700;justify-content:center;width:100%;">🗑️ Delete log</button>
            <button type="button" class="btn success" id="saveEditBtn" style="background:#16A34A !important;border-color:#15803D !important;color:#FFFFFF !important;font-weight:700;justify-content:center;width:100%;">💾 Save changes</button>
            <button type="button" class="btn" id="closeViewModal" style="justify-content:center;width:100%;">Cancel</button>
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

  function getPreviousEntriesModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="prevEntriesModal" role="dialog" aria-modal="true" aria-labelledby="histModalTitle">
        <div class="modal-card wide" style="max-width:1040px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px;border-bottom:2px solid var(--line);padding-bottom:14px;">
            <div>
              <h2 id="histModalTitle" style="margin:0 0 4px 0;font-size:1.8rem;">📅 Previous Entries &amp; Past Rhythms</h2>
              <p style="margin:0;color:var(--ink-soft);font-size:0.95rem;">Select any previous date to inspect its 24-hour clock bubbles and recorded daily timeline.</p>
            </div>
            <span class="history-badge" id="historyEventCountBadge" style="font-size:0.95rem;padding:6px 16px;">0 events</span>
          </div>

          <!-- Interactive Date Navigator Bar -->
          <div class="history-date-bar" style="background:var(--surface-2);padding:12px 18px;border-radius:14px;border:2px solid var(--line);margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <button type="button" class="btn-hist-nav" id="histPrevDayBtn" aria-label="Previous day" title="Previous Day">◀</button>
              <div class="hist-date-picker-wrap">
                <input type="date" id="histDatePicker" class="hist-date-input" aria-label="Select history date">
                <span id="histSelectedDateLabel" class="hist-date-label" style="font-size:1.05rem;padding:8px 18px;">Yesterday</span>
              </div>
              <button type="button" class="btn-hist-nav" id="histNextDayBtn" aria-label="Next day" title="Next Day">▶</button>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button type="button" class="btn-hist-today" id="histYesterdayQuickBtn" style="padding:8px 18px;font-size:0.92rem;">Yesterday</button>
            </div>
          </div>

          <!-- Modal History Grid -->
          <div class="history-modal-grid">
            <!-- Left Column: Historical Clock View -->
            <div class="hist-modal-clock-col">
              <div style="font-weight:800;font-size:1.15rem;margin-bottom:4px;text-align:center;">🕰️ 24-Hour Rhythm Clock</div>
              <div class="hist-clock-wrapper" role="img" aria-label="Historical clock face for selected past date with activity bubbles">
                <div class="hist-clock-face" id="histClockFace">
                  <div class="hist-center-dot"></div>
                </div>
              </div>
              <div class="hist-orbit-legend" style="font-size:0.82rem;margin-top:10px;">
                <span>☀️ <strong>Day (6 AM – 6 PM):</strong> Inside rim</span> · <span>🌙 <strong>Night:</strong> Outside ring</span>
              </div>
            </div>

            <!-- Right Column: Replicated Rhythm Grid & Event Details -->
            <div class="hist-modal-rhythm-col">
              <div class="hist-rhythm-header" style="margin-bottom:12px;">
                <span style="font-size:1.15rem;font-weight:800;color:var(--ink);">🕒 Recorded Daily Rhythm</span>
                <span id="histRhythmDateSub" style="font-weight:700;font-size:0.95rem;color:var(--primary-dark);"></span>
              </div>
              <div class="hist-day-ribbon" id="histDayRibbon" role="region" aria-label="Recorded historical timeline">
                <!-- Generated dynamically -->
              </div>
            </div>
          </div>

          <div class="modal-actions" style="margin-top:24px;">
            <button type="button" class="btn primary" id="closeHistoryModalBtn" style="justify-content:center;width:100%;">Done / Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function getPrivacyModalTemplate() {
    return `
      <div class="modal-overlay hidden" id="privacyModal" role="dialog" aria-modal="true" aria-labelledby="privacyModalTitle">
        <div class="modal-card wide" style="max-width:780px;max-height:85vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
            <h2 id="privacyModalTitle" style="margin:0;font-size:1.6rem;display:flex;align-items:center;gap:8px;">
              <span>🔒</span> <span>GDPR Privacy &amp; Data Protection Notice</span>
            </h2>
            <button type="button" class="btn ghost" id="closePrivacyModalTopBtn" style="font-size:1.4rem;padding:2px 8px;line-height:1;">&times;</button>
          </div>
          
          <div class="policytext" style="font-size:0.95rem;line-height:1.6;color:var(--ink);">
            <div style="background:rgba(34,197,94,0.1);border:1.5px solid #22c55e;border-radius:12px;padding:12px 16px;margin-bottom:16px;">
              <strong style="color:#15803d;">🛡️ Zero-Server Telemetry:</strong> Cadence is engineered as a local-first application. Your health entries, camera feeds, and voice memos never leave this device.
            </div>

            <h3 style="font-size:1.15rem;font-weight:800;color:var(--ink);margin:14px 0 6px;">1. Special Category Health Data Processed</h3>
            <p>Cadence processes personal health data including medication schedules, actual intake/skip timestamps, motor and non-motor symptom logs, gait and freezing events, sleep quality scores, meal and beverage logs, physical rehabilitation scores, voice memos, and photos under <strong>Article 9(1) of the UK/EU GDPR</strong>.</p>

            <h3 style="font-size:1.15rem;font-weight:800;color:var(--ink);margin:14px 0 6px;">2. Exclusive Legal Basis: Explicit Consent (Art. 9(2)(a) GDPR)</h3>
            <p>Processing of your health data is carried out <strong>solely and exclusively on the basis of your explicit consent under Article 9(2)(a) GDPR</strong> (in conjunction with Article 6(1)(a) GDPR). No other legal basis is used. Consent is voluntary and can be withdrawn at any time through the application interface.</p>

            <h3 style="font-size:1.15rem;font-weight:800;color:var(--ink);margin:14px 0 6px;">3. Data Retention Criteria</h3>
            <ul>
              <li><strong>Local Storage Duration:</strong> Your data is retained indefinitely in your browser's local <code>localStorage</code> database for as long as you use the application, until you explicitly choose to clear individual logs, clear all data, or withdraw consent.</li>
              <li><strong>External Servers:</strong> <strong>0 seconds.</strong> No data is ever transmitted to or retained on cloud servers, external databases, or third-party tracking services.</li>
              <li><strong>Export Backups:</strong> Manual JSON exports are saved directly to your local file system and retained in accordance with your personal storage preferences.</li>
            </ul>

            <h3 style="font-size:1.15rem;font-weight:800;color:var(--ink);margin:14px 0 6px;">4. Third-Party Processors &amp; CDN Asset Disclosure</h3>
            <p>Cadence uses two trusted Content Delivery Networks (CDNs) strictly to download static code libraries and typography during browser load:</p>
            <ul>
              <li><strong>Google Fonts (Google LLC):</strong> Used to load system typography (<code>fonts.googleapis.com</code> / <code>fonts.gstatic.com</code>). Standard HTTP transmission metadata (IP address, browser User-Agent) is processed by Google to serve font files. <em>No health data or user entries are ever accessible to or shared with Google Fonts.</em></li>
              <li><strong>MediaPipe / jsDelivr CDN (Prospect One / Cloudflare):</strong> Delivers client-side computer vision scripts and WebAssembly AI model files (<code>cdn.jsdelivr.net</code>). All motion tracking, pose landmark calculations, and video frame analysis run <strong>100% locally on your device GPU/CPU</strong>. Camera frames and joint coordinates are never transmitted over the network.</li>
            </ul>

            <h3 style="font-size:1.15rem;font-weight:800;color:var(--ink);margin:14px 0 6px;">5. Your Rights Under GDPR (Articles 15–22)</h3>
            <ul>
              <li><strong>Access (Art. 15):</strong> Export your full dataset at any time as structured JSON.</li>
              <li><strong>Rectification (Art. 16):</strong> Directly edit or modify any log entry.</li>
              <li><strong>Erasure / Right to be Forgotten (Art. 17):</strong> Delete individual logs or click "Clear all data" in the footer.</li>
              <li><strong>Data Portability (Art. 20):</strong> Download and transfer your JSON data to any other device or healthcare provider.</li>
              <li><strong>Right to Withdraw Consent (Art. 7(3)):</strong> Click "Withdraw consent" in the footer to instantly revoke authorization and permanently delete all stored health data.</li>
            </ul>

            <h3 style="font-size:1.15rem;font-weight:800;color:var(--ink);margin:14px 0 6px;">6. Contact &amp; Inquiries</h3>
            <p>For any privacy or data protection inquiries, contact <strong>cadence@app.local</strong>.</p>
          </div>

          <div class="modal-actions" style="margin-top:20px;">
            <button type="button" class="btn primary" id="closePrivacyModalBtn" style="justify-content:center;width:100%;">Close Privacy Notice</button>
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
    getPopupsAndNudgesTemplate,
    getPreviousEntriesModalTemplate,
    getPrivacyModalTemplate
  };
})();
