export class Packet {
  public pts: number = NaN;
  public buffers: Array<Uint8Array> = new Array<Uint8Array>();
}
