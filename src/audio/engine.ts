/**
 * Web Audio engine — drum / bass / lead / chord synthesis with shared FX bus.
 * Ported from the legacy single-file disco machine, lightly cleaned for TypeScript.
 */
import { freqOf } from './notes';

type Ctx = AudioContext;

export class AudioEngine {
  ctx: Ctx | null = null;
  master!: GainNode;
  filter!: BiquadFilterNode;
  analyser!: AnalyserNode;

  private compressor!: DynamicsCompressorNode;
  private fxOut!: GainNode;
  private revWet!: GainNode;
  private delayWet!: GainNode;
  private freqData!: Uint8Array<ArrayBuffer>;
  private noiseBuffer!: AudioBuffer;

  acidMode = false;

  async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    const c: Ctx = new Ctor();
    this.ctx = c;

    this.master = c.createGain();
    this.master.gain.value = 0.75;

    this.compressor = c.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.12;

    this.filter = c.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 8000;
    this.filter.Q.value = 0.7;

    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;
    this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

    this.fxOut = c.createGain();
    this.fxOut.connect(this.filter);

    // Tape delay
    const delay = c.createDelay(2);
    delay.delayTime.value = 0.375;
    const delayFb = c.createGain();
    delayFb.gain.value = 0.42;
    const delayWet = c.createGain();
    delayWet.gain.value = 0.18;
    const delayLp = c.createBiquadFilter();
    delayLp.type = 'lowpass';
    delayLp.frequency.value = 3200;
    this.fxOut.connect(delay);
    delay.connect(delayLp);
    delayLp.connect(delayFb);
    delayFb.connect(delay);
    delayLp.connect(delayWet);
    delayWet.connect(this.filter);
    this.delayWet = delayWet;

    // Convolver reverb
    const conv = c.createConvolver();
    conv.buffer = this.impulse(2.4, 2.5);
    const revWet = c.createGain();
    revWet.gain.value = 0.22;
    this.fxOut.connect(conv);
    conv.connect(revWet);
    revWet.connect(this.filter);
    this.revWet = revWet;

    this.filter.connect(this.compressor);
    this.compressor.connect(this.master);
    this.master.connect(this.analyser);
    this.analyser.connect(c.destination);

    this.noiseBuffer = this.makeNoise(2);

    if (c.state === 'suspended') await c.resume();
  }

  private impulse(seconds: number, decay: number): AudioBuffer {
    const c = this.ctx!;
    const rate = c.sampleRate;
    const length = rate * seconds;
    const buf = c.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buf;
  }

  private makeNoise(seconds: number): AudioBuffer {
    const c = this.ctx!;
    const rate = c.sampleRate;
    const length = rate * seconds;
    const buf = c.createBuffer(1, length, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private noiseSrc(): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noiseBuffer;
    return s;
  }

  setMaster(v: number): void {
    this.master.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.02);
  }
  setFilter(v: number): void {
    this.filter.frequency.setTargetAtTime(v, this.ctx!.currentTime, 0.02);
  }
  setReverb(v: number): void {
    this.revWet.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.02);
  }
  setDelay(v: number): void {
    this.delayWet.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.02);
  }

  kick(t: number, vel = 1): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = 'sine';
    const g = c.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.95 * vel, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g).connect(this.fxOut);
    o.start(t);
    o.stop(t + 0.5);
    const n = this.noiseSrc();
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1500;
    const cg = c.createGain();
    cg.gain.setValueAtTime(0.45 * vel, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    n.connect(hp).connect(cg).connect(this.fxOut);
    n.start(t, Math.random() * 1.5);
    n.stop(t + 0.05);
  }

  snare(t: number, vel = 1): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = 'triangle';
    const og = c.createGain();
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(130, t + 0.1);
    og.gain.setValueAtTime(0.6 * vel, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(og).connect(this.fxOut);
    o.start(t);
    o.stop(t + 0.15);
    const n = this.noiseSrc();
    const nf = c.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = 1200;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.55 * vel, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    n.connect(nf).connect(ng).connect(this.fxOut);
    n.start(t, Math.random() * 1.5);
    n.stop(t + 0.2);
  }

  hihat(t: number, open = false, vel = 0.8): void {
    const c = this.ctx!;
    const n = this.noiseSrc();
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 10000;
    bp.Q.value = 0.7;
    const g = c.createGain();
    const decay = open ? 0.32 : 0.05;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3 * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    n.connect(hp).connect(bp).connect(g).connect(this.fxOut);
    n.start(t, Math.random() * 1.5);
    n.stop(t + decay + 0.05);
  }

  clap(t: number, vel = 1): void {
    const c = this.ctx!;
    for (const off of [0, 0.012, 0.024, 0.05]) {
      const n = this.noiseSrc();
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1500;
      f.Q.value = 0.9;
      const g = c.createGain();
      const isLast = off === 0.05;
      g.gain.setValueAtTime(0, t + off);
      g.gain.linearRampToValueAtTime((isLast ? 0.55 : 0.4) * vel, t + off + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + off + (isLast ? 0.25 : 0.04));
      n.connect(f).connect(g).connect(this.fxOut);
      n.start(t + off, Math.random() * 1.5);
      n.stop(t + off + (isLast ? 0.3 : 0.06));
    }
  }

  cowbell(t: number, vel = 0.7): void {
    const c = this.ctx!;
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    o1.type = 'square';
    o1.frequency.value = 800;
    o2.type = 'square';
    o2.frequency.value = 540;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 1.5;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.32 * vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o1.connect(bp);
    o2.connect(bp);
    bp.connect(g).connect(this.fxOut);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.4);
    o2.stop(t + 0.4);
  }

  crash(t: number, vel = 0.9): void {
    const c = this.ctx!;
    const n = this.noiseSrc();
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 4000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.45 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    n.connect(hp).connect(g).connect(this.fxOut);
    n.start(t, Math.random() * 1.5);
    n.stop(t + 1.6);
  }

  bass(t: number, freq: number, dur = 0.18, vel = 0.7): void {
    if (this.acidMode) return this.acidBass(t, freq, dur, vel * 1.2);
    const c = this.ctx!;
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.value = freq;
    o2.type = 'square';
    o2.frequency.value = freq * 0.5;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 4;
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(220, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.55 * vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(g).connect(this.fxOut);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }

  private acidBass(t: number, freq: number, dur = 0.18, vel = 0.85): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 16;
    lp.frequency.setValueAtTime(180, t);
    lp.frequency.exponentialRampToValueAtTime(2200, t + 0.02);
    lp.frequency.exponentialRampToValueAtTime(220, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.6 * vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(lp).connect(g).connect(this.fxOut);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  lead(t: number, freq: number, dur = 0.2, vel = 0.6): void {
    const c = this.ctx!;
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.value = freq;
    o2.type = 'square';
    o2.frequency.value = freq * 1.005;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4200;
    lp.Q.value = 1.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.32 * vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(g).connect(this.fxOut);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }

  chord(t: number, freqs: number[], dur = 1.4, vel = 0.45): void {
    const c = this.ctx!;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3400;
    lp.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.08);
    g.gain.linearRampToValueAtTime(vel * 0.6, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    lp.connect(g).connect(this.fxOut);
    for (const f of freqs) {
      for (const det of [-9, 0, 9]) {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.1);
      }
    }
  }

  /** Pepe — rapid "kekekek" stutter via gated square pulses */
  pepeKek(t?: number): void {
    const c = this.ctx!;
    const start = t ?? c.currentTime;
    for (let i = 0; i < 6; i++) {
      const o = c.createOscillator();
      o.type = 'square';
      o.frequency.value = 380 + i * 30;
      const g = c.createGain();
      const at = start + i * 0.08;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.35, at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 200;
      o.connect(hp).connect(g).connect(this.fxOut);
      o.start(at);
      o.stop(at + 0.06);
    }
  }

  /** Maus — thoughtful jazzy 3-note piano arpeggio (Cmaj7 vibe) */
  mausPiano(t?: number): void {
    const c = this.ctx!;
    const start = t ?? c.currentTime;
    const notes = [261.63, 329.63, 392.0, 493.88]; // C4 E4 G4 B4
    notes.forEach((freq, i) => {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      const o2 = c.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = freq * 2;
      const g = c.createGain();
      const at = start + i * 0.09;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.22, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.4);
      o.connect(g);
      const g2 = c.createGain();
      g2.gain.value = 0.05;
      o2.connect(g2).connect(g);
      g.connect(this.fxOut);
      o.start(at);
      o2.start(at);
      o.stop(at + 0.45);
      o2.stop(at + 0.45);
    });
  }

  /** Burns — crisp glass clink (high sine + brief noise) */
  burnsClink(t?: number): void {
    const c = this.ctx!;
    const start = t ?? c.currentTime;
    // Crystal ping
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(2400, start);
    o.frequency.exponentialRampToValueAtTime(1800, start + 0.18);
    const g = c.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.35, start + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    o.connect(g).connect(this.fxOut);
    o.start(start);
    o.stop(start + 0.4);
    // Tiny shimmer noise
    const n = this.noiseSrc();
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 6000;
    bp.Q.value = 3;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.2, start);
    ng.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
    n.connect(bp).connect(ng).connect(this.fxOut);
    n.start(start, 0);
    n.stop(start + 0.2);
  }

  /** Landwulf — filtered noise sweep from low to high, like a wolf howl */
  landwulfHowl(t?: number): void {
    const c = this.ctx!;
    const start = t ?? c.currentTime;
    // Pitched howl via sine + heavy filter sweep
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, start);
    o.frequency.exponentialRampToValueAtTime(420, start + 0.4);
    o.frequency.exponentialRampToValueAtTime(280, start + 0.9);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 8;
    lp.frequency.setValueAtTime(600, start);
    lp.frequency.exponentialRampToValueAtTime(3000, start + 0.4);
    lp.frequency.exponentialRampToValueAtTime(1200, start + 0.9);
    const g = c.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.32, start + 0.06);
    g.gain.linearRampToValueAtTime(0.28, start + 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.95);
    o.connect(lp).connect(g).connect(this.fxOut);
    o.start(start);
    o.stop(start + 1);
    // Air noise overlay
    const n = this.noiseSrc();
    const nf = c.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 1200;
    nf.Q.value = 2;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.05, start);
    ng.gain.linearRampToValueAtTime(0.10, start + 0.5);
    ng.gain.exponentialRampToValueAtTime(0.001, start + 0.95);
    n.connect(nf).connect(ng).connect(this.fxOut);
    n.start(start, 0);
    n.stop(start + 1);
  }

  drop(): number {
    const c = this.ctx!;
    const start = c.currentTime;
    this.filter.frequency.cancelScheduledValues(start);
    this.filter.frequency.setValueAtTime(700, start);
    this.filter.frequency.exponentialRampToValueAtTime(12000, start + 1.6);
    const n = this.noiseSrc();
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 4;
    bp.frequency.setValueAtTime(400, start);
    bp.frequency.exponentialRampToValueAtTime(12000, start + 1.6);
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.01, start);
    ng.gain.exponentialRampToValueAtTime(0.55, start + 1.6);
    n.connect(bp).connect(ng).connect(this.fxOut);
    n.start(start, 0);
    n.stop(start + 1.65);
    this.crash(start + 1.6, 1);
    this.kick(start + 1.6, 1);
    return start + 1.6;
  }

  freqOf(n: string): number {
    return freqOf(n);
  }
  getFreqData(): Uint8Array<ArrayBuffer> {
    if (this.analyser) this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }
}
