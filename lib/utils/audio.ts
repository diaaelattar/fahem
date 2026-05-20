/**
 * Synthesizes educational sound effects locally using Web Audio API.
 * 100% free, lightweight, client-side, offline-friendly.
 */
export const playSound = (type: 'correct' | 'incorrect' | 'victory' | 'defeat') => {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'correct') {
      // Sound: A bright, cheerful arpeggio (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } else if (type === 'incorrect') {
      // Sound: A low, buzzy disappointed tone (downward pitch glide)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'victory') {
      // Sound: A triumphant fanfare
      const now = ctx.currentTime;
      const fanfare = [
        { freq: 523.25, time: 0, duration: 0.15 }, // C5
        { freq: 523.25, time: 0.15, duration: 0.15 }, // C5
        { freq: 523.25, time: 0.3, duration: 0.15 }, // C5
        { freq: 659.25, time: 0.45, duration: 0.3 }, // E5
        { freq: 783.99, time: 0.75, duration: 0.6 }  // G5
      ];
      fanfare.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.12, now + n.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.duration);
      });
    } else if (type === 'defeat') {
      // Sound: Disappointed falling tone
      const now = ctx.currentTime;
      const notes = [
        { freq: 293.66, time: 0, duration: 0.3 }, // D4
        { freq: 277.18, time: 0.25, duration: 0.3 }, // C#4
        { freq: 261.63, time: 0.5, duration: 0.6 } // C4
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.freq, now + n.time);
        osc.frequency.linearRampToValueAtTime(n.freq - 30, now + n.time + n.duration);

        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.08, now + n.time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.duration);
      });
    }
  } catch (err) {
    console.error('Audio synthesis failed:', err);
  }
};
