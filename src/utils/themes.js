export const THEMES = [
    { border: '#00FFCC', bg: 'linear-gradient(to bottom, #000000 0%, #1a1a2e 100%)' }, // Default Deep Blue
    { border: '#FF00FF', bg: 'linear-gradient(to bottom, #1a0b2e 0%, #3a0e35 100%)' }, // Nebula Purple
    { border: '#FF4444', bg: 'linear-gradient(to bottom, #2e0b0b 0%, #3a0e0e 100%)' }, // Mars Red
    { border: '#00FF00', bg: 'linear-gradient(to bottom, #001a0a 0%, #003311 100%)' }, // Alien Green
    { border: '#FFAA00', bg: 'linear-gradient(to bottom, #2e1a0b 0%, #3a2e0e 100%)' }, // Solar Orange
    { border: '#00FFFF', bg: 'linear-gradient(to bottom, #001a2e 0%, #00334d 100%)' }, // Ice Blue
    { border: '#FFFFFF', bg: 'linear-gradient(to bottom, #222 0%, #444 100%)' },       // Void Grey
    { border: '#FFFF00', bg: 'linear-gradient(to bottom, #2e2e0b 0%, #3a3a0e 100%)' },  // Toxic Yellow
    { border: '#FF0099', bg: 'linear-gradient(to bottom, #2e001a 0%, #4d002b 100%)' }, // Cyber Pink
    { border: '#AA00FF', bg: 'linear-gradient(to bottom, #1a002e 0%, #2b004d 100%)' }, // Deep Void
];

export function getThemeForLevel(level) {
    // Change theme every 10 levels
    // Logic: index 0 for 1-10, index 1 for 11-20
    const themeIndex = Math.floor((level - 1) / 10) % THEMES.length;
    return THEMES[themeIndex];
}
