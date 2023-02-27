import { ThrowHelper } from "@/player/abstraction";
import type { BitBuffer } from "./bit-buffer";

export class Scope {
  private _buffer: BitBuffer;

  private _count: number;
  private _start: number;
  private _end: number;

  public constructor(buffer: BitBuffer, count: number, start: number) {
    this._buffer = buffer;
    this._count = count;
    this._start = start;
    this._end = start + count;
  }

  public get start(): number {
    return this._start;
  }

  public get end(): number {
    return this._end;
  }

  public get index(): number {
    return this._buffer.index;
  }

  public close(): void {
    this._buffer.index = this._end;
  }

  public read(count: number): number {
    return this._buffer.read(count);
  }

  public skip(count: number): void {
    this._buffer.skip(count);
  }

  public rewind(count: number): void {
    this._buffer.rewind(count);
  }

  public beginScope(count: number): Scope {
    const start = this._buffer.index;
    const end = start + count;
    ThrowHelper.ThrowIf(
      end > this.end,
      `out of scope, parent:[${this._start}, ${this._end}], child:[${start}, ${end}]`
    );
    return new Scope(this._buffer, count, this._buffer.index);
  }

  public isOutScope(): boolean {
    return this._buffer.index <= this._start || this._buffer.index >= this._end;
  }
}
