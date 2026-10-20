import { db, isFirebaseConfigured, detectUserRegion } from './firebaseConfig.js';
import { authManager } from './AuthManager.js';
import {
    collection,
    addDoc,
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
        { pilotName: "NOVA_HUNTER", score: 14250, region: "AMERICAS", isUser: false },
        { pilotName: "COSMIC_ACE", score: 11800, region: "INDIA", isUser: false },
        { pilotName: "VOID_WALKER", score: 9400, region: "EUROPE", isUser: false },
        { pilotName: "SOLAR_DRIFT", score: 8120, region: "ASIA", isUser: false },
        { pilotName: "NEBULA_99", score: 6540, region: "OCEANIA", isUser: false },
        { pilotName: "STAR_FOX", score: 5200, region: "AMERICAS", isUser: false },
        { pilotName: "ASTRO_GHOST", score: 3950, region: "EUROPE", isUser: false },
        { pilotName: "HYPER_PILOT", score: 2800, region: "INDIA", isUser: false },
    ],
    STORY: [
        { pilotName: "GALAXY_CONQ", score: 38500, region: "ASIA", isUser: false },
        { pilotName: "WARP_RIDER", score: 31200, region: "EUROPE", isUser: false },
        { pilotName: "ORBITAL_V", score: 24700, region: "AMERICAS", isUser: false },
        { pilotName: "COSMOS_KING", score: 19800, region: "INDIA", isUser: false },
        { pilotName: "CHRONO_JET", score: 14500, region: "OCEANIA", isUser: false },
        { pilotName: "ZENITH_ONE", score: 11000, region: "EUROPE", isUser: false },
    ],
    BOSS_RUSH: [
        { pilotName: "SURVIVOR_X", score: 28400, region: "AMERICAS", isUser: false },
        { pilotName: "APEX_DODGER", score: 21900, region: "INDIA", isUser: false },
        { pilotName: "IRON_WING", score: 17300, region: "EUROPE", isUser: false },
        { pilotName: "VOID_DRIFTER", score: 13500, region: "ASIA", isUser: false },
        { pilotName: "ZERO_PULSE", score: 9800, region: "OCEANIA", isUser: false },
    ]
};

export class LeaderboardManager {
    static COLLECTION_NAME = "cosmic_leaderboard";

    // Submit a completed run score
    static async submitScore(mode, score, coins = 0) {
        const profile = authManager.getProfile();
        const numScore = Math.floor(score);
        if (numScore <= 0) return;

        const region = detectUserRegion();
        const entry = {
            userId: profile.uid,
            pilotName: profile.displayName || "UNKNOWN PILOT",
            photoURL: profile.photoURL || null,
            score: numScore,
            coins: coins,
            mode: mode,
            region: region,
            createdAt: new Date().toISOString()
        };

        // Cache locally
        this.saveLocalEntry(entry);

        // Upload to Firestore if configured
        if (isFirebaseConfigured && db) {
            try {
                await addDoc(collection(db, this.COLLECTION_NAME), {
                    ...entry,
                    timestamp: serverTimestamp()
                });
            } catch (err) {
                console.warn("Error submitting score to Firestore:", err);
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
                        collection(db, this.COLLECTION_NAME),
                        where("mode", "==", mode),
                        where("region", "==", userRegion),
                        orderBy("score", "desc"),
                        limit(15)
                    );
                } else {
                    q = query(
                        collection(db, this.COLLECTION_NAME),
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
                            isUser: data.userId === profile.uid
                        };
                    });
                }
            } catch (err) {
                console.warn("Firestore fetch failed, falling back to local leaderboard:", err);
            }
        }

        // 2. Fallback to Local + Mock Leaderboard
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
