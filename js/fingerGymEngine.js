/**
 * Cadence · Parkinson's Daily Companion
 * fingerGymEngine.js - MediaPipe Hand & Pose motion tracking, hand dexterity & BIG exercises
 */

window.Cadence = window.Cadence || {};

(function() {
  let fgMediaPipeLoaded = false;
  let fgHandLandmarker = null;
  let fgPoseLandmarker = null;
  let fgFilesetResolver = null;
  let fgVision = null;
  let fgStream = null;
  let fgActive = false;
  let fgAnimId = null;
  let fgLastVideoTime = -1;
  let fgCalibrationScale = 0.22;

  let fgSelectedExercise = 'tapping';
  let fgGameState = 'idle';
  let fgTimeRemaining = 20;
  let fgTimerInterval = null;

  // Tapping
  let fgTappingDistanceHistory = [];
  let fgTappedTimestamps = [];
  let fgTappingMaxCurrentAmp = 0;
  let fgTappingState = 'open';
  let fgMetronomeTimer = null;

  // Fist
  let fgFistReps = 0;
  let fgFistState = 'open';
  let fgFistLastRepTime = 0;
  let fgFistIntervals = [];

  // BIG Movements
  let fgBigReps = 0;
  let fgBigState = 'low';
  let fgBigPeakAmp = 0;
  let fgBigAmpHistory = [];
  let fgBigLastRepTime = 0;
  let fgBigIntervals = [];
  let fgBigSide = 'left';

  // Opposition
  const fgOppSequence = [8, 12, 16, 20];
  const fgOppLabels = ['Index', 'Middle', 'Ring', 'Pinky'];
  let fgOppCurrentIdx = 0;
  let fgOppCompletedCycles = 0;
  let fgOppReleased = true;

  // Balloon Pop
  let fgBalloons = [];
  let fgBalloonsCleared = 0;
  const fgMaxBalloons = 10;
  let fgBalloonStartTime = 0;
  let fgBalloonReactionTimes = [];
  let fgBalloonLinearDists = [];
  let fgBalloonActualDists = [];
  let fgBalloonLastPathPoint = null;
  let fgBalloonCurrentPathDist = 0;

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

  async function loadFingerGymMediaPipe() {
    const loader = document.getElementById('fg-camera-loader');
    if (fgMediaPipeLoaded) {
      if (loader) loader.style.display = 'none';
      return;
    }
    if (loader) loader.style.display = 'flex';
    try {
      let module = window.tasksVision;
      if (!module) {
        try {
          module = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs");
        } catch (importErr) {
          module = window.tasksVision || window;
        }
      }
      fgFilesetResolver = module.FilesetResolver || window.FilesetResolver;
      const HandLandmarker = module.HandLandmarker || window.HandLandmarker;
      const PoseLandmarker = module.PoseLandmarker || window.PoseLandmarker;
      
      fgVision = await fgFilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );
      fgHandLandmarker = await HandLandmarker.createFromOptions(fgVision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });
      try {
        fgPoseLandmarker = await PoseLandmarker.createFromOptions(fgVision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
      } catch (poseErr) {
        console.warn("Pose landmarker fallback:", poseErr);
        fgPoseLandmarker = null;
      }
      fgMediaPipeLoaded = true;
      if (loader) loader.style.display = 'none';
    } catch (e) {
      console.error("Error loading MediaPipe tasks:", e);
      getModals().showToast("Webcam motion tracker failed to load.");
      if (loader) loader.style.display = 'none';
    }
  }

  function startFingerGymTracker() {
    const video = document.getElementById('fg-webcam');
    const canvas = document.getElementById('fg-canvas');
    if (!video || fgStream) return;

    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      audio: false
    }).then(stream => {
      fgStream = stream;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        fgActive = true;
        fgLastVideoTime = -1;
        fgAnimId = requestAnimationFrame(fingerGymTrackingLoop);
      };
    }).catch(e => {
      console.error("Camera access failed:", e);
      getModals().showToast("Webcam access blocked or camera missing.");
    });
  }

  function stopFingerGymTracker() {
    fgActive = false;
    if (fgAnimId) {
      cancelAnimationFrame(fgAnimId);
      fgAnimId = null;
    }
    if (fgStream) {
      fgStream.getTracks().forEach(t => t.stop());
      fgStream = null;
    }
    const video = document.getElementById('fg-webcam');
    if (video) video.srcObject = null;
    
    const canvas = document.getElementById('fg-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    stopFingerGymSession();
  }

  function setFingerGymExercise(mode) {
    if (fgGameState === 'playing') {
      if (!confirm("Stop current assessment and switch exercise?")) return;
      stopFingerGymSession();
    }

    fgSelectedExercise = mode;
    const isBig = ['reach', 'march', 'twist'].includes(mode);
    
    ['tapping', 'opposition', 'pop', 'fist', 'reach', 'march', 'twist'].forEach(m => {
      const el = document.getElementById(`fg-card-${m}`);
      if (!el) return;
      if (m === mode) el.classList.add('active');
      else el.classList.remove('active');
    });

    const graphArea = document.getElementById('fg-live-graph-area');
    const oppArea = document.getElementById('fg-live-opposition-area');
    const popArea = document.getElementById('fg-live-pop-area');
    const bigArea = document.getElementById('fg-live-big-area');
    if (graphArea) graphArea.style.display = (mode === 'tapping' || mode === 'fist') ? 'block' : 'none';
    if (oppArea) oppArea.style.display = (mode === 'opposition') ? 'block' : 'none';
    if (popArea) popArea.style.display = (mode === 'pop') ? 'block' : 'none';
    if (bigArea) bigArea.style.display = isBig ? 'block' : 'none';

    const lbl1 = document.getElementById('fg-metric-lbl-1');
    const lbl2 = document.getElementById('fg-metric-lbl-2');
    const val1 = document.getElementById('fg-metric-val-1');
    const val2 = document.getElementById('fg-metric-val-2');
    const exName = document.getElementById('fg-ex-name');
    const exDesc = document.getElementById('fg-ex-desc');

    fgBigReps = 0; fgBigState = 'low'; fgBigPeakAmp = 0; fgBigAmpHistory = []; fgBigIntervals = []; fgBigLastRepTime = 0;

    if (mode === 'tapping') {
      if (exName) exName.textContent = "Finger Tapping";
      if (exDesc) exDesc.textContent = "Tap your thumb and index finger together rapidly with maximum range. Measures speed decay.";
      if (lbl1) lbl1.textContent = "Taps Count"; if (val1) val1.textContent = "0";
      if (lbl2) lbl2.textContent = "Time Left"; if (val2) val2.textContent = "20s";
      fgTimeRemaining = 20;
    } else if (mode === 'opposition') {
      if (exName) exName.textContent = "Finger Opposition";
      if (exDesc) exDesc.textContent = "Touch your thumb sequentially to your Index, Middle, Ring, and Pinky fingers.";
      if (lbl1) lbl1.textContent = "Cycles Done"; if (val1) val1.textContent = "0";
      if (lbl2) lbl2.textContent = "Time Left"; if (val2) val2.textContent = "25s";
      fgTimeRemaining = 25;
      updateOppositionUI(0);
    } else if (mode === 'pop') {
      if (exName) exName.textContent = "Balloon Pop";
      if (exDesc) exDesc.textContent = "Hover your index finger tip over spawning targets to pop them as fast as you can.";
      if (lbl1) lbl1.textContent = "Pops"; if (val1) val1.textContent = "0";
      if (lbl2) lbl2.textContent = "Time Left"; if (val2) val2.textContent = "30s";
      fgTimeRemaining = 30;
      updatePopUI(0, 10);
    } else if (mode === 'fist') {
      if (exName) exName.textContent = "Fist Clenching";
      if (exDesc) exDesc.textContent = "Make a full fist, then open your hand fully. Repeat steadily. Measures grip cycle speed and consistency.";
      if (lbl1) lbl1.textContent = "Reps"; if (val1) val1.textContent = "0";
      if (lbl2) lbl2.textContent = "Time Left"; if (val2) val2.textContent = "20s";
      fgTimeRemaining = 20;
      fgFistReps = 0; fgFistState = 'open'; fgFistIntervals = []; fgFistLastRepTime = 0;
    } else if (mode === 'reach') {
      if (exName) exName.textContent = "🙌 Sky Reach (BIG)";
      if (exDesc) exDesc.textContent = "Stand facing the camera. Reach BOTH arms as high as you can overhead, hold briefly, then lower. MediaPipe scores how high and how often.";
      if (lbl1) lbl1.textContent = "Big Reps"; if (val1) val1.textContent = "0";
      if (lbl2) lbl2.textContent = "Time Left"; if (val2) val2.textContent = "30s";
      fgTimeRemaining = 30;
      const hint = document.getElementById('fg-big-hint');
      if (hint) hint.textContent = 'Step back so head + arms are fully in frame';
    } else if (mode === 'march') {
      if (exName) exName.textContent = "🦵 High March (BIG)";
      if (exDesc) exDesc.textContent = "March in place with HIGH knees — exaggerate the lift. Alternating left/right. Pose tracking counts each high knee.";
      if (lbl1) lbl1.textContent = "High Knees"; if (val1) val1.textContent = "0";
      if (lbl2) lbl2.textContent = "Time Left"; if (val2) val2.textContent = "30s";
      fgTimeRemaining = 30;
      const hint = document.getElementById('fg-big-hint');
      if (hint) hint.textContent = 'Full body in frame — lift knees as high as safe';
    } else if (mode === 'twist') {
      if (exName) exName.textContent = "🔄 Big Twist (BIG)";
      if (exDesc) exDesc.textContent = "Plant your feet. Rotate your trunk and look far over one shoulder, then the other. Big amplitude wins.";
      if (lbl1) lbl1.textContent = "Twists"; if (val1) val1.textContent = "0";
      if (lbl2) lbl2.textContent = "Time Left"; if (val2) val2.textContent = "30s";
      fgTimeRemaining = 30;
      const hint = document.getElementById('fg-big-hint');
      if (hint) hint.textContent = 'Face camera; twist so shoulders turn clearly';
    }
  }

  function startFingerGymSession() {
    fgGameState = 'playing';
    const startBtn = document.getElementById('fg-btn-start');
    const stopBtn = document.getElementById('fg-btn-stop');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';

    if (fgSelectedExercise === 'tapping') {
      fgTappedTimestamps = [];
      fgTappingDistanceHistory = [];
      fgTappingMaxCurrentAmp = 0;
      fgTappingState = 'open';
      getAudio().speakText("Start tapping thumb and index finger now!");
      startMetronome();
    } else if (fgSelectedExercise === 'opposition') {
      fgOppCurrentIdx = 0;
      fgOppCompletedCycles = 0;
      fgOppReleased = true;
      getAudio().speakText("Touch thumb to index finger");
      updateOppositionUI(0);
    } else if (fgSelectedExercise === 'pop') {
      fgBalloonsCleared = 0;
      fgBalloons = [];
      fgBalloonReactionTimes = [];
      fgBalloonLinearDists = [];
      fgBalloonActualDists = [];
      fgBalloonLastPathPoint = null;
      fgBalloonCurrentPathDist = 0;
      getAudio().speakText("Hover index finger to pop balloons!");
      spawnFgBalloon();
      updatePopUI(0, 10);
    } else if (fgSelectedExercise === 'fist') {
      fgFistReps = 0;
      fgFistState = 'open';
      fgFistIntervals = [];
      fgFistLastRepTime = 0;
      fgTappingDistanceHistory = [];
      getAudio().speakText("Open and close your fist fully. Begin now!");
      startMetronome();
    } else if (fgSelectedExercise === 'reach') {
      fgBigReps = 0; fgBigState = 'low'; fgBigPeakAmp = 0; fgBigAmpHistory = [];
      getAudio().speakText("Reach both arms high to the sky! Make it BIG!");
    } else if (fgSelectedExercise === 'march') {
      fgBigReps = 0; fgBigState = 'low'; fgBigPeakAmp = 0; fgBigSide = 'left';
      getAudio().speakText("March in place with high knees. Big lifts!");
      startMetronome();
    } else if (fgSelectedExercise === 'twist') {
      fgBigReps = 0; fgBigState = 'center'; fgBigPeakAmp = 0;
      getAudio().speakText("Twist big to the left and right. Look over your shoulder!");
    }

    const val2 = document.getElementById('fg-metric-val-2');
    if (val2) val2.textContent = `${fgTimeRemaining}s`;

    fgTimerInterval = setInterval(() => {
      fgTimeRemaining--;
      if (fgTimeRemaining < 0) fgTimeRemaining = 0;
      if (val2) val2.textContent = `${fgTimeRemaining}s`;
      
      if (fgTimeRemaining <= 0) {
        completeFingerGymSession();
      }
    }, 1000);
  }

  function stopFingerGymSession() {
    cleanupFgSessionTimers();
    fgGameState = 'idle';
    const startBtn = document.getElementById('fg-btn-start');
    const stopBtn = document.getElementById('fg-btn-stop');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    
    const metDot = document.getElementById('fg-metronome-dot');
    if (metDot) metDot.classList.remove('active');

    setFingerGymExercise(fgSelectedExercise);
  }

  function cleanupFgSessionTimers() {
    if (fgTimerInterval) {
      clearInterval(fgTimerInterval);
      fgTimerInterval = null;
    }
    if (fgMetronomeTimer) {
      clearInterval(fgMetronomeTimer);
      fgMetronomeTimer = null;
    }
  }

  function startMetronome() {
    if (fgMetronomeTimer) clearInterval(fgMetronomeTimer);
    fgMetronomeTimer = setInterval(() => {
      if (fgGameState === 'playing') {
        const metDot = document.getElementById('fg-metronome-dot');
        if (metDot) {
          metDot.classList.add('active');
          setTimeout(() => metDot.classList.remove('active'), 100);
        }
        const audioChk = document.getElementById('fg-audio-chk');
        if (audioChk && audioChk.checked) {
          try {
            const ctx = getAudio().ensureAudio();
            if (ctx) {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.type = 'triangle';
              o.frequency.value = 500;
              g.gain.setValueAtTime(0.04, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
              o.connect(g).connect(ctx.destination);
              o.start();
              o.stop(ctx.currentTime + 0.06);
            }
          } catch(e){}
        }
      }
    }, 666);
  }

  function completeFingerGymSession() {
    cleanupFgSessionTimers();
    fgGameState = 'idle';
    
    const startBtn = document.getElementById('fg-btn-start');
    const stopBtn = document.getElementById('fg-btn-stop');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';

    const { uid, todayStr, nowHM } = getHelpers();
    const state = getState();

    let record = {
      id: uid(),
      date: todayStr(),
      time: nowHM(),
      exercise: "",
      speed: 0,
      consistency: 0,
      score: 0
    };

    if (fgSelectedExercise === 'tapping') {
      record.exercise = "Finger Tapping";
      const totalTaps = fgTappedTimestamps.length;
      record.speed = Math.round((totalTaps / 20) * 60);
      if (fgTappedTimestamps.length > 2) {
        const intervals = [];
        for (let i = 1; i < fgTappedTimestamps.length; i++) {
          intervals.push(fgTappedTimestamps[i] - fgTappedTimestamps[i-1]);
        }
        const avg = intervals.reduce((a,b)=>a+b, 0) / intervals.length;
        const sDev = Math.sqrt(intervals.map(v => Math.pow(v - avg, 2)).reduce((a,b)=>a+b,0) / intervals.length);
        const cv = avg > 0 ? sDev / avg : 1.0;
        record.consistency = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
      } else {
        record.consistency = 50;
      }
      record.score = Math.round((record.speed * 0.6) + (record.consistency * 0.4));
    } else if (fgSelectedExercise === 'opposition') {
      record.exercise = "Finger Opposition";
      record.speed = Math.round((fgOppCompletedCycles / 25) * 60);
      record.consistency = 80;
      record.score = Math.min(100, 50 + fgOppCompletedCycles * 10);
    } else if (fgSelectedExercise === 'pop') {
      record.exercise = "Balloon Pop";
      const avgReaction = fgBalloonReactionTimes.length > 0 ? 
        (fgBalloonReactionTimes.reduce((a,b)=>a+b,0) / fgBalloonReactionTimes.length) : 2500;
      record.speed = parseFloat((avgReaction / 1000).toFixed(2));
      
      let totalL = fgBalloonLinearDists.reduce((a,b)=>a+b, 0);
      let totalA = fgBalloonActualDists.reduce((a,b)=>a+b, 0);
      let eff = totalA > 0 ? (totalL / totalA) : 1.0;
      record.consistency = Math.max(0, Math.min(100, Math.round(eff * 100)));
      record.score = Math.max(0, Math.min(100, Math.round(eff * 100)));
    } else if (fgSelectedExercise === 'fist') {
      record.exercise = "Fist Clenching";
      record.speed = Math.round((fgFistReps / 20) * 60);
      if (fgFistIntervals.length > 1) {
        const avg = fgFistIntervals.reduce((a,b)=>a+b, 0) / fgFistIntervals.length;
        const sDev = Math.sqrt(fgFistIntervals.map(v => Math.pow(v - avg, 2)).reduce((a,b)=>a+b,0) / fgFistIntervals.length);
        const cv = avg > 0 ? sDev / avg : 1.0;
        record.consistency = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
      } else {
        record.consistency = 50;
      }
      record.score = Math.round((record.speed * 0.55) + (record.consistency * 0.45));
    } else if (['reach', 'march', 'twist'].includes(fgSelectedExercise)) {
      const labels = { reach: 'BIG Sky Reach', march: 'BIG High March', twist: 'BIG Twist' };
      record.exercise = labels[fgSelectedExercise];
      const duration = 30;
      record.speed = Math.round((fgBigReps / duration) * 60);
      const avgAmp = fgBigAmpHistory.length
        ? fgBigAmpHistory.reduce((a,b)=>a+b,0) / fgBigAmpHistory.length
        : fgBigPeakAmp;
      record.consistency = Math.max(0, Math.min(100, Math.round(avgAmp * 100)));
      record.score = Math.min(100, Math.round(fgBigReps * 8 + avgAmp * 40));
    }

    state.fingerGymLogs.unshift(record);
    getHabits().syncHabitsWithActivityOrMeal('activity', record.exercise);
    saveState();
    
    getAudio().playSound('success');
    getAudio().speakText("Great job! Session completed successfully.");
    getModals().showToast(`${record.exercise} results saved!`);
    
    renderFingerGymHistory();
    setFingerGymExercise(fgSelectedExercise);
  }

  function spawnFgBalloon() {
    if (fgBalloonsCleared >= fgMaxBalloons) {
      completeFingerGymSession();
      return;
    }
    const x = 0.15 + Math.random() * 0.7;
    const y = 0.15 + Math.random() * 0.7;
    const radius = 0.07;
    const lastB = fgBalloons[fgBalloons.length - 1];
    fgBalloons.push({ x, y, radius, popped: false, color: `hsl(${Math.random() * 360}, 80%, 55%)` });
    fgBalloonStartTime = performance.now();
    const prevX = lastB ? lastB.x : 0.5;
    const prevY = lastB ? lastB.y : 0.5;
    fgBalloonLinearDists.push(Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2)));
    fgBalloonCurrentPathDist = 0;
    fgBalloonLastPathPoint = null;
  }

  function fingerGymTrackingLoop() {
    if (!fgActive) return;

    const video = document.getElementById('fg-webcam');
    const canvas = document.getElementById('fg-canvas');
    if (!video || !canvas) return;

    if (video.currentTime !== fgLastVideoTime) {
      fgLastVideoTime = video.currentTime;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const nowMs = performance.now();
      
      const isBig = ['reach', 'march', 'twist'].includes(fgSelectedExercise);

      if (isBig && fgPoseLandmarker) {
        const poseResults = fgPoseLandmarker.detectForVideo(video, nowMs);
        if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
          const pose = poseResults.landmarks[0];
          drawFgPoseSkeleton(ctx, canvas, pose);
          if (fgGameState === 'playing') {
            if (fgSelectedExercise === 'reach') processFgReach(pose);
            else if (fgSelectedExercise === 'march') processFgMarch(pose);
            else if (fgSelectedExercise === 'twist') processFgTwist(pose);
          }
        }
      } else if (!isBig && fgHandLandmarker) {
        const results = fgHandLandmarker.detectForVideo(video, nowMs);
        if (results && results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const wrist = landmarks[0];
          const middleMCP = landmarks[9];
          const currentScale = Math.sqrt(
            Math.pow(wrist.x - middleMCP.x, 2) + 
            Math.pow(wrist.y - middleMCP.y, 2)
          );
          if (currentScale > 0.01) {
            fgCalibrationScale = 0.9 * fgCalibrationScale + 0.1 * currentScale;
          }

          drawFgHandSkeleton(ctx, canvas, landmarks);

          if (fgGameState === 'playing') {
            if (fgSelectedExercise === 'tapping') processFgTapping(landmarks);
            else if (fgSelectedExercise === 'opposition') processFgOpposition(landmarks);
            else if (fgSelectedExercise === 'pop') processFgPop(ctx, canvas, landmarks);
            else if (fgSelectedExercise === 'fist') processFgFist(landmarks);
          }
        }
      }
    }

    fgAnimId = requestAnimationFrame(fingerGymTrackingLoop);
  }

  function processFgTapping(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const rawDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    const normDist = rawDist / fgCalibrationScale;

    fgTappingDistanceHistory.push(normDist);
    if (fgTappingDistanceHistory.length > 100) fgTappingDistanceHistory.shift();

    if (normDist > fgTappingMaxCurrentAmp) {
      fgTappingMaxCurrentAmp = normDist;
    }

    if (fgTappingState === 'open' && normDist < 0.32) {
      fgTappingState = 'closed';
      fgTappedTimestamps.push(performance.now());
      const val1 = document.getElementById('fg-metric-val-1');
      if (val1) val1.textContent = fgTappedTimestamps.length.toString();
      const audioChk = document.getElementById('fg-audio-chk');
      if (audioChk && audioChk.checked) getAudio().playSound('click');
      fgTappingMaxCurrentAmp = 0;
    } else if (fgTappingState === 'closed' && normDist > 0.45) {
      fgTappingState = 'open';
    }
    drawFgTappingLiveGraph(fgTappingDistanceHistory);
  }

  function processFgOpposition(landmarks) {
    const thumbTip = landmarks[4];
    const targetFinger = fgOppSequence[fgOppCurrentIdx];
    const targetTip = landmarks[targetFinger];
    const rawDist = Math.sqrt(
      Math.pow(thumbTip.x - targetTip.x, 2) + 
      Math.pow(thumbTip.y - targetTip.y, 2)
    );
    const normDist = rawDist / fgCalibrationScale;

    if (fgOppReleased && normDist < 0.30) {
      fgOppReleased = false;
      getAudio().playSound('success');
      fgOppCurrentIdx++;
      if (fgOppCurrentIdx >= fgOppSequence.length) {
        fgOppCurrentIdx = 0;
        fgOppCompletedCycles++;
        const val1 = document.getElementById('fg-metric-val-1');
        if (val1) val1.textContent = fgOppCompletedCycles.toString();
        getAudio().speakText("Sequence completed. Return to index finger.");
      } else {
        getAudio().speakText(`Touch thumb to ${fgOppLabels[fgOppCurrentIdx]} finger`);
      }
      updateOppositionUI(fgOppCurrentIdx);
    } else if (!fgOppReleased && normDist > 0.36) {
      fgOppReleased = true;
    }
  }

  function processFgPop(ctx, canvas, landmarks) {
    if (fgBalloons.length === 0) return;
    const indexTip = landmarks[8];
    const activeBalloon = fgBalloons[fgBalloons.length - 1];
    const now = performance.now();
    if (fgBalloonLastPathPoint) {
      const step = Math.sqrt(
        Math.pow(indexTip.x - fgBalloonLastPathPoint.x, 2) + 
        Math.pow(indexTip.y - fgBalloonLastPathPoint.y, 2)
      );
      fgBalloonCurrentPathDist += step;
    }
    fgBalloonLastPathPoint = { x: indexTip.x, y: indexTip.y };

    const distanceToBalloon = Math.sqrt(
      Math.pow(indexTip.x - activeBalloon.x, 2) + 
      Math.pow(indexTip.y - activeBalloon.y, 2)
    );

    if (distanceToBalloon < activeBalloon.radius) {
      activeBalloon.popped = true;
      fgBalloonsCleared++;
      const val1 = document.getElementById('fg-metric-val-1');
      if (val1) val1.textContent = fgBalloonsCleared.toString();
      
      const audioChk = document.getElementById('fg-audio-chk');
      if (audioChk && audioChk.checked) {
        try {
          const ctxAudio = getAudio().ensureAudio();
          if (ctxAudio) {
            const o = ctxAudio.createOscillator();
            const g = ctxAudio.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(200, ctxAudio.currentTime);
            o.frequency.exponentialRampToValueAtTime(700, ctxAudio.currentTime + 0.1);
            g.gain.setValueAtTime(0.2, ctxAudio.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 0.1);
            o.connect(g).connect(ctxAudio.destination);
            o.start(); o.stop(ctxAudio.currentTime + 0.1);
          }
        } catch(e){}
      }

      fgBalloonReactionTimes.push(now - fgBalloonStartTime);
      fgBalloonActualDists.push(fgBalloonCurrentPathDist);
      spawnFgBalloon();
      updatePopUI(fgBalloonsCleared, fgMaxBalloons);
    }

    if (activeBalloon && !activeBalloon.popped) {
      const px = activeBalloon.x * canvas.width;
      const py = activeBalloon.y * canvas.height;
      const pr = activeBalloon.radius * canvas.width;
      ctx.save();
      ctx.strokeStyle = activeBalloon.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = activeBalloon.color.replace('rgb', 'rgba').replace(')', ', 0.25)');
      ctx.beginPath();
      ctx.arc(px, py, pr - 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    const cx = indexTip.x * canvas.width;
    const cy = indexTip.y * canvas.height;
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  function processFgFist(landmarks) {
    const wrist = landmarks[0];
    const tips = [4, 8, 12, 16, 20];
    let avgDist = 0;
    tips.forEach(i => {
      const t = landmarks[i];
      avgDist += Math.sqrt(Math.pow(t.x - wrist.x, 2) + Math.pow(t.y - wrist.y, 2));
    });
    avgDist = (avgDist / tips.length) / fgCalibrationScale;

    fgTappingDistanceHistory.push(avgDist);
    if (fgTappingDistanceHistory.length > 100) fgTappingDistanceHistory.shift();

    if (fgFistState === 'open' && avgDist < 0.70) {
      fgFistState = 'closed';
    } else if (fgFistState === 'closed' && avgDist > 0.88) {
      fgFistState = 'open';
      const now = performance.now();
      if (fgFistLastRepTime > 0) {
        fgFistIntervals.push(now - fgFistLastRepTime);
      }
      fgFistLastRepTime = now;
      fgFistReps++;
      const val1 = document.getElementById('fg-metric-val-1');
      if (val1) val1.textContent = fgFistReps.toString();
      const audioChk = document.getElementById('fg-audio-chk');
      if (audioChk && audioChk.checked) getAudio().playSound('click');
    }
    drawFgTappingLiveGraph(fgTappingDistanceHistory);
  }

  function updateBigAmpUI(amp01, label) {
    const bar = document.getElementById('fg-big-amp-bar');
    const txt = document.getElementById('fg-big-amp-text');
    if (bar) bar.style.width = Math.round(Math.min(1, Math.max(0, amp01)) * 100) + '%';
    if (txt) txt.textContent = label || (Math.round(amp01 * 100) + '%');
  }

  function registerBigRep(amp) {
    const now = performance.now();
    if (fgBigLastRepTime > 0) fgBigIntervals.push(now - fgBigLastRepTime);
    fgBigLastRepTime = now;
    fgBigReps++;
    fgBigAmpHistory.push(amp);
    if (fgBigAmpHistory.length > 40) fgBigAmpHistory.shift();
    if (amp > fgBigPeakAmp) fgBigPeakAmp = amp;
    const val1 = document.getElementById('fg-metric-val-1');
    if (val1) val1.textContent = fgBigReps.toString();
    const audioChk = document.getElementById('fg-audio-chk');
    if (audioChk && audioChk.checked) getAudio().playSound('success');
  }

  function processFgReach(pose) {
    const lShoulder = pose[11], rShoulder = pose[12];
    const lWrist = pose[15], rWrist = pose[16];
    if (!lShoulder || !rShoulder || !lWrist || !rWrist) return;

    const shoulderY = (lShoulder.y + rShoulder.y) / 2;
    const wristY = (lWrist.y + rWrist.y) / 2;
    const rise = shoulderY - wristY;
    const amp = Math.min(1, Math.max(0, rise / 0.35));
    updateBigAmpUI(amp, amp > 0.7 ? 'BIG!' : amp > 0.4 ? 'Higher…' : 'Reach up');

    if (fgBigState === 'low' && amp > 0.72) {
      fgBigState = 'high';
    } else if (fgBigState === 'high' && amp < 0.35) {
      fgBigState = 'low';
      registerBigRep(amp > 0 ? Math.max(amp, fgBigPeakAmp) : 0.75);
      fgBigPeakAmp = 0;
    }
    if (amp > fgBigPeakAmp) fgBigPeakAmp = amp;
  }

  function processFgMarch(pose) {
    const lHip = pose[23], rHip = pose[24];
    const lKnee = pose[25], rKnee = pose[26];
    if (!lHip || !rHip || !lKnee || !rKnee) return;

    const lLift = lHip.y - lKnee.y;
    const rLift = rHip.y - rKnee.y;
    const best = Math.max(lLift, rLift);
    const amp = Math.min(1, Math.max(0, best / 0.22));
    updateBigAmpUI(amp, amp > 0.65 ? 'High!' : 'Lift higher');

    const activeSide = lLift > rLift ? 'left' : 'right';
    if (fgBigState === 'low' && amp > 0.55) {
      fgBigState = 'high';
      fgBigSide = activeSide;
    } else if (fgBigState === 'high' && amp < 0.25) {
      fgBigState = 'low';
      registerBigRep(amp > 0 ? Math.max(0.5, fgBigPeakAmp) : 0.6);
      fgBigPeakAmp = 0;
    }
    if (amp > fgBigPeakAmp) fgBigPeakAmp = amp;
  }

  function processFgTwist(pose) {
    const lShoulder = pose[11], rShoulder = pose[12];
    const lHip = pose[23], rHip = pose[24];
    if (!lShoulder || !rShoulder) return;

    const shoulderMidX = (lShoulder.x + rShoulder.x) / 2;
    const hipMidX = (lHip && rHip) ? (lHip.x + rHip.x) / 2 : shoulderMidX;
    const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x) + 0.001;
    const widthRatio = Math.min(1, shoulderWidth / 0.28);
    const bias = (shoulderMidX - hipMidX) / shoulderWidth;
    const twistMag = Math.min(1, Math.abs(bias) * 1.4 + (1 - widthRatio) * 0.5);
    updateBigAmpUI(twistMag, twistMag > 0.55 ? (bias > 0 ? 'Right BIG' : 'Left BIG') : 'Twist more');

    if ((fgBigState === 'center' || fgBigState === 'low') && twistMag > 0.45) {
      fgBigState = bias > 0 ? 'right' : 'left';
      fgBigPeakAmp = twistMag;
    } else if ((fgBigState === 'left' || fgBigState === 'right') && twistMag < 0.22) {
      registerBigRep(Math.max(0.5, fgBigPeakAmp));
      fgBigState = 'center';
      fgBigPeakAmp = 0;
    }
    if (twistMag > fgBigPeakAmp) fgBigPeakAmp = twistMag;
  }

  function drawFgPoseSkeleton(ctx, canvas, pose) {
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28]
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.75)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    connections.forEach(([a, b]) => {
      const p1 = pose[a], p2 = pose[b];
      if (!p1 || !p2 || (p1.visibility !== undefined && p1.visibility < 0.4)) return;
      if (p2.visibility !== undefined && p2.visibility < 0.4) return;
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    });
    [15, 16, 25, 26, 0].forEach(i => {
      const p = pose[i];
      if (!p) return;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 8, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#fff' : '#FF6B35';
      ctx.fill();
    });
    ctx.restore();
  }

  function drawFgHandSkeleton(ctx, canvas, landmarks) {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [9, 10], [10, 11], [11, 12],
      [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    ctx.save();
    ctx.strokeStyle = "rgba(0, 174, 239, 0.6)";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";

    connections.forEach(([p1, p2]) => {
      const pt1 = landmarks[p1];
      const pt2 = landmarks[p2];
      ctx.beginPath();
      ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
      ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
      ctx.stroke();
    });

    landmarks.forEach((pt, index) => {
      const isTip = [4, 8, 12, 16, 20].includes(index);
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, isTip ? 7.5 : 4.5, 0, 2 * Math.PI);
      if (index === 4 || index === 8) ctx.fillStyle = "#FF6B35";
      else if (isTip) ctx.fillStyle = "var(--primary)";
      else ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    });
    ctx.restore();
  }

  function drawFgTappingLiveGraph(history) {
    const canvas = document.getElementById('fg-live-graph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (history.length < 2) return;

    const yClosed = canvas.height * (1 - 0.28);
    const yOpen = canvas.height * (1 - 0.55);

    ctx.save();
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yClosed); ctx.lineTo(canvas.width, yClosed);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(22, 163, 74, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, yOpen); ctx.lineTo(canvas.width, yOpen);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'var(--primary)';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const step = canvas.width / 100;
    history.forEach((val, idx) => {
      const valClamped = Math.max(0, Math.min(1.4, val)) / 1.4;
      const y = canvas.height * (1 - valClamped);
      const x = idx * step;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function updateOppositionUI(targetIdx) {
    for (let i = 0; i < 4; i++) {
      const node = document.getElementById(`fg-opp-${i}`);
      if (node) {
        if (i === targetIdx) node.classList.add('active');
        else node.classList.remove('active');
      }
    }
  }

  function updatePopUI(count, total) {
    const popText = document.getElementById('fg-pop-text');
    const popBar = document.getElementById('fg-pop-bar');
    if (popText) popText.textContent = `${count} / ${total}`;
    if (popBar) popBar.style.width = `${(count / total) * 100}%`;
  }

  function renderFingerGymHistory() {
    const state = getState();
    const tbody = document.getElementById('fg-history-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const logs = (state.fingerGymLogs || []).filter(row => !row.exercise.includes("Voice"));

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 1.5rem; text-align: center; color: var(--ink-faint); font-weight: 500;">No assessments performed yet. Start a session above!</td></tr>`;
      return;
    }

    logs.slice(0, 8).forEach(row => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--line)';
      tr.style.fontSize = '0.9rem';

      let speedText = "";
      if (row.exercise.includes("Tapping") || row.exercise.includes("Fist")) speedText = `${row.speed} BPM`;
      else if (row.exercise.includes("Opposition")) speedText = `${row.speed} C/min`;
      else if (row.exercise.includes("BIG") || row.exercise.includes("Reach") || row.exercise.includes("March") || row.exercise.includes("Twist")) speedText = `${row.speed}/min`;
      else if (row.exercise.includes("Race")) speedText = `Lvl ${row.speed}`;
      else speedText = `${row.speed}s avg`;

      let rating = "Fair";
      let ratingColor = "var(--warning)";
      if (row.score >= 82 || (row.exercise.includes("Race") && row.score >= 3)) { rating = "Excellent"; ratingColor = "var(--success)"; }
      else if (row.score >= 68 || (row.exercise.includes("Race") && row.score >= 1)) { rating = "Good"; ratingColor = "var(--primary-dark)"; }

      tr.innerHTML = `
        <td style="padding: 10px 8px; color: var(--ink-soft); font-weight: 500;">${row.date} ${row.time}</td>
        <td style="padding: 10px 8px; font-weight: 700;">${row.exercise}</td>
        <td style="padding: 10px 8px;">${speedText}</td>
        <td style="padding: 10px 8px;">${row.exercise.includes("Race") ? `${row.score} Avoided` : `${row.consistency}%`}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: ${ratingColor};">${rating}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function initFingerGymTab() {
    renderFingerGymHistory();
    loadFingerGymMediaPipe().then(() => {
      if (fgActive === false && document.getElementById('tabFingerGym')?.getAttribute('aria-selected') === 'true') {
        startFingerGymTracker();
      }
    });

    if (window.fgListenersBound) return;
    window.fgListenersBound = true;

    document.getElementById('fg-card-tapping')?.addEventListener('click', () => setFingerGymExercise('tapping'));
    document.getElementById('fg-card-opposition')?.addEventListener('click', () => setFingerGymExercise('opposition'));
    document.getElementById('fg-card-pop')?.addEventListener('click', () => setFingerGymExercise('pop'));
    document.getElementById('fg-card-fist')?.addEventListener('click', () => setFingerGymExercise('fist'));
    document.getElementById('fg-card-reach')?.addEventListener('click', () => setFingerGymExercise('reach'));
    document.getElementById('fg-card-march')?.addEventListener('click', () => setFingerGymExercise('march'));
    document.getElementById('fg-card-twist')?.addEventListener('click', () => setFingerGymExercise('twist'));

    document.getElementById('fg-btn-start')?.addEventListener('click', startFingerGymSession);
    document.getElementById('fg-btn-stop')?.addEventListener('click', stopFingerGymSession);
  }

  window.Cadence.fingerGymEngine = {
    loadFingerGymMediaPipe,
    startFingerGymTracker,
    stopFingerGymTracker,
    setFingerGymExercise,
    startFingerGymSession,
    stopFingerGymSession,
    renderFingerGymHistory,
    initFingerGymTab
  };
})();
