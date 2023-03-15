import type { AVCodecID } from "../codec/codec-id";
import { Counter } from "../counter/counter";

export class Packet {
  public readonly codecId: AVCodecID;

  public pts: number;

  public readonly buffers: Array<Uint8Array>;

  public readonly counter: Counter;

  public constructor(
    codecId: AVCodecID,
    pts: number = 0,
    buffers: Array<Uint8Array> = new Array<Uint8Array>()
  ) {
    this.codecId = codecId;
    this.pts = pts;
    this.buffers = buffers;
    this.counter = new Counter();
  }

  public get isCompleted(): boolean {
    return this.counter.isMax;
  }

  public addBuffer(buffer: Uint8Array): void {
    this.buffers.push(buffer);
  }
}
