// Ship Skins & Hangar Manager
export const SHIP_SKINS = [
    {
        id: 'CYAN',
        name: 'NEON CYAN',
        cost: 0,
        shipColor: '#00FFCC',
        engineGlow: '#00FFFF',
        exhaustPrimary: '#00FFFF',
        exhaustSecondary: '#FF00CC',
        description: 'Standard issue interstellar fighter chassis.'
    },
    {
        id: 'VIOLET',
        name: 'PLASMA VIOLET',
        cost: 50,
        shipColor: '#D946EF',
        engineGlow: '#C026D3',
        exhaustPrimary: '#E879F9',
        exhaustSecondary: '#818CF8',
        description: 'Infused with high-energy dark nebula plasma.'
    },
    {
        id: 'GOLD',
        name: 'SOLAR GOLD',
        cost: 150,
        shipColor: '#FACC15',
        engineGlow: '#EAB308',
        exhaustPrimary: '#FDE047',
        exhaustSecondary: '#F97316',
        description: 'Reinforced with polished solar aurum alloys.'
    },
    {
        id: 'GREEN',
        name: 'CYBER GREEN',
        cost: 300,
        shipColor: '#22C55E',
        engineGlow: '#16A34A',
        exhaustPrimary: '#4ADE80',
        exhaustSecondary: '#06B6D4',
        description: 'Experimental hyper-matrix ion propulsion.'
    },
    {
        id: 'CRIMSON',
        name: 'CRIMSON PHOENIX',
        cost: 500,
        shipColor: '#EF4444',
        engineGlow: '#DC2626',
        exhaustPrimary: '#F87171',
        exhaustSecondary: '#F59E0B',
        description: 'Forged in the stellar flares of binary supergiants.'
    },
    {
        id: 'PHANTOM',
        name: 'VOID PHANTOM',
        cost: 1000,
        shipColor: '#FFFFFF',
        engineGlow: '#38BDF8',
        exhaustPrimary: '#E0F2FE',
        exhaustSecondary: '#818CF8',
        description: 'Stealth-coated hull designed for deep void drift.'
    }
];

export class SkinManager {
    static STORAGE_EQUIPPED = 'cosmic_equipped_skin';
    static STORAGE_UNLOCKED = 'cosmic_unlocked_skins';
    static STORAGE_COINS = 'cosmic_lifetime_coins';

    static getLifetimeCoins() {
        const val = parseInt(localStorage.getItem(this.STORAGE_COINS) || '0', 10);
        return isNaN(val) ? 0 : val;
    }

    static addCoins(amount) {
        const current = this.getLifetimeCoins();
        const updated = current + amount;
        localStorage.setItem(this.STORAGE_COINS, updated.toString());
        return updated;
    }

    static getUnlockedSkins() {
        try {
            const raw = localStorage.getItem(this.STORAGE_UNLOCKED);
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) return arr;
            }
        } catch (_) {}
        return ['CYAN']; // Default unlocked
    }

    static isUnlocked(skinId) {
        if (skinId === 'CYAN') return true;
        return this.getUnlockedSkins().includes(skinId);
    }

    static getEquippedSkinId() {
        const equipped = localStorage.getItem(this.STORAGE_EQUIPPED) || 'CYAN';
        return this.isUnlocked(equipped) ? equipped : 'CYAN';
    }

    static getEquippedSkin() {
        const id = this.getEquippedSkinId();
        return SHIP_SKINS.find(s => s.id === id) || SHIP_SKINS[0];
    }

    static equipSkin(skinId) {
        if (!this.isUnlocked(skinId)) return false;
        localStorage.setItem(this.STORAGE_EQUIPPED, skinId);
        return true;
    }

    static unlockSkin(skinId) {
        const skin = SHIP_SKINS.find(s => s.id === skinId);
        if (!skin) return { success: false, message: 'Unknown chassis.' };
        if (this.isUnlocked(skinId)) return { success: true, message: 'Already unlocked.' };

        const coins = this.getLifetimeCoins();
        if (coins < skin.cost) {
            return { success: false, message: `Need ${skin.cost - coins} more coins!` };
        }

        // Deduct coins & unlock
        localStorage.setItem(this.STORAGE_COINS, (coins - skin.cost).toString());
        const unlocked = this.getUnlockedSkins();
        unlocked.push(skinId);
        localStorage.setItem(this.STORAGE_UNLOCKED, JSON.stringify(unlocked));
        this.equipSkin(skinId);

        return { success: true, skin };
    }
}
