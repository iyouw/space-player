export class WebAudio {
  private static CachedContext: AudioContext | undefined = undefined;

  public static NeedsUnlocking(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  public static IsSupported(): boolean {
    return !!window.AudioContext;
  }

  private _context: AudioContext;

  private _gain: GainNode;

  private _destination: GainNode;

  private _startTime: number;
  private _buffer: Float32Array | null;
  private _wallclockStartTime: number;
  private _volume: number;
  private _enabled: boolean;

  private _unlocked: boolean;

  public constructor() {
    this._context = new window.AudioContext();
    this._gain = this._context.createGain();
    this._destination = this._gain;
    // keep track ofthe number of connections to this audio context, so we
    // can safely close() it when we are the only one connected to it.
    this._gain.connect(this._destination);

    this._startTime = 0;
    this._buffer = null;
    this._wallclockStartTime = 0;
    this._volume = 1;
    this._enabled = true;

    this._unlocked = !WebAudio.NeedsUnlocking();
  }

  public destroy(): void {
    this._gain.disconnect();
    this._context.close();
    WebAudio.CachedContext = undefined;
  }

  public play(
    sampleRate: number,
    left: Float32Array,
    right: Float32Array
  ): void {
    if (!this._enabled) return;
    // if the context is not unlocked yet, we simply advance the start time to fake actually playing audio.
    // this will keep the video in sync.
    if (!this._unlocked) {
      const ts = self.performance.now();
      if (this._wallclockStartTime < ts) {
        this._wallclockStartTime = ts;
      }
      this._wallclockStartTime += left.length / sampleRate;
      return;
    }

    this._gain.gain.value = this._volume;
    const buffer = this._context.createBuffer(2, left.length, sampleRate);
    buffer.getChannelData(0).set(left);
    buffer.getChannelData(1).set(right);
    const source = this._context.createBufferSource();
    source.buffer = buffer;
    source.connect(this._destination);

    const now = this._context.currentTime;
    const duration = buffer.duration;
    if (this._startTime < now) {
      this._startTime = now;
      this._wallclockStartTime = self.performance.now();
    }
    source.start(this._startTime);
    this._startTime += duration;
    this._wallclockStartTime += duration;
  }

  public stop(): void {
    this._gain.gain.value = 0;
  }
}
