import type { Counter } from "../counter/counter";
import { OutRangeExcenption } from "../exception/out-range-exception";
import type { MemoryStream } from "./memory-stream";

export class BitReader {
  private _stream: MemoryStream;

  private _count: number;

  private _start: number;

  private _end: number;

  private _index: number;

  private _counter?: Counter;

  public constructor(stream: MemoryStream, count: number) {
    this._stream = stream;

    this._start = this._stream.index << 3;
    this._count = count;
    this._end = this._start + this._count;

    this._index = this._start;
  }

  public get isEnd(): boolean {
    return this._index >= this._end;
  }

  public get index(): number {
    return this._index;
  }

  public attachCounter(counter: Counter): void {
    this._counter = counter;
  }

  public peek(count: number): number {
    const index = this._index + count;
    this.checkRange(index);
    let res = 0;
    let offset = this._index;
    while (count) {
      const num = this._stream.get(offset >> 3);
      const remaining = 8 - (offset & 7);
      const read = remaining < count ? remaining : count;
      const shift = remaining - read;
      const mask = 0xff >> (8 - read);

      res = (res << read) | ((num & (mask << shift)) >> shift);
      offset += read;
      count -= read;
    }
    return res;
  }

  public read(count: number): number {
    const res = this.peek(count);
    this._index += count;
    this._counter?.count(count);
    return res;
  }

  public skip(count: number): void {
    const index = this._index + count;
    this.checkRange(index);
    this._index = index;
    this._counter?.count(count);
  }

  public skipTo(index: number): void {
    this.checkRange(index);
    this._index = index;
  }

  public rewind(count: number): void {
    const index = this._index - count;
    this.checkRange(index);
    this._index = index;
    this._counter?.count(-count);
  }

  public has(count: number): boolean {
    return this._end - this._index >= count;
  }

  public readBuffer(start?: number, end?: number): Uint8Array {
    start ??= this._index;
    end ??= this._end;
    this.checkRange(start);
    this.checkRange(end);
    const res = this._stream.slice(start >> 3, end >> 3);
    this._counter?.count(end - start);
    return res;
  }

  public findStartCode(code: number): number {
    let current = 0;
    while (true) {
      current = this.findNextStartCode();
      if (current === code || current === -1) break;
    }
    return current;
  }

  public findNextStartCode(): number {
    const totalBytes = this.getTotalBytes() - 3;
    for (let i = this.getNextByteIndex(); i <= totalBytes; i++) {
      if (this.isStartCode(i)) {
        this._index = (i + 4) << 3;
        return this._stream.get(i + 3);
      }
    }
    this._index = this._end;
    return -1;
  }

  public isStartCode(index: number): boolean {
    return (
      index >= this.getTotalBytes() ||
      (this._stream.get(index) === 0x00 &&
        this._stream.get(index + 1) === 0x00 &&
        this._stream.get(index + 2) === 0x01)
    );
  }

  public isNextBytesAreStartCode(): boolean {
    return this.isStartCode(this.getNextByteIndex());
  }

  public close(): void {
    this._stream.seek(this._end >> 3);
  }

  private getNextByteIndex(): number {
    return (this._index + 7) >> 3;
  }

  private getTotalBytes(): number {
    return this._count >> 3;
  }

  private checkRange(index: number): void {
    if (index > this._end || index < this._start)
      throw new OutRangeExcenption(this._start, this._end, index);
  }
}
