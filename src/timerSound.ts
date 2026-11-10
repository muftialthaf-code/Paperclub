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
/** One short, locally generated buzzer per timer deadline. */
export function playTimerBuzzer(key: string, enabled: boolean) {
  if (!enabled || played.has(key)) return;
  played.add(key);
  if (played.size > 200) played.delete(played.values().next().value!);
  try {
    if (!audio || audio.state === 'closed' || audio.state === 'suspended') return;
    const tone = audio.createOscillator();
    const gain = audio.createGain();
    tone.type = 'sawtooth';
    tone.frequency.value = 220;
    tone.connect(gain);gain.connect(audio.destination);
    gain.gain.setValueAtTime(0.001,audio.currentTime);
    gain.gain.linearRampToValueAtTime(0.08,audio.currentTime+0.02);
    gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+0.45);
    tone.start();tone.stop(audio.currentTime+0.46);
  } catch { /* Missing audio must never interrupt play or scoring. */ }
}
