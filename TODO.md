# Cosmic Escape — Master Project Roadmap & Specifications

## 🌌 Project Vision & Identity

**Cosmic Escape** is a high-octane retro-futuristic cosmic arcade evasion runner built with **Vanilla JavaScript (ES6+)**, **HTML5 Canvas**, **Tailwind CSS**, and **Vite**.

The core gameplay philosophy is **Pure Piloting Skill & Evasion**:
- Dodge asteroids, alien UFOs, and orbital flagship beams.
- Weave through hazard fields, collect cosmic gold and fuel shields.
- Overload mothership disruption shields via Overdrive EMP Cores to trigger Hyperdrive warp jumps.
- Zero weapon firing / bullet spamming bloat.

---

## ✅ Completed Milestones & Architecture

### 1. Architecture & Maintainability
- [x] **Unified `BaseMode.js`**: Extracted 350+ lines of duplicate code from `ClassicMode`, `StoryMode`, and `BossRushMode` into a clean base class handling physics, starfields, particles, screen shake, collisions, and HUD.
- [x] **Procedural Audio & Haptics (`SoundManager.js`)**: 8-bit synthesizer using Web Audio API (thrust hum, coin chimes, heart jingles, impacts, rumbles, sector fanfare, game over tones) + Navigator Vibrate API.
- [x] **Type-Safe Score Storage (`ScoreManager.js`)**: Real-time high-score tracking with legacy key migrations and integer validation.
- [x] **Consolidated GameManager**: Eliminated redundant event listeners between `main.js` and `GameManager.js`; continuous starfield menu loop.

### 2. Gameplay & Scoring Fixes
- [x] **Complete Fire & Weapon Removal**: Deleted `Projectile.js`, `bulletSprite`, `Ship.shoot()`, and firing keys (`F`/`Z`/`Ctrl`/touch auto-fire). Replaced crude magenta flame box with dual-stream cyan/magenta ion thruster particles.
- [x] **Coin Scoring Fixed**: Coins now grant **+100 PTS** (and 10 coins grant +1 Life in Story Mode) instead of 0 points.
- [x] **Dynamic Floating Popups (`FloatingText.js`)**: Live on-screen indicators (`+100`, `+1 LIFE`, `EMP CHARGED! +500`, `WAVE CLEAR! +5000`).
- [x] **Boss Rush 30-Second Countdown**: 30-second survival countdown with escalating hazard density, followed by an immediate Mothership Flagship encounter where players dodge plasma beams and charge EMP cores.

### 3. Mobile & Small Screen Optimization
- [x] **Virtual Touch Controls**: Tactile steering buttons (`◀` `▶`) and glowing `▲ FLY` thrust button with haptic feedback.
- [x] **Touch Gestures**: Tap & hold anywhere to fly, slide to steer.
- [x] **Full-Screen Toggle (`⛶`)**: Native HTML5 Fullscreen API for distraction-free edge-to-edge gaming.
- [x] **Dynamic Viewport (`100dvh`)**: Mobile address bar collapsing no longer causes vertical jumping.
- [x] **Landscape Optimization**: Auto-expands to full screen height in landscape; portrait helper guide with tilting animation.

### 4. Global & Regional Leaderboard + Google Auth
- [x] **Firebase Authentication**: One-tap Google Sign-in with verified avatar and display name.
- [x] **Guest Pilot Mode**: Automatic unique callsigns (e.g. `PILOT-442`) with custom callsign renaming.
- [x] **Dual Scope Leaderboards**: `🌐 GLOBAL` (worldwide top pilots) and `📍 REGIONAL` (auto-detected by browser timezone/locale: `AMERICAS`, `EUROPE`, `INDIA`, `ASIA`, `OCEANIA`, `AFRICA`).
- [x] **Mode Filter**: Switch between `CLASSIC`, `ODYSSEY`, and `SURVIVAL`.
- [x] **Galaxy Champion Ticker**: Start Menu marquee ticker featuring the #1 player across the galaxy.
- [x] **Offline Fallback**: Curated local records so game and leaderboard never crash when offline or before Firebase is configured.

---

## 🗄️ Firebase Data Model: What is Recorded

The game records two collections in Firebase Firestore:

### Collection 1: `cosmic_leaderboard` (Individual Flight Runs)

Each completed run creates a flight log document with the following schema:

| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `userId` | `string` | Google UID or guest UID | `"u9A1zKl8m..."` or `"guest_PILOT-442"` |
| `pilotName` | `string` | Player callsign or Google display name | `"COSMIC_ACE"` |
| `photoURL` | `string \| null` | Google profile picture URL | `"https://lh3.google..."` |
| `isVerified` | `boolean` | `true` if Google authenticated, `false` for guest | `true` |
| `score` | `number` | Final score achieved (integer) | `14250` |
| `coins` | `number` | Total gold coins gathered in the run | `18` |
| `mode` | `string` | Mode played | `'CLASSIC'` \| `'STORY'` \| `'BOSS_RUSH'` |
| `region` | `string` | Player geographical region | `'INDIA'` \| `'AMERICAS'` \| `'EUROPE'` \| `'ASIA'` |
| `sectorOrWave` | `number` | Max sector or survival wave reached | `6` |
| `flightDurationSec`| `number` | Total seconds survived in the run | `142` |
| `deathCause` | `string` | Hazard causing ship destruction | `'asteroid'` \| `'ufo'` \| `'plasma_beam'` \| `'lower_barrier'` |
| `deviceType` | `string` | Platform used | `'mobile'` \| `'desktop'` |
| `createdAt` | `string` | ISO timestamp | `"2026-10-21T01:30:00.000Z"` |
| `timestamp` | `Timestamp` | Firestore server timestamp for ordered queries | `serverTimestamp()` |

### Collection 2: `cosmic_users` (Player Career & Lifetime Stats)

Each unique pilot has a profile document at `cosmic_users/{userId}`:

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `pilotName` | `string` | Current callsign / Google name |
| `photoURL` | `string \| null` | Avatar image |
| `region` | `string` | Primary region |
| `totalGamesPlayed`| `number` | Lifetime flight missions initiated (incremented atomically) |
| `lifetimeCoins` | `number` | Total coins accumulated across all runs (currency for skins) |
| `highestScore_CLASSIC` | `number` | Personal best in Classic Arcade |
| `highestScore_STORY` | `number` | Personal best in Galactic Odyssey |
| `highestScore_BOSS_RUSH`| `number` | Personal best in Survival Protocol |
| `lastActive` | `Timestamp` | Last time player completed a flight |

---

## 🔒 Recommended Firestore Security Rules

Copy and paste this into your Firebase Console (**Firestore Database -> Rules**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Flight Run Submissions: Anyone can read, logged-in or guest can post positive scores
    match /cosmic_leaderboard/{runId} {
      allow read: if true;
      allow create: if request.resource.data.score is number 
                    && request.resource.data.score > 0
                    && request.resource.data.pilotName is string;
      allow update, delete: if false; // Scores are immutable
    }

    // User Career Profiles: Publicly readable, writeable only by the owner
    match /cosmic_users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   || request.resource.data.userId == userId;
    }
  }
}
```

---

## 🚀 What is ACTUALLY REQUIRED for Production Launch

To launch the game to the public, here are the concrete launch steps:

1. **Connect Real Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a project (e.g. `cosmic-escape-game`).
   - Enable **Authentication** -> Turn on **Google** sign-in provider.
   - Enable **Cloud Firestore** -> Select production mode and apply the rules above.
   - Create composite Firestore indexes (if prompted by the console for mode + score ordering).
   - Copy Firebase config values into `.env` (refer to `.env.example`).
2. **PWA Setup (Optional Home-Screen Installation)**:
   - Add `manifest.json` and a service worker for offline asset caching.
3. **Deploy to Hosting**:
   - Can be deployed with one command to **Vercel**, **Firebase Hosting**, or **Netlify**:
     ```bash
     npm run build
     # Deploy dist/ folder
     ```
