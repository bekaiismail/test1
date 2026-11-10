import type { ScareLevel, Settings, SfxId } from '../types'

/**
 * All sound is synthesised with the Web Audio API, so the game ships no audio
 * files and has no licensing or loading concerns. Nothing plays until
 * `unlock()` is called from a user gesture (browser autoplay rules).
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private musicGain!: GainNode
  private sfxGain!: GainNode
  private limiter!: DynamicsCompressorNode
  private musicTimer: number | null = null
  private musicNodes: OscillatorNode[] = []
  private settings: Settings | null = null

  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return
        this.ctx = new Ctor()
        // A limiter keeps every sound, scares included, under a safe ceiling.
        this.limiter = this.ctx.createDynamicsCompressor()
        this.limiter.threshold.value = -14
        this.limiter.ratio.value = 12
        this.master = this.ctx.createGain()
        this.musicGain = this.ctx.createGain()
        this.sfxGain = this.ctx.createGain()
        this.musicGain.connect(this.master)
        this.sfxGain.connect(this.master)
        this.master.connect(this.limiter)
        this.limiter.connect(this.ctx.destination)
        if (this.settings) this.apply(this.settings)
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
    } catch {
      this.ctx = null // No audio available; the game stays silent but playable.
    }
  }

  apply(settings: Settings): void {
    this.settings = settings
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.master.gain.setTargetAtTime(settings.muted ? 0 : settings.master, t, 0.03)
    this.musicGain.gain.setTargetAtTime(settings.music * 0.5, t, 0.03)
    this.sfxGain.gain.setTargetAtTime(settings.sfx, t, 0.03)
  }

  // ── building blocks ──────────────────────────────────────────────

  private tone(opts: {
    type?: OscillatorType
    from: number
    to?: number
    start?: number
    dur: number
    gain?: number
    attack?: number
  }): void {
    const ctx = this.ctx
    if (!ctx) return
    const t0 = ctx.currentTime + (opts.start ?? 0)
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = opts.type ?? 'sine'
    osc.frequency.setValueAtTime(opts.from, t0)
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t0 + opts.dur)
    const peak = opts.gain ?? 0.2
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(peak, t0 + (opts.attack ?? 0.01))
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur)
    osc.connect(g).connect(this.sfxGain)
    osc.start(t0)
    osc.stop(t0 + opts.dur + 0.05)
  }

  private noise(opts: { start?: number; dur: number; gain?: number; from: number; to?: number; q?: number; type?: BiquadFilterType }): void {
    const ctx = this.ctx
    if (!ctx) return
    const t0 = ctx.currentTime + (opts.start ?? 0)
    const length = Math.max(1, Math.floor(ctx.sampleRate * opts.dur))
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = opts.type ?? 'bandpass'
    filter.Q.value = opts.q ?? 1
    filter.frequency.setValueAtTime(opts.from, t0)
    if (opts.to) filter.frequency.exponentialRampToValueAtTime(opts.to, t0 + opts.dur)
    const g = ctx.createGain()
    const peak = opts.gain ?? 0.2
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur)
    src.connect(filter).connect(g).connect(this.sfxGain)
    src.start(t0)
  }

  // ── sound effects ────────────────────────────────────────────────

  play(id: SfxId, scare: ScareLevel = 'full'): void {
    if (!this.ctx) return
    switch (id) {
      case 'creak':
        this.tone({ type: 'sawtooth', from: 90, to: 240, dur: 0.7, gain: 0.07 })
        this.noise({ dur: 0.7, from: 500, to: 1800, q: 8, gain: 0.06 })
        break
      case 'blip':
        this.tone({ type: 'triangle', from: 520, to: 640, dur: 0.07, gain: 0.08 })
        break
      case 'click':
        this.tone({ type: 'square', from: 300, to: 180, dur: 0.05, gain: 0.06 })
        break
      case 'tick':
        this.tone({ type: 'square', from: 1200, dur: 0.03, gain: 0.05 })
        this.tone({ type: 'square', from: 900, dur: 0.03, gain: 0.05, start: 0.4 })
        break
      case 'quack':
        for (const s of [0, 0.22]) {
          this.tone({ type: 'sawtooth', from: 520, to: 260, dur: 0.16, gain: 0.14, start: s })
          this.noise({ dur: 0.14, from: 1400, to: 700, q: 4, gain: 0.07, start: s })
        }
        break
      case 'cluck':
        for (const s of [0, 0.1, 0.2, 0.36]) this.tone({ type: 'square', from: 700 + Math.random() * 300, to: 420, dur: 0.07, gain: 0.07, start: s })
        break
      case 'squawk':
        this.tone({ type: 'sawtooth', from: 900, to: 1500, dur: 0.12, gain: 0.1 })
        this.tone({ type: 'sawtooth', from: 1500, to: 700, dur: 0.2, gain: 0.1, start: 0.12 })
        break
      case 'laugh':
        for (let i = 0; i < 5; i++) this.tone({ type: 'triangle', from: 520 - i * 35, to: 400 - i * 30, dur: 0.1, gain: 0.1, start: i * 0.12 })
        break
      case 'sadTrombone':
        ;[311, 293, 277, 261].forEach((f, i) => this.tone({ type: 'sawtooth', from: f, to: f * 0.97, dur: i === 3 ? 0.7 : 0.3, gain: 0.08, start: i * 0.32 }))
        break
      case 'fanfare':
        ;[392, 523, 659, 784].forEach((f, i) => this.tone({ type: 'triangle', from: f, dur: i === 3 ? 0.4 : 0.14, gain: 0.1, start: i * 0.12 }))
        break
      case 'chime':
        ;[880, 1320, 1760].forEach((f, i) => this.tone({ type: 'sine', from: f, dur: 0.9, gain: 0.08, start: i * 0.09 }))
        break
      case 'pop':
        this.tone({ type: 'sine', from: 300, to: 900, dur: 0.09, gain: 0.16 })
        this.noise({ dur: 0.08, from: 2000, q: 1, gain: 0.08 })
        break
      case 'whoosh':
        this.noise({ dur: 0.6, from: 300, to: 2400, q: 1.5, gain: 0.1 })
        break
      case 'glitch':
        for (let i = 0; i < 8; i++) this.tone({ type: 'square', from: 100 + Math.random() * 1400, dur: 0.05, gain: 0.06, start: i * 0.06 })
        break
      case 'rumble':
        this.tone({ type: 'sine', from: 55, to: 40, dur: 1.6, gain: scare === 'off' ? 0.08 : 0.2, attack: 0.5 })
        this.noise({ dur: 1.6, from: 120, to: 80, q: 0.7, gain: scare === 'off' ? 0.03 : 0.08, type: 'lowpass' })
        break
      case 'boo':
        this.tone({ type: 'sine', from: 330, to: 220, dur: 0.3, gain: 0.1 })
        break
      case 'scare':
        if (scare === 'off') {
          this.play('boo')
          break
        }
        {
          const level = scare === 'mild' ? 0.35 : 1
          this.noise({ dur: 0.7, from: 900, to: 3200, q: 0.8, gain: 0.3 * level })
          this.tone({ type: 'sawtooth', from: 180, to: 95, dur: 0.8, gain: 0.22 * level })
          this.tone({ type: 'sawtooth', from: 254, to: 131, dur: 0.8, gain: 0.18 * level })
          this.tone({ type: 'square', from: 1244, to: 620, dur: 0.5, gain: 0.07 * level })
        }
        break
    }
  }

  // ── music: a slow, slightly wrong hotel-lobby waltz ──────────────

  startMusic(): void {
    const ctx = this.ctx
    if (!ctx || this.musicTimer !== null) return
    // Low drone.
    for (const [freq, detune] of [
      [55, 0],
      [82.4, 4],
    ] as const) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.detune.value = detune
      g.gain.value = 0.12
      osc.connect(g).connect(this.musicGain)
      osc.start()
      this.musicNodes.push(osc)
    }
    // Sparse music-box notes in A minor with one deliberately sour note.
    const scale = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 311.1]
    let step = 0
    const tick = () => {
      if (!this.ctx) return
      if (step % 2 === 0 || Math.random() < 0.35) {
        const freq = scale[Math.floor(Math.random() * (Math.random() < 0.08 ? scale.length : scale.length - 1))]
        const t0 = this.ctx.currentTime
        const osc = this.ctx.createOscillator()
        const g = this.ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = freq * (step % 6 === 0 ? 0.5 : 1)
        g.gain.setValueAtTime(0.0001, t0)
        g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8)
        osc.connect(g).connect(this.musicGain)
        osc.start(t0)
        osc.stop(t0 + 1.9)
      }
      step++
    }
    this.musicTimer = window.setInterval(tick, 620)
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer)
    this.musicTimer = null
    for (const osc of this.musicNodes) {
      try {
        osc.stop()
      } catch {
        // already stopped
      }
    }
    this.musicNodes = []
  }
}

export const audio = new AudioEngine()
