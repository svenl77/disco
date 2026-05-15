const STEPS = 16;
function emptyPatterns() {
    return {
        kick: Array(STEPS).fill(false),
        snare: Array(STEPS).fill(false),
        clap: Array(STEPS).fill(false),
        hatC: Array(STEPS).fill(false),
        hatO: Array(STEPS).fill(false),
        cowbell: Array(STEPS).fill(false),
        bass: Array(STEPS).fill(null),
        lead: Array(STEPS).fill(null),
    };
}
export class Sequencer {
    bpm = 120;
    isPlaying = false;
    currentStep = 0;
    patterns = emptyPatterns();
    onStep = null;
    audio;
    nextNoteTime = 0;
    lookahead = 25; // ms
    scheduleAheadTime = 0.12; // s
    timerId = null;
    constructor(audio) {
        this.audio = audio;
    }
    setBPM(v) {
        this.bpm = v;
        document.documentElement.style.setProperty('--beat-ms', `${60000 / v / 2}ms`);
    }
    start() {
        if (this.isPlaying || !this.audio.ctx)
            return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.audio.ctx.currentTime + 0.05;
        this.tick();
    }
    stop() {
        this.isPlaying = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
    toggle() {
        if (this.isPlaying)
            this.stop();
        else
            this.start();
    }
    load(preset) {
        const p = this.patterns;
        p.kick = preset.kick.slice();
        p.snare = preset.snare.slice();
        p.clap = preset.clap.slice();
        p.hatC = preset.hatC.slice();
        p.hatO = preset.hatO.slice();
        p.cowbell = preset.cowbell.slice();
        p.bass = preset.bass.slice();
        p.lead = preset.lead.slice();
    }
    clear() {
        this.patterns = emptyPatterns();
    }
    randomize() {
        const p = this.patterns;
        p.kick = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0].map(Boolean);
        p.snare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean);
        p.clap = [0, 0, 0, 0, Math.random() > 0.5 ? 1 : 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean);
        p.hatC = Array.from({ length: 16 }, (_, i) => Math.random() < (i % 2 ? 0.55 : 0.15));
        p.hatO = Array.from({ length: 16 }, () => Math.random() < 0.1);
        p.cowbell = Array.from({ length: 16 }, () => Math.random() < 0.12);
        const bassPool = ['C2', 'D#2', 'F2', 'G2', 'A#2', 'C3'];
        p.bass = Array.from({ length: 16 }, (_, i) => i % 4 === 0 || Math.random() < 0.35 ? bassPool[Math.floor(Math.random() * bassPool.length)] : null);
        const leadPool = ['C5', 'D#5', 'F5', 'G5', 'A#5'];
        p.lead = Array.from({ length: 16 }, () => Math.random() < 0.18 ? leadPool[Math.floor(Math.random() * leadPool.length)] : null);
    }
    tick() {
        if (!this.isPlaying || !this.audio.ctx)
            return;
        while (this.nextNoteTime < this.audio.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextNoteTime);
            this.nextNoteTime += this.stepDur();
            this.currentStep = (this.currentStep + 1) % STEPS;
        }
        this.timerId = setTimeout(() => this.tick(), this.lookahead);
    }
    scheduleStep(step, time) {
        const p = this.patterns;
        if (p.kick[step])
            this.audio.kick(time);
        if (p.snare[step])
            this.audio.snare(time);
        if (p.clap[step])
            this.audio.clap(time);
        if (p.hatC[step])
            this.audio.hihat(time, false);
        if (p.hatO[step])
            this.audio.hihat(time, true);
        if (p.cowbell[step])
            this.audio.cowbell(time);
        if (p.bass[step])
            this.audio.bass(time, this.audio.freqOf(p.bass[step]), this.stepDur() * 0.95);
        if (p.lead[step])
            this.audio.lead(time, this.audio.freqOf(p.lead[step]), this.stepDur() * 1.5);
        if (this.onStep)
            this.onStep(step, time);
    }
    stepDur() {
        return 60 / this.bpm / 4;
    }
}
