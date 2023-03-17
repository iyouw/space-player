import { OutRangeExcenption } from "../exception/out-range-exception";
import { BitReader } from "./bit-reader";

export class MemoryStream {
  public static readonly OnePage: number = 64 * 1024;

  public static readonly Threshold: number = 30 * MemoryStream.OnePage;

  private _data: Uint8Array;

  private _threshold: number;

  private _index: number;

  private _length: number;

  private _totalLength: number;

  public constructor(
    capacity: number = MemoryStream.OnePage,
    threshold: number = MemoryStream.Threshold
  ) {
    this._data = new Uint8Array(capacity);
    this._threshold = threshold;
    this._index = 0;
    this._length = 0;
    this._totalLength = 0;
  }

  public get data(): Uint8Array {
    return this._data;
  }

  public get capacity(): number {
    return this._data.length;
  }

  public get threshold(): number {
    return this._threshold;
  }

  public get index(): number {
    return this._index;
  }

  public get length(): number {
    return this._length;
  }

  public get totalLength(): number {
    return this._totalLength;
  }

  public get free(): number {
    return this.capacity - this._length;
  }

  public write(buffer: ArrayBuffer): MemoryStream;
  public write(buffer: Uint8Array): MemoryStream;
  public write(buffer: Array<ArrayBuffer>): MemoryStream;
  public write(buffer: Array<Uint8Array>): MemoryStream;
  public write(
    buffer: ArrayBuffer | Uint8Array | Array<ArrayBuffer | Uint8Array>
  ): MemoryStream {
    const buffers = Array.isArray(buffer) ? buffer : [buffer];
    const size = buffers.reduce((ret, buf) => (ret += buf.byteLength), 0);
    this.ensureFreeSize(size);
    for (const buf of buffers) {
      const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      this._data.set(b, this._length);
      this._length += b.byteLength;
    }
    this._totalLength += size;
    return this;
  }

  public collect(): void {
    if (this._index === 0) return;
    if (this.capacity < this._threshold) return;
    this._data.copyWithin(0, this._index, this._length);
    this._length -= this._index;
    this._index = 0;
  }

  public seek(index: number): void {
    this.checkRange(index);
    this._index = index;
  }

  public skip(count: number): void {
    const index = this._index + count;
    this.checkRange(index);
    this._index = index;
  }

  public rewind(count: number): void {
    const index = this._index - count;
    this.checkRange(index);
    this._index = index;
  }

  public has(count: number): boolean {
    return this._length - this._index >= count;
  }

  public get(index: number): number {
    this.checkRange(index);
    return this._data[index];
  }

  public read(start?: number, end?: number): Uint8Array {
    const res = this.slice(start, end);
    this._index = end ?? this._length;
    return res;
  }

  public slice(start?: number, end?: number): Uint8Array {
    start ??= this._index;
    end ??= this._length;
    this.checkRange(start);
    this.checkRange(end);
    return this._data.subarray(start, end);
  }

  public readBit(count?: number): BitReader {
    count ??= (this._length - this._index) << 3;
    const index = this._index + (count >> 3);
    this.checkRange(index);
    return new BitReader(this, count);
  }

  public close(): void {
    this._index = 0;
    this._length = 0;
    this._totalLength = 0;
    this._data = new Uint8Array(MemoryStream.OnePage);
  }

  private ensureFreeSize(size: number): void {
    if (this.free > size) return;
    if (this.free + this._index > size && this.capacity > this._threshold) {
      this.collect();
      return;
    }
    const pages = Math.ceil((size - this.free) / MemoryStream.OnePage);
    const capacity = this.capacity + pages * MemoryStream.OnePage;
    const buf = new Uint8Array(capacity);
    buf.set(this._data);
    this._data = buf;
  }

  private checkRange(index: number): void {
    if (index > this._length || index < 0)
      throw new OutRangeExcenption(0, this._length, index);
  }
}
