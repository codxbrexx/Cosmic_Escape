// Unified, type-safe Score & High Score Manager
export class ScoreManager {
    static KEYS = {
        CLASSIC: 'cosmic_high_classic',
        STORY: 'cosmic_high_story',
        BOSS_RUSH: 'cosmic_high_survival',
    };

    // Legacy fallback keys from previous versions
    static LEGACY_KEYS = {
        CLASSIC: 'classicHighScore',
        STORY: 'storyHighScore',
        BOSS_RUSH: 'survivalHighScore',
    };

    static getHighScore(modeKey) {
        const key = this.KEYS[modeKey] || this.KEYS.CLASSIC;
        const legacyKey = this.LEGACY_KEYS[modeKey];
        
        let val = localStorage.getItem(key);
        if (val === null && legacyKey) {
            val = localStorage.getItem(legacyKey);
        }

        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 0 : parsed;
    }

    static saveHighScore(modeKey, score) {
        const key = this.KEYS[modeKey] || this.KEYS.CLASSIC;
        const currentHigh = this.getHighScore(modeKey);
        const numScore = Math.floor(score);

        if (numScore > currentHigh) {
            localStorage.setItem(key, numScore.toString());
            return { isNewHigh: true, highScore: numScore };
        }
        return { isNewHigh: false, highScore: currentHigh };
    }

    static formatScore(score) {
        return Math.floor(score).toString().padStart(5, '0');
    }
}
