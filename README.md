🧠 Cadence · Parkinson's Daily Companion
A comprehensive, client-side self-management platform for Parkinson's disease. Track medications, symptoms, motor states, and lifestyle factors with real-time analytics and therapeutic exercises — all stored securely in your browser.

Cadence is an offline-first, privacy-preserving web application designed to empower individuals with Parkinson's disease to actively track and manage their health. Built entirely in vanilla JavaScript with zero server dependencies, Cadence provides:

    Medication tracking with dosing schedules, adherence metrics, and intelligent reminders

    Symptom logging with severity assessment, body mapping, and contextual notes

    Motor state tracking for ON/OFF/Dyskinesia states

    Gait and balance monitoring with fall and freezing episode logging

    Activity, meal, and sleep tracking with habit streak encouragement

    Real-time analytics with cross-correlation insights between lifestyle factors and symptoms

    Therapeutic exercises powered by MediaPipe (hands, pose) and Web Audio

✨ Key Features
🏥 Clinical Tracking Suite
Feature	Description
Medication Management	Add medications with custom schedules, log doses, track adherence streaks, receive smart reminders
Symptom Logger	Select from 12+ symptom types, rate severity (1-5), map body locations, add voice memos and photos
Motor State Tracker	Log ON, ON+Dyskinesia, and OFF states throughout the day
Gait & Balance	Record falls, freezing episodes, and gait disturbances with severity and context
Sleep Quality	Rate sleep quality (1-5 stars) with optional notes; morning popup for consistent tracking
Activity & Diet	Log meals (protein, carbs, fats, sugar), drinks (coffee, alcohol, water), and exercises
Voice Memos & Photos	Attach audio recordings and images to any symptom or activity log
📊 Analytics & Insights

    Adherence Charts: Visualize medication adherence over the last 7 days

    Motor State Timeline: See daily ON/Dyskinesia/OFF distribution

    Symptom Severity Trends: Track severity patterns alongside lifestyle factors (alcohol, caffeine, exercise)

    Gait Incident Mapping: Plot falls and freezing episodes with severity bubbles

    Symptom Burden Index: Composite score (0-100) integrating motor, symptom, and gait data

    Cross-Correlation Engine: Automatically discover connections between lifestyle factors and symptom outcomes (e.g., "Protein near meds → increased freezing")

🎮 Therapeutic Exercises
Finger Gym (MediaPipe Hands)

    Tapping Test: Tap thumb-index finger; measures speed and consistency

    Finger Opposition: Touch thumb sequentially to index, middle, ring, pinky

    Balloon Pop: Hover finger over floating targets; tracks reaction time and precision

    Fist Clenching: Open/close fist rhythmically; measures grip strength cycles

BIG Amplitude Exercises (MediaPipe Pose)

    Sky Reach: Both arms overhead; scores vertical amplitude

    High March: Knee lifts in place; counts reps and lift height

    Big Twist: Trunk rotation side-to-side; measures range of motion

Exergame Studio (Fullscreen Webcam Mode)

    Wii Sports Boxing: Arm extension punching with dynamic targets; scores accuracy and combo

    Pinch Dino Pro: Thumb-index pinch to jump over obstacles; reactive fine-motor training

Voice Therapy (Speak LOUD)

    Sustained "Ahhh": Hold a loud, steady tone for 10-second reps

    Loud Counting: Count from 1 to 10 with projected voice

    Functional Phrases: Read clinician-selected phrases with real-time loudness feedback

    Mic Calibration: Automatically adjusts target zone to user's natural speaking volume

🧩 Smart Features

    Protein Conflict Alerts: Detects protein meals within 60 minutes of Levodopa doses and notifies user

    Meal Nudges: Gentle reminders for breakfast, lunch, and dinner tracking

    Adherence Streak: Tracks consecutive days of perfect medication adherence

    Rhythm Streak: Encourages daily activity consistency

    Customizable Habits: Set daily exercise and meal limits; add custom habit factors

    Emergency Medical ID: Printable card with patient name, emergency contacts, neurologist details, and critical notes

    GDPR-Compliant Consent: Explicit opt-in with right to erasure and data portability

🛠️ Technology Stack
Frontend

    Vanilla JavaScript (ES6+): No frameworks — pure, modular, maintainable code

    CSS3: Custom properties, glassmorphism, responsive grid, accessible design

    HTML5: Semantic elements, ARIA labels, keyboard-navigable UI

APIs & Libraries

    MediaPipe Tasks Vision: Real-time hand and pose landmark detection

    Web Audio API: Audio feedback, metronome, voice therapy loudness analysis

    Web Speech API: Text-to-speech guidance for exercises

    MediaRecorder API: Voice memo recording

    Canvas API: Real-time data visualization and game rendering

    localStorage: All data storage (no servers, no third parties)

Accessibility

    Keyboard-only navigation (skip links, focus management)

    Screen reader support (ARIA roles, live regions)

    High contrast themes (Light, Dark, Sepia)

    Adjustable text size (Normal, Large, Extra Large)

    Color-blind friendly (patterns + colors)

🏗️ Architecture
text

cadence/
├── index.html              # Single-page application entry point
├── css/
│   └── style.css           # All styles (themes, components, animations)
├── games/
│   ├── boxing.html         # Wii Sports Boxing exergame (MediaPipe Pose)
│   └── dino.html           # Pinch Dino Pro exergame (MediaPipe Hands)
└── js/
    ├── main.js             # Application entry, event coordination
    ├── helpers.js          # Utilities (UID, date formatting, math)
    ├── dataStore.js        # State management, localStorage abstraction
    ├── uiRenderer.js       # DOM updates, clock, ribbon, charts
    ├── modalManager.js     # Modal lifecycle, toast, voice/photo inputs
    ├── templates.js        # HTML template literals for all modals
    ├── medicationEngine.js # Scheduling, adherence, alarms, reminders
    ├── habitEngine.js      # Daily limits, streak, encouragement
    ├── analyticsEngine.js  # Cross-correlation, burden index, SVG charts
    ├── cueingEngine.js     # FoG metronome and rhythm cueing
    ├── fingerGymEngine.js  # Hand/Pose exercises (MediaPipe)
    ├── voiceTherapyEngine.js # LSVT LOUD-inspired voice training
    └── exergameEngine.js   # Fullscreen game launcher & score capture

Data Flow
text

User Action → Event Handler → State Update → localStorage → UI Re-render
                                    ↓
                            Analytics Engine
                                    ↓
                            SVG Charts / Insights

State Structure
javascript

{
  meds: [],                // Medications with schedules
  medLog: [],              // Doses taken
  missedDoses: [],         // Missed doses
  medSkips: [],            // Skipped doses
  symptoms: [],            // Symptom logs with severity
  logs: [],                // Meals, drinks, activities
  sleep: [],               // Sleep quality ratings
  gait: [],                // Falls, freezes
  onOffLogs: [],           // Motor state logs
  fingerGymLogs: [],       // Exercise session results
  moodLogs: [],            // Mood entries
  medicalId: {},           // Emergency contact info
  habitSettings: {},       // Daily limits and factors
  rhythmStreak: 0,         // Consecutive active days
  snoozeUntil: {},         // Dose snooze timestamps
  _nudgeDismissed: {}      // Dismissed popups
}

🔒 Data Privacy & GDPR

Cadence is built with privacy-first principles:
Principle	Implementation
No Data Transmission	All data stored exclusively in localStorage — never sent to any server
Explicit Consent	GDPR-compliant opt-in (Art. 9(2)(a)) before data processing begins
Right to Erasure	"Clear all data" and "Withdraw consent" buttons (Art. 17)
Data Portability	Export/Import as JSON (Art. 20)
Data Minimization	Only collects clinically relevant data
Transparency	Full privacy notice accessible in-app
Age Restriction	16+ years (consistent with GDPR child consent requirements)
🚀 Installation & Setup
Local Development
bash

# Clone the repository
git clone https://github.com/yourusername/cadence.git
cd cadence

# No build step required! Just serve the files
# Using Python 3
python3 -m http.server 8080

# Or using Node.js
npx serve .

# Open http://localhost:8080 in your browser

Browser Requirements

    Desktop: Chrome/Edge (recommended for MediaPipe), Firefox, Safari

    Mobile: Chrome for Android, Safari for iOS 16+

    Webcam: Required for Finger Gym, Exergames, Voice Therapy

📖 Usage Guide
Quick Start

    Consent: Read the privacy notice and explicitly consent to data processing

    Theme: Choose Light, Dark, or Sepia mode (top-right)

    Text Size: Adjust for readability (A, A+, A++)

    Add Medications: 💊 → Add medication → Enter name, dose, schedule

    Log Daily: Use the Quick Log panels for meals, drinks, activities, symptoms, gait

    Track Motor State: Tap ON, ON+Dys, or OFF whenever your state changes

    View Insights: Analytics tab shows charts and discovered correlations

    Do Exercises: Activity tab → Finger Gym, Exergames, Voice Therapy

Medication Management

    Add: Enter name, dose, first dose time, interval (hours), number of doses

    Take: Click the pill button for a scheduled dose

    Edit: Click ✏️ on any medication row

    Delete: Click ✕ on any medication row

    Reminders: Sound and notification 15 minutes before each dose

    Alarm: Full-screen alert when a dose is due (with Snooze/Skip)

    Adherence Streak: Consecutive days of perfect adherence

Data Export/Import

    Export: Footer → 📤 Export data → Downloads cadence-data-YYYY-MM-DD.json

    Import: Footer → 📥 Import data → Select a JSON file from another device

    Emergency ID: Footer → 🆘 Emergency Medical ID → Fill in details → Print card

🏥 Clinical Features
Cross-Correlation Engine

The analytics engine automatically discovers patterns in your data:
Discovery	Example Insight
Protein-Med Interaction	"High-protein meal near Levodopa → 40% increase in freezing episodes"
Exercise-Motor Benefit	"Morning exercise → 30% improvement in ON-state proportion"
Sleep-Impact Analysis	"Poor sleep → 45% higher symptom severity next day"
Alcohol-Effect Patterns	"Alcohol in evening → 25% more OFF-state periods next morning"
Symptom Burden Index

A composite score (0-100) integrating:

    30% OFF-state proportion

    20% Dyskinesia frequency

    30% Average symptom severity

    20% Freezing episodes

Trendline shows weekly changes to track disease progression or treatment response.
🎯 Therapeutic Exercises
Finger Gym (Hand Dexterity)
Exercise	What it Measures	Clinical Relevance
Tapping	Speed and consistency of thumb-index movement	Bradykinesia assessment
Opposition	Sequential finger coordination	Fine motor dexterity
Balloon Pop	Reaction time and spatial precision	Hand-eye coordination
Fist Clenching	Grip strength cycles	Motor amplitude and fatigue
BIG Amplitude (LSVT BIG-inspired)
Exercise	Movement	Clinical Relevance
Sky Reach	Both arms overhead	Upper-body amplitude
High March	High knee lifts	Gait initiation and stride length
Big Twist	Trunk rotation	Axial rigidity and balance
Exergames (Wii Sports-inspired)
Game	Tracking Method	Therapeutic Goal
Boxing	MediaPipe Pose (full body)	Arm extension, reaction time, amplitude
Dino Runner	MediaPipe Hands (pinch)	Fine motor control, timing
Voice Therapy (Speak LOUD)
Exercise	Description	Therapeutic Goal
Sustained Ahhh	Hold a loud, steady tone for 10s reps	Vocal projection and breath control
Loud Counting	Count from 1 to 10 with projected voice	Articulation and volume
Functional Phrases	Read clinical phrases aloud	Connected speech in daily contexts
