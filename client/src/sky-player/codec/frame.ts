import { AVCodecID } from "./codec-id";
import type { IFrame } from "./i-frame";

export class Frame implements IFrame {
  public pts: number;
  public codecId: AVCodecID;
  public width: number;
  public height: number;

  public bitrate: number;
  public sampleRate: number;
  public frameSize: number;

  public readonly buffers: Array<Uint8ClampedArray | Float32Array | Uint8Array>;

  public constructor(
    pts: number = 0,
    codecId: AVCodecID = AVCodecID.AV_CODEC_ID_NONE,
    width: number = 0,
    height: number = 0,
    bitrate: number = 0,
    sampleRate: number = 0,
    frameSize: number = 0
  ) {
    this.pts = pts;
    this.codecId = codecId;
    this.width = width;
    this.height = height;
    this.bitrate = bitrate;
    this.sampleRate = sampleRate;
    this.frameSize = frameSize;
    this.buffers = new Array<Uint8ClampedArray | Float32Array | Uint8Array>();
  }

  public addBuffer(buffer: Uint8ClampedArray | Float32Array | Uint8Array) {
    this.buffers.push(buffer);
  }
}
