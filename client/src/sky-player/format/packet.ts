export class Packet {
  public pts: number;
  public buffers: Array<Uint8Array>;

  public constructor(
    pts: number = NaN, 
    buffers: Array<Uint8Array> = new Array<Uint8Array>
  ) {
    this.pts = pts;
    this.buffers = buffers;
  }
}
