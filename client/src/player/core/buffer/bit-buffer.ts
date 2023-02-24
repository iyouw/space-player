import { Logging } from "@/player/abstraction";
import { Scope } from "./scope";

export class BitBuffer {
  // Default linux memory page size is 4kb, but we use 64KB to corresponding to  webassembly's memory page size.
  public static readonly OnePage = 64 * 1024;
  // We use thirty page size as the threshold for doing garbage collection
  public static readonly Threshold = 30 * BitBuffer.OnePage;

  private _data: Uint8Array;
  // bit count for current reading position
  private _index: number;
  // used byte length
  private _currentByteLength: number;
  // record all bytes length flow through this buffer
  private _totalByteLength: number;
  // garbage collection threshold
  private _threshold: number;

  public constructor(
    capacity: number = BitBuffer.OnePage,
    threshold: number = BitBuffer.Threshold
  ) {
    this._data = new Uint8Array(capacity);
    this._index = 0;
    this._currentByteLength = 0;
    this._totalByteLength = 0;
    this._threshold = threshold;
  }

  public get data(): Uint8Array {
    return this._data;
  }

  public get capacity(): number {
    return this._data.byteLength;
  }

  public get index(): number {
    return this._index;
  }

  public set index(value: number) {
    this._index = value;
  }

  public get position(): number {
    return this._index >> 3;
  }

  public get nextPosition(): number {
    return (this._index + 7) >> 3;
  }

  public get currentByteLength(): number {
    return this._currentByteLength;
  }

  public get availableByteLength(): number {
    return this.capacity - this._currentByteLength;
  }

  public get accessibleByteLength(): number {
    return this._currentByteLength - this.position;
  }

  public get totalByteLength(): number {
    return this._totalByteLength;
  }

  public get threshold(): number {
    return this._threshold;
  }

  public set threshold(value: number) {
    if (value < this.capacity) return;
    this._threshold = value;
  }

  public appendBuffer(buffer: ArrayBuffer): BitBuffer;
  public appendBuffer(buffer: Uint8Array): BitBuffer;
  public appendBuffer(buffer: Array<ArrayBuffer>): BitBuffer;
  public appendBuffer(buffer: Array<Uint8Array>): BitBuffer;
  public appendBuffer(
    buffer: ArrayBuffer | Uint8Array | Array<ArrayBuffer | Uint8Array>
  ): BitBuffer {
    const buffers = Array.isArray(buffer) ? buffer : [buffer];
    const size = buffers.reduce((ret, buf) => (ret += buf.byteLength), 0);
    this.ensureAppendSize(size);
    for (const buf of buffers) {
      const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      this._data.set(b, this._currentByteLength);
      this._currentByteLength += b.length;
    }
    this._totalByteLength += size;
    return this;
  }

  public peek(count: number): number {
    //should check there is enough data,we can peek
    let res = 0;
    let offset = this._index;
    while (count) {
      const num = this._data[offset >> 3];
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
    return res;
  }

  public skip(count: number): BitBuffer {
    this._index += count;
    return this;
  }

  public rewind(count: number): BitBuffer {
    this._index = Math.max(this._index - count, 0);
    return this;
  }

  public has(count: number): boolean {
    return this._currentByteLength - (this._index >> 3) >= count;
  }

  // scope
  public beginScope(count: number): Scope {
    return new Scope(this, count, this._index);
  }

  private ensureAppendSize(size: number): void {
    if (this.availableByteLength >= size) return;
    // check if we can do garbage collection
    if (
      this.position + this.availableByteLength >= size &&
      this.capacity >= this._threshold
    ) {
      this._data.copyWithin(this.position, 0);
      this._currentByteLength -= this.position;
      Logging.LogInformation(
        BitBuffer.name,
        `do garbage collection, collect ${this.position} bytes`
      );
      this._index -= this.position << 3;
      return;
    }
    // expand capacity. will change this strategy for performance improving
    const capacity =
      this.capacity +
      Math.ceil((size - this.availableByteLength) / BitBuffer.OnePage) *
        BitBuffer.OnePage;
    const buf = new Uint8Array(capacity);
    buf.set(this._data, 0);
    this._data = buf;
  }
}
