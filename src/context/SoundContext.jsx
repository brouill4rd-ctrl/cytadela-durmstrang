import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [ambientTrack, setAmbientTrack] = useState('none'); // 'none' | 'wind' | 'hearth' | 'library'
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [audioCtx, setAudioCtx] = useState(null);

  const ambientNodesRef = useRef(null);

  useEffect(() => {
    // Lazy initialize AudioContext on user interaction
    const initAudio = () => {
      if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioCtx(ctx);
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, [audioCtx]);

  const ensureContext = () => {
    let ctx = audioCtx;
    if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  };

  // Ambient Sound Synthesizers (Wind, Hearth, Library)
  useEffect(() => {
    if (!soundEnabled || ambientTrack === 'none') {
      if (ambientNodesRef.current) {
        ambientNodesRef.current.cleanup();
        ambientNodesRef.current = null;
      }
      return;
    }

    const ctx = ensureContext();
    if (!ctx) return;

    if (ambientNodesRef.current) {
      ambientNodesRef.current.cleanup();
      ambientNodesRef.current = null;
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(ambientVolume * 0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);

    let activeInterval = null;

    if (ambientTrack === 'wind') {
      // Wind generator: pink noise filtered with an oscillating bandpass
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      // Modulate filter frequency for howling wind gusts
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(180, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      whiteNoise.connect(filter);
      filter.connect(masterGain);

      lfo.start();
      whiteNoise.start();

      ambientNodesRef.current = {
        cleanup: () => {
          try {
            lfo.stop();
            whiteNoise.stop();
            masterGain.disconnect();
          } catch (_) {}
        }
      };
    } else if (ambientTrack === 'hearth') {
      // Crackling fire generator: low rumble + random pops
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.04;
      }

      const rumble = ctx.createBufferSource();
      rumble.buffer = noiseBuffer;
      rumble.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(140, ctx.currentTime);

      rumble.connect(lowpass);
      lowpass.connect(masterGain);
      rumble.start();

      // Random crackles / pops
      activeInterval = setInterval(() => {
        if (!soundEnabled) return;
        const now = ctx.currentTime;
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(400 + Math.random() * 1200, now);
        popGain.gain.setValueAtTime(0.04 * (ambientVolume || 0.3), now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03 + Math.random() * 0.05);
        popOsc.connect(popGain);
        popGain.connect(ctx.destination);
        popOsc.start(now);
        popOsc.stop(now + 0.08);
      }, 350);

      ambientNodesRef.current = {
        cleanup: () => {
          if (activeInterval) clearInterval(activeInterval);
          try {
            rumble.stop();
            masterGain.disconnect();
          } catch (_) {}
        }
      };
    } else if (ambientTrack === 'library') {
      // Mystical library: deep resonant crystal drone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const droneGain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(164.81, ctx.currentTime); // E3

      droneGain.gain.setValueAtTime(0.03, ctx.currentTime);

      osc1.connect(droneGain);
      osc2.connect(droneGain);
      droneGain.connect(masterGain);

      osc1.start();
      osc2.start();

      ambientNodesRef.current = {
        cleanup: () => {
          try {
            osc1.stop();
            osc2.stop();
            masterGain.disconnect();
          } catch (_) {}
        }
      };
    }

    return () => {
      if (ambientNodesRef.current) {
        ambientNodesRef.current.cleanup();
        ambientNodesRef.current = null;
      }
    };
  }, [ambientTrack, soundEnabled, ambientVolume]);

  // 1. Subtle Nordic Rune Chime
  const playRuneChime = () => {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.8);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  };

  // 2. Sorting Ceremony Dramatic Reveal Fanfare
  const playSortingFanfare = () => {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [196, 261.63, 329.63, 392, 523.25]; // G3, C4, E4, G4, C5

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + index * 0.18;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.8);
    });
  };

  // 3. Wand Swoosh / Magic Cast
  const playWandSwoosh = () => {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.5);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  };

  // 4. Gold Coin / Transaction Clink
  const playCoinSound = () => {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [1567.98, 2093.00].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  };

  // 5. Wax Seal Breaking / Stamp Crack
  const playWaxCrack = () => {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  };

  // 6. Heavy Stone Gate Thud
  const playGateThud = () => {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  };

  // 7. Quill Writing Scratch (ASMR)
  const playQuillScratch = () => {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  };

  // 8. Potion Bubbling & Boiling
  const playPotionBubble = () => {
    if (!soundEnabled) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [400, 650, 520, 800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, start + 0.08);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.1);
    });
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        ambientTrack,
        setAmbientTrack,
        ambientVolume,
        setAmbientVolume,
        playRuneChime,
        playSortingFanfare,
        playWandSwoosh,
        playCoinSound,
        playWaxCrack,
        playGateThud,
        playQuillScratch,
        playPotionBubble
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);
