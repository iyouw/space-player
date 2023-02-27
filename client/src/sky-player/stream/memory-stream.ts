import { BitReader } from "./bit-reader";

export class MemoryStream {
  public static readonly OnePage: number = 64 * 1024;

  public static readonly Threshold: number = 30 * MemoryStream.OnePage;

  private _data: Uint8Array;

  private _threshold: number;

  private _index: number;

  private _length: number;

  private _finalLength: number;

  public constructor(
    capacity: number = MemoryStream.OnePage,
    threshold: number = MemoryStream.Threshold
  ) {
    this._data = new Uint8Array(capacity);
    this._threshold = threshold;
    this._index = 0;
    this._length = 0;
    this._finalLength = 0;
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

  public get finalLength(): number {
    return this._finalLength;
  }

  public get free(): number {
    return this.capacity - this._index;
  }

  public write(buffer: ArrayBuffer): MemoryStream;
  public write(buffer: Uint8Array): MemoryStream;
  public write(buffer: Array<ArrayBuffer>): MemoryStream;
  public write(buffer: Array<Uint8Array>): MemoryStream;
  public write(buffer: ArrayBuffer | Uint8Array | Array<ArrayBuffer | Uint8Array>): MemoryStream {
    const buffers = Array.isArray(buffer) ? buffer : [buffer];
    const size = buffers.reduce((ret, buf) =>ret += buf.byteLength, 0);
    this.ensureFreeSize(size);
    for (const buf of buffers) {
      const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      this._data.set(b, this._index);
      this._index += b.length;
    }
    this._length += size;
    this._finalLength += size;
    return this;
  }

  public collect(): MemoryStream {
    if (this._index === 0) return this;
    this._data.copyWithin(0, this._index, this._length);
    this._length -= this._index;
    this._index = 0;
    return this;
  }

  public seek(index: number): MemoryStream {
    this._index = Math.max(0, Math.min(this.capacity, index));
    return this;
  }

  public skip(count: number): MemoryStream {
    this._index = Math.min(this._length, this._index + count);
    return this;
  }

  public rewind(count: number): MemoryStream {
    this._index = Math.max(0, this._index - count);
    return this;
  }

  public has(count: number): boolean {
    return this.length - this._index >= count;
  }

  public get(index: number): number {
    return this._data[index];
  }

  public set(index: number, value: number): void {
    this._data[index] = value;
  }

  public readBit(count: number): BitReader {
    const start = this._index << 3;
    const bitCount = count << 3;
    return new BitReader(this, start, bitCount);
  }

  public close(): void {
    this._index = 0;
    this._length = 0;
    this._finalLength = 0;
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
}