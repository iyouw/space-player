import { AVCodecID } from "./codec-id";
import type { IFrame } from "./i-frame";

export class Frame implements IFrame {
  public pts: number;
  public codecId: AVCodecID;
  public width: number;
  public height: number;

  public readonly buffers: Array<Uint8ClampedArray>;

  public constructor(
    pts: number = 0,
    codecId: AVCodecID = AVCodecID.AV_CODEC_ID_NONE,
    width: number = 0,
    height: number = 0
  ) {
    this.pts = pts;
    this.codecId = codecId;
    this.width = width;
    this.height = height;
    this.buffers = new Array<Uint8ClampedArray>();
  }

  public addBuffer(buffer: Uint8ClampedArray) {
    this.buffers.push(buffer);
  }
}
