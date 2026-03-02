export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playSound(freq, duration, type = "sine", volume = 0.1, freqEnd = 0.01) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (freqEnd > 0) {
            osc.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
        }
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio error:", e);
    }
}

export const sounds = {
    shoot: () => playSound(800, 0.15, "sawtooth", 0.05, 100),
    explode: (level = 1) => {
        if (level >= 50) {
            // Level 50: Ultimate Explosion (Deep Bass + Crunchy Mid + Crystal High)
            playSound(100, 0.8, "square", 0.3, 10); // Deepest rumble
            setTimeout(() => playSound(600, 0.4, "sawtooth", 0.15, 20), 50); // Sharp crack
            setTimeout(() => playSound(2000, 0.3, "sine", 0.1, 4000), 0); // Divine shimmer
        } else if (level >= 30) {
            // Level 30: Power Explosion (Deep Bass + Sawtooth Rumble)
            playSound(120, 0.5, "square", 0.25, 20);
            setTimeout(() => playSound(400, 0.3, "sawtooth", 0.1, 50), 30);
        } else {
            // Normal Explosion
            playSound(120, 0.4, "square", 0.15, 20);
        }
    },
    collect: () => playSound(1500, 0.1, "sine", 0.1, 800),
    build: () => {
        // Stage 1: Initial mechanical hit ("Ga")
        playSound(180, 0.05, "square", 0.15, 100);
        // Stage 2: Locking click ("Tcha")
        setTimeout(() => playSound(600, 0.08, "sawtooth", 0.1, 400), 40);
        // Stage 3: Low-end resonance
        setTimeout(() => playSound(100, 0.15, "triangle", 0.1, 20), 70);
    },
    damage: () => playSound(200, 0.3, "sawtooth", 0.2, 50),
    waveStart: () => playSound(300, 0.5, "sine", 0.1, 600),
    upgrade: () => {
        setTimeout(() => playSound(900, 0.08, "triangle", 0.15, 300), 0);
        setTimeout(() => playSound(1000, 0.08, "triangle", 0.15, 350), 100);
        setTimeout(() => playSound(1200, 0.12, "triangle", 0.15, 400), 200);
    },
    warningIn: () => {
        playSound(600, 0.3, "sawtooth", 0.15, 600);
        setTimeout(() => playSound(600, 0.3, "sawtooth", 0.15, 600), 400);
    },
    warningOut: () => playSound(400, 0.6, "sine", 0.1, 50),
    salvage: () => playSound(150 + Math.random() * 50, 0.1, "square", 0.1, 50),
    pyuin: () => playSound(400, 1.2, "sine", 0.1, 1500),
    bossStep: () => {
        const now = audioCtx.currentTime;
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        gain1.gain.setValueAtTime(0.05, now);
        gain1.gain.linearRampToValueAtTime(0, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(now + 0.3);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(60, now + 0.1);
        osc2.frequency.linearRampToValueAtTime(40, now + 0.4);
        gain2.gain.setValueAtTime(0.2, now + 0.1);
        gain2.gain.linearRampToValueAtTime(0, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.4);
    },
    hit: () => playSound(400 + Math.random() * 100, 0.05, "sine", 0.05, 200),
    spawn: () => playSound(600, 0.2, "sine", 0.1, 1200),
};
