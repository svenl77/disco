/**
 * Web Audio engine — drum / bass / lead / chord synthesis with shared FX bus.
 * Ported from the legacy single-file disco machine, lightly cleaned for TypeScript.
 */
import { freqOf } from './notes';
export class AudioEngine {
    ctx = null;
    master;
    filter;
    analyser;
    compressor;
    fxOut;
    revWet;
    delayWet;
    freqData;
    noiseBuffer;
    acidMode = false;
    async init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended')
                await this.ctx.resume();
            return;
        }
        const Ctor = window.AudioContext || window.webkitAudioContext;
        const c = new Ctor();
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
        if (c.state === 'suspended')
            await c.resume();
    }
    impulse(seconds, decay) {
        const c = this.ctx;
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
    makeNoise(seconds) {
        const c = this.ctx;
        const rate = c.sampleRate;
        const length = rate * seconds;
        const buf = c.createBuffer(1, length, rate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < length; i++)
            data[i] = Math.random() * 2 - 1;
        return buf;
    }
    noiseSrc() {
        const s = this.ctx.createBufferSource();
        s.buffer = this.noiseBuffer;
        return s;
    }
    setMaster(v) {
        this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
    setFilter(v) {
        this.filter.frequency.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
    setReverb(v) {
        this.revWet.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
    setDelay(v) {
        this.delayWet.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
    kick(t, vel = 1) {
        const c = this.ctx;
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
    snare(t, vel = 1) {
        const c = this.ctx;
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
    hihat(t, open = false, vel = 0.8) {
        const c = this.ctx;
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
    clap(t, vel = 1) {
        const c = this.ctx;
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
    cowbell(t, vel = 0.7) {
        const c = this.ctx;
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
    crash(t, vel = 0.9) {
        const c = this.ctx;
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
    bass(t, freq, dur = 0.18, vel = 0.7) {
        if (this.acidMode)
            return this.acidBass(t, freq, dur, vel * 1.2);
        const c = this.ctx;
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
    acidBass(t, freq, dur = 0.18, vel = 0.85) {
        const c = this.ctx;
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
    lead(t, freq, dur = 0.2, vel = 0.6) {
        const c = this.ctx;
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
    chord(t, freqs, dur = 1.4, vel = 0.45) {
        const c = this.ctx;
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
    drop() {
        const c = this.ctx;
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
    freqOf(n) {
        return freqOf(n);
    }
    getFreqData() {
        if (this.analyser)
            this.analyser.getByteFrequencyData(this.freqData);
        return this.freqData;
    }
}
