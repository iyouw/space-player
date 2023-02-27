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
    let res = 0;
    while (count > 0) {
      const val = this._stream.get(this._index >> 3);
      const remaing = 8 - (this._index & 7);
      const read = remaing < count ? remaing : count;
      const shift = remaing - read;
      const mask = 0xff >> (8 - read);

      res = (res << read) | (val & (mask << shift) >> shift);
      this._index += read;
      count -= read; 
    }
    return res;
  }

  public read(count: number): number {
    const res = this.peek(count);
    this._index += count;
    return res;
  }

  public skip(count: number): void {
    this._index = Math.min(this._end, this._index + count);
  }

  public rewind(count: number): void {
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
    const start = this._index;
    return new BitReader(this._stream, start, count);
  }
}