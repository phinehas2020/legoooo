
// Simple synthesizer for retro sound effects using Web Audio API
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playSound = (type: 'place' | 'delete' | 'click' | 'hover' | 'shutter' | 'explode') => {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    
    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'place') {
      // Satisfying low-pitch thunk (Square wave)
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (type === 'delete') {
      // Retro zap/laser (Sawtooth)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.2);
    } 
    else if (type === 'click') {
      // High-pitch UI blip (Sine)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      osc.start(now);
      osc.stop(now + 0.05);
    }
    else if (type === 'shutter') {
      // Camera Shutter (White noise burst simulation)
      // We simulate noise with high freq modulation
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.15);
    }
    else if (type === 'explode') {
      // Deep rumble
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 1.0);
      
      // Modulation for "roughness"
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 50;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 500;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + 1.5);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      
      osc.start(now);
      osc.stop(now + 1.5);
    }
  } catch (e) {
    // Ignore audio errors silently
    console.warn(e);
  }
};
