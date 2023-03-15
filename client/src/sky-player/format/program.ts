import type { Stream } from "./stream";

export abstract class Program {
  public id: number;
  public number: number;
  public streams: Array<Stream>;

  public constructor(id: number = NaN, number: number = NaN) {
    this.id = id;
    this.number = number;
    this.streams = new Array<Stream>();
  }

  public addStream(stream: Stream): void {
    if (this.streams.some((x) => x.id === stream.id)) return;
    this.streams.push(stream);
  }

  public abstract get isCompleted(): boolean;
}
