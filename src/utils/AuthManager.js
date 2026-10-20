import { auth, googleProvider, isFirebaseConfigured } from './firebaseConfig.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

class AuthManager {
    constructor() {
        this.user = null;
        this.listeners = [];
        this.guestCallsign = localStorage.getItem('cosmic_guest_callsign') || this.generateGuestCallsign();
        this.init();
    }

    generateGuestCallsign() {
        const randomNum = Math.floor(100 + Math.random() * 900);
        const code = `PILOT-${randomNum}`;
        localStorage.setItem('cosmic_guest_callsign', code);
        return code;
    }

    setGuestCallsign(name) {
        if (!name || !name.trim()) return;
        this.guestCallsign = name.trim().toUpperCase().slice(0, 12);
        localStorage.setItem('cosmic_guest_callsign', this.guestCallsign);
        this.notifyListeners();
    }

    init() {
        if (isFirebaseConfigured && auth) {
            onAuthStateChanged(auth, (user) => {
                this.user = user;
                this.notifyListeners();
            });
        }
    }

    onAuthChange(callback) {
        this.listeners.push(callback);
        callback(this.getProfile());
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners() {
        const profile = this.getProfile();
        this.listeners.forEach(cb => {
            try { cb(profile); } catch (_) {}
        });
    }

    getProfile() {
        if (this.user) {
            return {
                isAuthenticated: true,
                uid: this.user.uid,
                displayName: this.user.displayName || 'ACE PILOT',
                photoURL: this.user.photoURL || null,
                email: this.user.email,
                isGuest: false
            };
        }
        return {
            isAuthenticated: false,
            uid: `guest_${this.guestCallsign}`,
            displayName: this.guestCallsign,
            photoURL: null,
            email: null,
            isGuest: true
        };
    }

    async signInWithGoogle() {
        if (!isFirebaseConfigured || !auth || !googleProvider) {
            console.warn('Firebase not fully configured. Using Guest mode.');
            return { success: false, message: 'Firebase not configured in .env' };
        }
        try {
            const result = await signInWithPopup(auth, googleProvider);
            this.user = result.user;
            this.notifyListeners();
            return { success: true, user: this.user };
        } catch (error) {
            console.error('Google Sign-In failed:', error);
            return { success: false, error };
        }
    }

    async logout() {
        if (isFirebaseConfigured && auth) {
            await signOut(auth);
        }
        this.user = null;
        this.notifyListeners();
    }
}

export const authManager = new AuthManager();
