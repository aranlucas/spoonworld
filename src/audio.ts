const NOTES = [261.63, 293.66, 329.63, 392, 440, 493.88, 523.25];

export interface Sound {
  toggle(): Promise<boolean>;
  play(index?: number): void;
}

// No assets, network, or autoplay. A user gesture unlocks two soft notes.
export function createSound(): Sound {
  let context: AudioContext | undefined,
    enabled = false;

  return {
    async toggle() {
      enabled = !enabled;

      if (enabled) {
        if (!("AudioContext" in window)) {
          enabled = false;

          return false;
        }

        context ??= new AudioContext();
        await context.resume();
      }

      return enabled;
    },
    play(index = 0) {
      if (!enabled || !context) return;
      const now = context.currentTime;

      for (let i = 0; i < 2; i++) {
        const oscillator = context.createOscillator(),
          gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = NOTES[index % 7] * (i ? 1.5 : 1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.035, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      }
    },
  };
}
