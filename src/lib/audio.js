/**
 * Synthesizes a clean double-note chime (C5 -> E5) using the Web Audio API.
 * This runs completely client-side and requires no static asset files to download.
 */
export const playSuccessChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Use standard sine wave for a smooth bell/chime tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Gentle volume spike then exponential fade out
      gainNode.gain.setValueAtTime(0.12, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    const now = ctx.currentTime;
    // Note 1: C5 (523.25 Hz)
    playNote(523.25, now, 0.14);
    // Note 2: E5 (659.25 Hz) with 70ms offset for an upward double-chime effect
    playNote(659.25, now + 0.07, 0.25);
  } catch (err) {
    console.warn('Audio feedback failed to play:', err);
  }
};
