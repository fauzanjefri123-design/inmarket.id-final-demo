/**
 * Web Audio API synthesizer for clean, natural, and warm UI sounds.
 * Avoids raw buzzing waveforms, harsh digital high-ends, or computer-generated robotic clicks.
 * Outfitted with soft envelope transients and warm analog-style lowpass filtering.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch((e) => console.warn('AudioContext resume failed:', e));
  }
  return audioCtx;
}

// 1. Success chime (Warm, elegant acoustic-like chime)
export function playSuccessSound() {
  if (localStorage.getItem('inmarket_sound_enabled') === 'false') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.3);

    // Warm, quiet, and gradual attack/decay to eliminate clicking/harsh transience
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05); // soft transient envelope
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  } catch (e) {
    console.warn('Web Audio check: user interaction required first', e);
  }
}

// 2. Beautiful scanning sound (Warm, breathy scan sweeps)
export function playScanSound() {
  if (localStorage.getItem('inmarket_sound_enabled') === 'false') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.51);
  } catch (e) {
    console.warn(e);
  }
}

// 3. Cash register "cha-ching" sound (Warm organic woodblock and cozy silver chimes)
export function playCashRegisterSound() {
  if (localStorage.getItem('inmarket_sound_enabled') === 'false') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Harmonic 1: Soft organic woodblock tap
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(900, now);
    osc1.frequency.exponentialRampToValueAtTime(450, now + 0.15);
    
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(700, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.05, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    gain1.gain.linearRampToValueAtTime(0, now + 0.25);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.26);

    // Harmonic 2: Warm high sweet-chime (offset for depth)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now + 0.06);

    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(1100, now);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.04, now + 0.08); // soft human attack
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    gain2.gain.linearRampToValueAtTime(0, now + 0.4);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.41);
  } catch (e) {
    console.warn(e);
  }
}

// 4. Achievement salary alert (Warm analog acoustic music box)
export function playSalaryRewardSound() {
  if (localStorage.getItem('inmarket_sound_enabled') === 'false') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    // Peaceful C Major Pentatonic Cascade: C4, E4, G4, A4, C5, E5, G5
    const notes = [261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const noteTime = now + (idx * 0.09) + 0.02;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, noteTime); // heavy filtering for extreme softness

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, noteTime + 0.03); // whisper-soft envelope
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);
      gain.gain.linearRampToValueAtTime(0, noteTime + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.51);
    });
  } catch (e) {
    console.warn(e);
  }
}

// 5. Short intimate tap (Dry woody/physical click, not an electronic beep)
export function playClickSound() {
  if (localStorage.getItem('inmarket_sound_enabled') === 'false') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    // Deep real-world wood click simulation
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.05);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    gain.gain.linearRampToValueAtTime(0, now + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // Silent
  }
}

// 6. Holographic notification chime (Extremely gentle, tranquil bells)
export function playNotificationSound() {
  if (localStorage.getItem('inmarket_sound_enabled') === 'false') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Cozy ambient bell triad (C5, E5, G5)
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const t = now + (i * 0.08) + 0.02;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.03, t + 0.02); // soft transient
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.31);
    });
  } catch (e) {
    // Silent
  }
}

// 7. Ambient Grass Meadow Wind & Cozy Drone (100% Organic feel background atmosphere)
let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let ambientInterval: any = null;

export function startFuturisticAmbience() {
}

export function stopFuturisticAmbience() {
}

// 8. Open Store (Gentle upward acoustic scale)
export function playOpenStoreSound() {
  if (localStorage.getItem('inmarket_sound_enabled') === 'false') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Peaceful sweep: C4, E4, G4, C5
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const noteTime = now + (idx * 0.1) + 0.02;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, noteTime);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, noteTime + 0.05); // soft warm decay
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);
      gain.gain.linearRampToValueAtTime(0, noteTime + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.46);
    });
  } catch (e) {
    console.warn(e);
  }
}

// 9. Close Store (Warm physical slide-down, completely replacing mechanical sawtooth sweeps)
export function playCloseStoreSound() {
  if (localStorage.getItem('inmarket_sound_enabled') === 'false') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine'; // Sine instead of raw buzzing mechanical sawtooth
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    gain.gain.linearRampToValueAtTime(0, now + 0.55);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now); // Heavy lowpass for warm analog tape feel

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.56);
  } catch (e) {
    console.warn(e);
  }
}
