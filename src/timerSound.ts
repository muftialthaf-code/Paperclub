let audio: AudioContext | null = null;
const played = new Set<string>();
/** Called inside a user gesture so mobile browsers can authorise sound. */
export function prepareTimerSound() {
  try {
    const ctor = window.AudioContext || (window as Window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!ctor) return;
    if (!audio || audio.state === 'closed') audio = new ctor();
    void audio.resume().catch(() => {});
  } catch { /* Timer visuals continue when audio is unavailable. */ }
}
/** A sustained arena-style horn, generated locally once per timer deadline. */
export function playTimerBuzzer(key: string, enabled: boolean) {
  if (!enabled || played.has(key)) return;
  played.add(key);
  if (played.size > 200) played.delete(played.values().next().value!);
  try {
    if (!audio || audio.state === 'closed' || audio.state === 'suspended') return;
    const tone = audio.createOscillator();
    const gain = audio.createGain();
    // Two square-wave partial families (120/180 Hz) share one 60 Hz
    // periodic source: a rough scoreboard horn rather than a musical chime.
    if (typeof audio.createPeriodicWave === 'function') {
      const real = new Float32Array(64);
      const imaginary = new Float32Array(64);
      for (const multiple of [2,3]) {
        for (let harmonic=1; multiple*harmonic<64; harmonic+=2) {
          imaginary[multiple*harmonic] += 1/harmonic;
        }
      }
      tone.setPeriodicWave(audio.createPeriodicWave(real,imaginary));
      tone.frequency.value = 60;
    } else {
      tone.type = 'square';
      tone.frequency.value = 150;
    }
    tone.connect(gain);gain.connect(audio.destination);
    const start = audio.currentTime;
    // Strong attack and a full-volume hold, with a short tail to avoid clicks.
    // Normalised waveform and gain headroom keep the signal below clipping.
    gain.gain.setValueAtTime(0.001,start);
    gain.gain.linearRampToValueAtTime(0.38,start+0.012);
    gain.gain.setValueAtTime(0.38,start+1.15);
    gain.gain.exponentialRampToValueAtTime(0.001,start+1.27);
    tone.start();tone.stop(start+1.28);
  } catch { /* Missing audio must never interrupt play or scoring. */ }
}
