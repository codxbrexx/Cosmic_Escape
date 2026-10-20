import { db, isFirebaseConfigured, detectUserRegion } from './firebaseConfig.js';
import { authManager } from './AuthManager.js';
import {
    collection,
    addDoc,
    doc,
    setDoc,
    increment,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';

// Realistic curated fallback records when offline or before live Firebase is connected
const MOCK_LEADERBOARDS = {
    CLASSIC: [
        { pilotName: "NOVA_HUNTER", score: 14250, region: "AMERICAS", isUser: false, flightDurationSec: 142, deviceType: "desktop" },
        { pilotName: "COSMIC_ACE", score: 11800, region: "INDIA", isUser: false, flightDurationSec: 118, deviceType: "mobile" },
        { pilotName: "VOID_WALKER", score: 9400, region: "EUROPE", isUser: false, flightDurationSec: 94, deviceType: "desktop" },
        { pilotName: "SOLAR_DRIFT", score: 8120, region: "ASIA", isUser: false, flightDurationSec: 81, deviceType: "mobile" },
        { pilotName: "NEBULA_99", score: 6540, region: "OCEANIA", isUser: false, flightDurationSec: 65, deviceType: "desktop" },
        { pilotName: "STAR_FOX", score: 5200, region: "AMERICAS", isUser: false, flightDurationSec: 52, deviceType: "desktop" },
        { pilotName: "ASTRO_GHOST", score: 3950, region: "EUROPE", isUser: false, flightDurationSec: 39, deviceType: "mobile" },
        { pilotName: "HYPER_PILOT", score: 2800, region: "INDIA", isUser: false, flightDurationSec: 28, deviceType: "mobile" },
    ],
    STORY: [
        { pilotName: "GALAXY_CONQ", score: 38500, region: "ASIA", isUser: false, flightDurationSec: 280, deviceType: "desktop" },
        { pilotName: "WARP_RIDER", score: 31200, region: "EUROPE", isUser: false, flightDurationSec: 240, deviceType: "mobile" },
        { pilotName: "ORBITAL_V", score: 24700, region: "AMERICAS", isUser: false, flightDurationSec: 195, deviceType: "desktop" },
        { pilotName: "COSMOS_KING", score: 19800, region: "INDIA", isUser: false, flightDurationSec: 160, deviceType: "mobile" },
        { pilotName: "CHRONO_JET", score: 14500, region: "OCEANIA", isUser: false, flightDurationSec: 120, deviceType: "desktop" },
        { pilotName: "ZENITH_ONE", score: 11000, region: "EUROPE", isUser: false, flightDurationSec: 90, deviceType: "mobile" },
    ],
    BOSS_RUSH: [
        { pilotName: "SURVIVOR_X", score: 28400, region: "AMERICAS", isUser: false, flightDurationSec: 210, deviceType: "desktop" },
        { pilotName: "APEX_DODGER", score: 21900, region: "INDIA", isUser: false, flightDurationSec: 175, deviceType: "mobile" },
        { pilotName: "IRON_WING", score: 17300, region: "EUROPE", isUser: false, flightDurationSec: 140, deviceType: "desktop" },
        { pilotName: "VOID_DRIFTER", score: 13500, region: "ASIA", isUser: false, flightDurationSec: 105, deviceType: "mobile" },
        { pilotName: "ZERO_PULSE", score: 9800, region: "OCEANIA", isUser: false, flightDurationSec: 75, deviceType: "mobile" },
    ]
};

export class LeaderboardManager {
    static COLLECTION_RUNS = "cosmic_leaderboard";
    static COLLECTION_USERS = "cosmic_users";

    // Submit a completed flight run with rich telemetry
    static async submitScore(mode, score, coins = 0, runMeta = {}) {
        const profile = authManager.getProfile();
        const numScore = Math.floor(score);
        if (numScore <= 0) return;

        const region = detectUserRegion();
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 1024;
        const deviceType = runMeta.deviceType || (isTouch ? 'mobile' : 'desktop');

        const entry = {
            userId: profile.uid,
            pilotName: profile.displayName || "UNKNOWN PILOT",
            photoURL: profile.photoURL || null,
            isVerified: !profile.isGuest,
            score: numScore,
            coins: coins,
            mode: mode,
            region: region,
            sectorOrWave: runMeta.sectorOrWave || 1,
            flightDurationSec: runMeta.flightDurationSec || 0,
            deathCause: runMeta.deathCause || 'collision',
            deviceType: deviceType,
            createdAt: new Date().toISOString()
        };

        // Cache locally for offline availability
        this.saveLocalEntry(entry);

        // Upload to Firestore if configured
        if (isFirebaseConfigured && db) {
            try {
                // 1. Record flight run entry
                await addDoc(collection(db, this.COLLECTION_RUNS), {
                    ...entry,
                    timestamp: serverTimestamp()
                });

                // 2. Update player profile lifetime stats
                const userRef = doc(db, this.COLLECTION_USERS, profile.uid);
                await setDoc(userRef, {
                    pilotName: entry.pilotName,
                    photoURL: entry.photoURL,
                    region: region,
                    lastActive: serverTimestamp(),
                    totalGamesPlayed: increment(1),
                    lifetimeCoins: increment(coins),
                    [`highestScore_${mode}`]: numScore
                }, { merge: true });

            } catch (err) {
                console.warn("Error recording run to Firebase:", err);
            }
        }
    }

    // Retrieve Top Scores (Global or Regional)
    static async getLeaderboard(mode = "CLASSIC", type = "GLOBAL") {
        const userRegion = detectUserRegion();

        // 1. Try Firestore if configured
        if (isFirebaseConfigured && db) {
            try {
                let q;
                if (type === "REGIONAL") {
                    q = query(
                        collection(db, this.COLLECTION_RUNS),
                        where("mode", "==", mode),
                        where("region", "==", userRegion),
                        orderBy("score", "desc"),
                        limit(15)
                    );
                } else {
                    q = query(
                        collection(db, this.COLLECTION_RUNS),
                        where("mode", "==", mode),
                        orderBy("score", "desc"),
                        limit(15)
                    );
                }

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const profile = authManager.getProfile();
                    return snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            pilotName: data.pilotName || "UNKNOWN",
                            photoURL: data.photoURL,
                            score: data.score,
                            region: data.region || "GLOBAL",
                            isUser: data.userId === profile.uid,
                            deviceType: data.deviceType || "desktop",
                            flightDurationSec: data.flightDurationSec || 0
                        };
                    });
                }
            } catch (err) {
                console.warn("Firestore fetch failed, falling back to local records:", err);
            }
        }

        // 2. Fallback to Local + Mock Records
        return this.getLocalLeaderboard(mode, type);
    }

    static saveLocalEntry(entry) {
        try {
            const key = `cosmic_local_scores_${entry.mode}`;
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            existing.push({ ...entry, isUser: true });
            existing.sort((a, b) => b.score - a.score);
            localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
        } catch (_) {}
    }

    static getLocalLeaderboard(mode, type) {
        const userRegion = detectUserRegion();
        const baseMocks = MOCK_LEADERBOARDS[mode] || MOCK_LEADERBOARDS.CLASSIC;

        let localUserScores = [];
        try {
            const key = `cosmic_local_scores_${mode}`;
            localUserScores = JSON.parse(localStorage.getItem(key) || "[]");
        } catch (_) {}

        let combined = [...localUserScores, ...baseMocks];
        if (type === "REGIONAL") {
            combined = combined.filter(item => item.region === userRegion || item.isUser);
        }

        combined.sort((a, b) => b.score - a.score);
        return combined.slice(0, 10);
    }

    // Top #1 record for marquee ticker
    static async getTopChampion(mode = "CLASSIC") {
        const board = await this.getLeaderboard(mode, "GLOBAL");
        return board.length > 0 ? board[0] : null;
    }
}
