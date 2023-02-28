import { ThrowHelper } from "../exception/throw-helper";
import type { MemoryStream } from "./memory-stream";

export class BitReader {
  private _stream: MemoryStream;

  private _count: number;

  private _start: number;

  private _end: number;

  private _index: number;

  public constructor(stream: MemoryStream, start: number, count: number) {
    this._stream = stream;

    this._start = start;
    this._count = count;
    this._end = start + count;

    this._index = this._start;
  }

  public get isEnd(): boolean {
    return this._index >= this._end;
  }

  public peek(count: number): number {
    return this._stream.peek(count);
  }

  public read(count: number): number {
    const res = this.peek(count);
    this._index += count;
    return res;
  }

  public skip(count: number): void {
    this._stream.skip(count);
    this._index = Math.min(this._end, this._index + count);
  }

  public rewind(count: number): void {
    this._stream.rewind(count);
    this._index = Math.max(0, this._index - count);
  }

  public has(count: number): boolean {
    return this._end - this._index >= count;
  }

  public close(): void {
    this._stream.seek(this._end >> 3);
  }

  public createChild(count: number): BitReader {
    ThrowHelper.ThrowIf(count > this._end - this._index, `out of range`);
    return new BitReader(this._stream, this._index, count);
  }
}
