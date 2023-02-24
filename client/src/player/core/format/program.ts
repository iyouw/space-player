import type { IProgram, IStream } from "@/player/abstraction";
import { OrderMap } from "../map/order-map";

export class Program implements IProgram {
  private _id: number;
  private _streams: OrderMap<IStream, number>;

  public constructor(id: number) {
    this._id = id;
    this._streams = new OrderMap<IStream, number>();
  }

  public get id(): number {
    return this._id;
  }

  public get streams(): Array<IStream> {
    return this._streams.values();
  }

  public get hasStream(): boolean {
    return this._streams.length > 0;
  }

  public has(streamPID: number): boolean {
    return this._streams.has(streamPID);
  }

  public addStream(stream: IStream, key: number): void {
    this._streams.set(key, stream);
  }
}
