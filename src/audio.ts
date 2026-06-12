/**
 * Dynamic Chess Sound Synthesizer using Web Audio API
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5; // Default 50%

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    // Expecting 0 to 100
    this.volume = Math.max(0, Math.min(100, vol)) / 100;
  }

  playMove() {
    this.initCtx();
    if (!this.ctx || this.volume === 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Warm, woody percussive sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.11);
  }

  playCapture() {
    this.initCtx();
    if (!this.ctx || this.volume === 0) return;

    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(this.ctx.destination);

    // Dynamic metallic wood chop
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    noise.type = 'triangle';
    noise.frequency.setValueAtTime(240, this.ctx.currentTime);
    noise.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.start();
    noise.start();
    osc.stop(this.ctx.currentTime + 0.16);
    noise.stop(this.ctx.currentTime + 0.16);
  }

  playCheck() {
    this.initCtx();
    if (!this.ctx || this.volume === 0) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    // Discordant double-tone check alarm
    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(445, this.ctx.currentTime);

    gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.26);
    osc2.stop(this.ctx.currentTime + 0.26);
  }

  playCheckmate() {
    this.initCtx();
    if (!this.ctx || this.volume === 0) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    // Deep harmonic triumphal sweep
    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.6);
    osc2.frequency.setValueAtTime(165, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(330, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.8);
    osc2.stop(this.ctx.currentTime + 0.8);
  }

  playCastling() {
    this.initCtx();
    if (!this.ctx || this.volume === 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Two rapid swooshy clicks
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.setValueAtTime(140, this.ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playPromotion() {
    this.initCtx();
    if (!this.ctx || this.volume === 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Shimmering ascending chime sweep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.46);
  }
}

export const soundManager = new SoundSynthesizer();
