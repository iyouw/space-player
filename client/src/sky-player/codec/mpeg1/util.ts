export class MPEG1Helper {
  public static CopyBlockToDestination(
    block: Int32Array,
    dest: Uint8ClampedArray,
    index: number,
    scan: number
  ): void {
    for (let n = 0; n < 64; n += 8, index += scan + 8) {
      dest[index + 0] = block[n + 0];
      dest[index + 1] = block[n + 1];
      dest[index + 2] = block[n + 2];
      dest[index + 3] = block[n + 3];
      dest[index + 4] = block[n + 4];
      dest[index + 5] = block[n + 5];
      dest[index + 6] = block[n + 6];
      dest[index + 7] = block[n + 7];
    }
  }

  public static AddBlockToDestination(
    block: Int32Array,
    dest: Uint8ClampedArray,
    index: number,
    scan: number
  ): void {
    for (let n = 0; n < 64; n += 8, index += scan + 8) {
      dest[index + 0] += block[n + 0];
      dest[index + 1] += block[n + 1];
      dest[index + 2] += block[n + 2];
      dest[index + 3] += block[n + 3];
      dest[index + 4] += block[n + 4];
      dest[index + 5] += block[n + 5];
      dest[index + 6] += block[n + 6];
      dest[index + 7] += block[n + 7];
    }
  }

  public static CopyValueToDestination(
    value: number,
    dest: Uint8ClampedArray,
    index: number,
    scan: number
  ): void {
    for (let n = 0; n < 64; n += 8, index += scan + 8) {
      dest[index + 0] = value;
      dest[index + 1] = value;
      dest[index + 2] = value;
      dest[index + 3] = value;
      dest[index + 4] = value;
      dest[index + 5] = value;
      dest[index + 6] = value;
      dest[index + 7] = value;
    }
  }

  public static AddValueToDestination(
    value: number,
    dest: Uint8ClampedArray,
    index: number,
    scan: number
  ): void {
    for (let n = 0; n < 64; n += 8, index += scan + 8) {
      dest[index + 0] += value;
      dest[index + 1] += value;
      dest[index + 2] += value;
      dest[index + 3] += value;
      dest[index + 4] += value;
      dest[index + 5] += value;
      dest[index + 6] += value;
      dest[index + 7] += value;
    }
  }

  public static IDCT(block: Int32Array) {
    // See http://vsr.informatik.tu-chemnitz.de/~jan/MPEG/HTML/IDCT.html
    // for more info.

    let b1,
      b3,
      b4,
      b6,
      b7,
      tmp1,
      tmp2,
      m0,
      x0,
      x1,
      x2,
      x3,
      x4,
      y3,
      y4,
      y5,
      y6,
      y7;

    // Transform columns
    for (let i = 0; i < 8; ++i) {
      b1 = block[4 * 8 + i];
      b3 = block[2 * 8 + i] + block[6 * 8 + i];
      b4 = block[5 * 8 + i] - block[3 * 8 + i];
      tmp1 = block[1 * 8 + i] + block[7 * 8 + i];
      tmp2 = block[3 * 8 + i] + block[5 * 8 + i];
      b6 = block[1 * 8 + i] - block[7 * 8 + i];
      b7 = tmp1 + tmp2;
      m0 = block[0 * 8 + i];
      x4 = ((b6 * 473 - b4 * 196 + 128) >> 8) - b7;
      x0 = x4 - (((tmp1 - tmp2) * 362 + 128) >> 8);
      x1 = m0 - b1;
      x2 = (((block[2 * 8 + i] - block[6 * 8 + i]) * 362 + 128) >> 8) - b3;
      x3 = m0 + b1;
      y3 = x1 + x2;
      y4 = x3 + b3;
      y5 = x1 - x2;
      y6 = x3 - b3;
      y7 = -x0 - ((b4 * 473 + b6 * 196 + 128) >> 8);
      block[0 * 8 + i] = b7 + y4;
      block[1 * 8 + i] = x4 + y3;
      block[2 * 8 + i] = y5 - x0;
      block[3 * 8 + i] = y6 - y7;
      block[4 * 8 + i] = y6 + y7;
      block[5 * 8 + i] = x0 + y5;
      block[6 * 8 + i] = y3 - x4;
      block[7 * 8 + i] = y4 - b7;
    }

    // Transform rows
    for (let i = 0; i < 64; i += 8) {
      b1 = block[4 + i];
      b3 = block[2 + i] + block[6 + i];
      b4 = block[5 + i] - block[3 + i];
      tmp1 = block[1 + i] + block[7 + i];
      tmp2 = block[3 + i] + block[5 + i];
      b6 = block[1 + i] - block[7 + i];
      b7 = tmp1 + tmp2;
      m0 = block[0 + i];
      x4 = ((b6 * 473 - b4 * 196 + 128) >> 8) - b7;
      x0 = x4 - (((tmp1 - tmp2) * 362 + 128) >> 8);
      x1 = m0 - b1;
      x2 = (((block[2 + i] - block[6 + i]) * 362 + 128) >> 8) - b3;
      x3 = m0 + b1;
      y3 = x1 + x2;
      y4 = x3 + b3;
      y5 = x1 - x2;
      y6 = x3 - b3;
      y7 = -x0 - ((b4 * 473 + b6 * 196 + 128) >> 8);
      block[0 + i] = (b7 + y4 + 128) >> 8;
      block[1 + i] = (x4 + y3 + 128) >> 8;
      block[2 + i] = (y5 - x0 + 128) >> 8;
      block[3 + i] = (y6 - y7 + 128) >> 8;
      block[4 + i] = (y6 + y7 + 128) >> 8;
      block[5 + i] = (x0 + y5 + 128) >> 8;
      block[6 + i] = (y3 - x4 + 128) >> 8;
      block[7 + i] = (y4 - b7 + 128) >> 8;
    }
  }
}
