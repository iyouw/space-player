import type { Packet } from "@/sky-player/format/packet";
import { Logging } from "@/sky-player/logging/logging";
import type { BitReader } from "@/sky-player/stream/bit-reader";
import { MemoryStream } from "@/sky-player/stream/memory-stream";
import type { Handler } from "@/sky-player/typings/func";
import { Frame } from "../frame";
import type { IDecoder } from "../i-decoder";
import type { IFrame } from "../i-frame";
import {
  BIT_RATE,
  FRAME_SYNC,
  LAYER,
  MODE,
  QUANT_LUT_STEP4,
  QUANT_LUT_STEP_1,
  QUANT_LUT_STEP_2,
  QUANT_LUT_STEP_3,
  QUANT_TAB,
  SAMPLE_RATE,
  SCALEFACTOR_BASE,
  SYNTHESIS_WINDOW,
  VERSION,
  type TabItem,
} from "./constants";

export class Mp2Decoder implements IDecoder {
  private _left: Float32Array = new Float32Array(1152);
  private _right: Float32Array = new Float32Array(1152);
  private _sampleRate: number = 44100;

  private _d: Float32Array = new Float32Array(1024);
  private _v: Array<Float32Array> = [
    new Float32Array(1024),
    new Float32Array(1024),
  ];
  private _u: Int32Array = new Int32Array(32);

  private _vpos = 0;

  private _allocation: Array<Array<TabItem | undefined>> = [
    new Array<TabItem | undefined>(32),
    new Array<TabItem | undefined>(32),
  ];
  private _scaleFactorInfo: Array<Uint8Array> = [
    new Uint8Array(32),
    new Uint8Array(32),
  ];
  private _scaleFactor: Array<Array<Array<number | undefined>>> = [
    new Array<Array<number | undefined>>(32),
    new Array<Array<number | undefined>>(32),
  ];
  private _sample: Array<Array<Array<number>>> = [
    new Array<Array<number>>(32),
    new Array<Array<number>>(32),
  ];

  public onFrameCompleted?: Handler<IFrame>;

  public constructor() {
    this._d.set(SYNTHESIS_WINDOW, 0);
    this._d.set(SYNTHESIS_WINDOW, 512);

    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 32; i++) {
        this._scaleFactor[j][i] = [0, 0, 0];
        this._sample[j][i] = [0, 0, 0];
      }
    }
  }

  public decode(packet: Packet): void {
    const reader = this.createPacketReader(packet);
    while (!reader.isEnd) {
      this.decodeFrame(reader, packet);
    }
  }

  private decodeFrame(reader: BitReader, packet: Packet): void {
    const sync = reader.read(11);
    const version = reader.read(2);
    const layer = reader.read(2);
    const hasCRC = !reader.read(1);

    if (
      sync !== FRAME_SYNC ||
      version !== VERSION.MPEG_1 ||
      layer != LAYER.II
    ) {
      return;
    }

    let bitrateIndex = reader.read(4) - 1;
    // invalid bit rate or free format
    if (bitrateIndex > 13) return;

    let sampleRateIndex = reader.read(2);

    // invalid sample rate
    if (sampleRateIndex === 3) return;
    if (version === VERSION.MPEG_2) {
      sampleRateIndex += 4;
      bitrateIndex += 14;
    }
    const padding = reader.read(1);
    // skip privat (1 bit)
    reader.skip(1);
    const mode = reader.read(2);

    // parse the mode_extension, set up the stereo bound
    let bound = 0;
    if (mode === MODE.JOINT_STEREO) {
      bound = (reader.read(2) + 1) << 2;
    } else {
      reader.skip(2);
      bound = mode === MODE.MONO ? 0 : 32;
    }

    // discard the last 4 bits of the header and the crc value, if present
    reader.skip(4);
    if (hasCRC) reader.skip(16);

    // compute the frame size
    const bitrate = BIT_RATE[bitrateIndex];
    const sampleRate = SAMPLE_RATE[sampleRateIndex];
    const frameSize = ((144000 * bitrate) / sampleRate + padding) | 0;
    const frame = new Frame(packet.pts, packet.codecId);
    frame.bitrate = bitrate;
    frame.frameSize = frameSize;

    // prepare the quantizer table lookups
    let tab3 = 0;
    let sblimit = 0;
    if (version === VERSION.MPEG_2) {
      // MPEG-2 (LSR)
      tab3 = 2;
      sblimit = 30;
    } else {
      const tab1 = mode === MODE.MONO ? 0 : 1;
      const tab2 = QUANT_LUT_STEP_1[tab1][bitrateIndex];
      tab3 = QUANT_LUT_STEP_2[tab2][sampleRateIndex];
      sblimit = tab3 & 63;
      tab3 >>= 6;
    }
    if (bound > sblimit) bound = sblimit;

    // read the allocation information
    for (let sb = 0; sb < bound; sb++) {
      this._allocation[0][sb] = this.readAllocation(sb, tab3, reader);
      this._allocation[1][sb] = this.readAllocation(sb, tab3, reader);
    }

    for (let sb = bound; sb < sblimit; sb++) {
      this._allocation[0][sb] = this._allocation[1][sb] = this.readAllocation(
        sb,
        tab3,
        reader
      );
    }

    // read scale factor selector information
    const channels = mode === MODE.MONO ? 1 : 2;
    for (let sb = 0; sb < sblimit; sb++) {
      for (let ch = 0; ch < channels; ch++) {
        if (this._allocation[ch][sb]) {
          this._scaleFactorInfo[ch][sb] = reader.read(2);
        }
      }
      if (mode === MODE.MONO) {
        this._scaleFactorInfo[1][sb] = this._scaleFactorInfo[0][sb];
      }
    }

    // read scale factors
    for (let sb = 0; sb < sblimit; sb++) {
      for (let ch = 0; ch < channels; ch++) {
        if (this._allocation[ch][sb]) {
          const sf = this._scaleFactor[ch][sb];
          switch (this._scaleFactorInfo[ch][sb]) {
            case 0:
              sf[0] = reader.read(6);
              sf[1] = reader.read(6);
              sf[2] = reader.read(6);
              break;
            case 1:
              sf[0] = undefined;
              sf[1] = reader.read(6);
              sf[2] = reader.read(6);
              break;
            case 2:
              sf[0] = undefined;
              sf[1] = undefined;
              sf[2] = reader.read(6);
              break;
            case 3:
              sf[0] = reader.read(6);
              sf[1] = undefined;
              sf[2] = reader.read(6);
              break;
          }
        }
      }
      if (mode === MODE.MONO) {
        this._scaleFactor[1][sb][0] = this._scaleFactor[0][sb][0];
        this._scaleFactor[1][sb][1] = this._scaleFactor[0][sb][1];
        this._scaleFactor[1][sb][2] = this._scaleFactor[0][sb][2];
      }
    }

    // coefficient input and reconstruction
    let outPos = 0;
    for (let part = 0; part < 3; part++) {
      for (let granule = 0; granule < 4; granule++) {
        // read the samples
        for (let sb = 0; sb < bound; sb++) {
          this.readSamples(0, sb, part, reader);
          this.readSamples(1, sb, part, reader);
        }
        for (let sb = bound; sb < sblimit; sb++) {
          this.readSamples(0, sb, part, reader);
          this._sample[1][sb][0] = this._sample[0][sb][0];
          this._sample[1][sb][1] = this._sample[0][sb][1];
          this._sample[1][sb][2] = this._sample[0][sb][2];
        }
        for (let sb = sblimit; sb < 32; sb++) {
          this._sample[0][sb][0] = 0;
          this._sample[0][sb][1] = 0;
          this._sample[0][sb][2] = 0;
          this._sample[1][sb][0] = 0;
          this._sample[1][sb][1] = 0;
          this._sample[1][sb][2] = 0;
        }
        // synthesis loop
        for (let p = 0; p < 3; p++) {
          // shifting step
          this._vpos = (this._vpos - 64) & 1023;

          for (let ch = 0; ch < 2; ch++) {
            this.matrixTransform(this._sample[ch], p, this._v[ch], this._vpos);
            // build u ,windowing, calculate output
            Array.prototype.fill(this._u, 0);

            let dIndex = 512 - (this._vpos >> 1);
            let vIndex = this._vpos % 128 >> 1;
            while (vIndex < 1024) {
              for (let i = 0; i < 32; i++) {
                this._u[i] += this._d[dIndex++] * this._v[ch][vIndex++];
              }
              vIndex += 128 - 32;
              dIndex += 64 - 32;
            }

            vIndex = 128 - 32 + 1024 - vIndex;
            dIndex -= 512 - 32;
            while (vIndex < 1024) {
              for (let i = 0; i < 32; i++) {
                this._u[i] += this._d[dIndex++] * this._v[ch][vIndex++];
              }

              vIndex += 128 - 32;
              dIndex += 64 - 32;
            }

            // output samples
            const outChannel = ch === 0 ? this._left : this._right;
            for (let j = 0; j < 32; j++) {
              outChannel[outPos + j] = this._u[j] / 2147418112;
            }
          }
          outPos += 32;
        }
      }
    }
    frame.addBuffer(this._left);
    frame.addBuffer(this._right);
    this.onFrameCompleted?.(frame);
  }

  private createPacketReader(packet: Packet): BitReader {
    const totalLength = packet.buffers.reduce(
      (ret, buf) => (ret += buf.byteLength),
      0
    );
    const stream = new MemoryStream(totalLength);
    stream.write(packet.buffers);
    return stream.readBit();
  }

  private readAllocation(
    sb: number,
    tab3: number,
    reader: BitReader
  ): TabItem | undefined {
    const tab4 = QUANT_LUT_STEP_3[tab3][sb];
    const qtab = QUANT_LUT_STEP4[tab4 & 15][reader.read(tab4 >> 4)];
    return qtab ? QUANT_TAB[qtab - 1] : undefined;
  }

  private readSamples(
    ch: number,
    sb: number,
    part: number,
    reader: BitReader
  ): void {
    const q = this._allocation[ch][sb];
    let sf = this._scaleFactor[ch][sb][part];
    const sample = this._sample[ch][sb];
    let val = 0;

    if (!q) {
      // no bits allocated for this subband
      sample[0] = sample[1] = sample[2] = 0;
      return;
    }

    // resolve scale factor
    if (sf === 63) {
      sf = 0;
    } else {
      const shift = (sf! / 3) | 0;
      sf = (SCALEFACTOR_BASE[sf! % 3] + ((1 << shift) >> 1)) >> shift;
    }

    // decode samples
    let adj = q.levels;
    if (q.group) {
      // decode grouped samples
      val = reader.read(q.bits);
      sample[0] = val % adj;
      val = (val / adj) | 0;
      sample[1] = val % adj;
      sample[2] = (val / adj) | 0;
    } else {
      // decode direct samples
      sample[0] = reader.read(q.bits);
      sample[1] = reader.read(q.bits);
      sample[2] = reader.read(q.bits);
    }

    // post multiply samples
    const scale = (65536 / (adj + 1)) | 0;
    adj = ((adj + 1) >> 1) - 1;

    val = (adj - sample[0]) * scale;
    sample[0] = (val * (sf >> 12) + ((val * (sf & 4095) + 2048) >> 12)) >> 12;

    val = (adj - sample[1]) * scale;
    sample[1] = (val * (sf >> 12) + ((val * (sf & 4095) + 2048) >> 12)) >> 12;

    val = (adj - sample[2]) * scale;
    sample[2] = (val * (sf >> 12) + ((val * (sf & 4095) + 2048) >> 12)) >> 12;
  }

  private matrixTransform(
    s: Array<Array<number>>,
    ss: number,
    d: Float32Array,
    dp: number
  ): void {
    let t01,
      t02,
      t03,
      t04,
      t05,
      t06,
      t07,
      t08,
      t09,
      t10,
      t11,
      t12,
      t13,
      t14,
      t15,
      t16,
      t17,
      t18,
      t19,
      t20,
      t21,
      t22,
      t23,
      t24,
      t25,
      t26,
      t27,
      t28,
      t29,
      t30,
      t31,
      t32,
      t33;

    t01 = s[0][ss] + s[31][ss];
    t02 = (s[0][ss] - s[31][ss]) * 0.500602998235;
    t03 = s[1][ss] + s[30][ss];
    t04 = (s[1][ss] - s[30][ss]) * 0.505470959898;
    t05 = s[2][ss] + s[29][ss];
    t06 = (s[2][ss] - s[29][ss]) * 0.515447309923;
    t07 = s[3][ss] + s[28][ss];
    t08 = (s[3][ss] - s[28][ss]) * 0.53104259109;
    t09 = s[4][ss] + s[27][ss];
    t10 = (s[4][ss] - s[27][ss]) * 0.553103896034;
    t11 = s[5][ss] + s[26][ss];
    t12 = (s[5][ss] - s[26][ss]) * 0.582934968206;
    t13 = s[6][ss] + s[25][ss];
    t14 = (s[6][ss] - s[25][ss]) * 0.622504123036;
    t15 = s[7][ss] + s[24][ss];
    t16 = (s[7][ss] - s[24][ss]) * 0.674808341455;
    t17 = s[8][ss] + s[23][ss];
    t18 = (s[8][ss] - s[23][ss]) * 0.744536271002;
    t19 = s[9][ss] + s[22][ss];
    t20 = (s[9][ss] - s[22][ss]) * 0.839349645416;
    t21 = s[10][ss] + s[21][ss];
    t22 = (s[10][ss] - s[21][ss]) * 0.972568237862;
    t23 = s[11][ss] + s[20][ss];
    t24 = (s[11][ss] - s[20][ss]) * 1.16943993343;
    t25 = s[12][ss] + s[19][ss];
    t26 = (s[12][ss] - s[19][ss]) * 1.48416461631;
    t27 = s[13][ss] + s[18][ss];
    t28 = (s[13][ss] - s[18][ss]) * 2.05778100995;
    t29 = s[14][ss] + s[17][ss];
    t30 = (s[14][ss] - s[17][ss]) * 3.40760841847;
    t31 = s[15][ss] + s[16][ss];
    t32 = (s[15][ss] - s[16][ss]) * 10.1900081235;

    t33 = t01 + t31;
    t31 = (t01 - t31) * 0.502419286188;
    t01 = t03 + t29;
    t29 = (t03 - t29) * 0.52249861494;
    t03 = t05 + t27;
    t27 = (t05 - t27) * 0.566944034816;
    t05 = t07 + t25;
    t25 = (t07 - t25) * 0.64682178336;
    t07 = t09 + t23;
    t23 = (t09 - t23) * 0.788154623451;
    t09 = t11 + t21;
    t21 = (t11 - t21) * 1.06067768599;
    t11 = t13 + t19;
    t19 = (t13 - t19) * 1.72244709824;
    t13 = t15 + t17;
    t17 = (t15 - t17) * 5.10114861869;
    t15 = t33 + t13;
    t13 = (t33 - t13) * 0.509795579104;
    t33 = t01 + t11;
    t01 = (t01 - t11) * 0.601344886935;
    t11 = t03 + t09;
    t09 = (t03 - t09) * 0.899976223136;
    t03 = t05 + t07;
    t07 = (t05 - t07) * 2.56291544774;
    t05 = t15 + t03;
    t15 = (t15 - t03) * 0.541196100146;
    t03 = t33 + t11;
    t11 = (t33 - t11) * 1.30656296488;
    t33 = t05 + t03;
    t05 = (t05 - t03) * 0.707106781187;
    t03 = t15 + t11;
    t15 = (t15 - t11) * 0.707106781187;
    t03 += t15;
    t11 = t13 + t07;
    t13 = (t13 - t07) * 0.541196100146;
    t07 = t01 + t09;
    t09 = (t01 - t09) * 1.30656296488;
    t01 = t11 + t07;
    t07 = (t11 - t07) * 0.707106781187;
    t11 = t13 + t09;
    t13 = (t13 - t09) * 0.707106781187;
    t11 += t13;
    t01 += t11;
    t11 += t07;
    t07 += t13;
    t09 = t31 + t17;
    t31 = (t31 - t17) * 0.509795579104;
    t17 = t29 + t19;
    t29 = (t29 - t19) * 0.601344886935;
    t19 = t27 + t21;
    t21 = (t27 - t21) * 0.899976223136;
    t27 = t25 + t23;
    t23 = (t25 - t23) * 2.56291544774;
    t25 = t09 + t27;
    t09 = (t09 - t27) * 0.541196100146;
    t27 = t17 + t19;
    t19 = (t17 - t19) * 1.30656296488;
    t17 = t25 + t27;
    t27 = (t25 - t27) * 0.707106781187;
    t25 = t09 + t19;
    t19 = (t09 - t19) * 0.707106781187;
    t25 += t19;
    t09 = t31 + t23;
    t31 = (t31 - t23) * 0.541196100146;
    t23 = t29 + t21;
    t21 = (t29 - t21) * 1.30656296488;
    t29 = t09 + t23;
    t23 = (t09 - t23) * 0.707106781187;
    t09 = t31 + t21;
    t31 = (t31 - t21) * 0.707106781187;
    t09 += t31;
    t29 += t09;
    t09 += t23;
    t23 += t31;
    t17 += t29;
    t29 += t25;
    t25 += t09;
    t09 += t27;
    t27 += t23;
    t23 += t19;
    t19 += t31;
    t21 = t02 + t32;
    t02 = (t02 - t32) * 0.502419286188;
    t32 = t04 + t30;
    t04 = (t04 - t30) * 0.52249861494;
    t30 = t06 + t28;
    t28 = (t06 - t28) * 0.566944034816;
    t06 = t08 + t26;
    t08 = (t08 - t26) * 0.64682178336;
    t26 = t10 + t24;
    t10 = (t10 - t24) * 0.788154623451;
    t24 = t12 + t22;
    t22 = (t12 - t22) * 1.06067768599;
    t12 = t14 + t20;
    t20 = (t14 - t20) * 1.72244709824;
    t14 = t16 + t18;
    t16 = (t16 - t18) * 5.10114861869;
    t18 = t21 + t14;
    t14 = (t21 - t14) * 0.509795579104;
    t21 = t32 + t12;
    t32 = (t32 - t12) * 0.601344886935;
    t12 = t30 + t24;
    t24 = (t30 - t24) * 0.899976223136;
    t30 = t06 + t26;
    t26 = (t06 - t26) * 2.56291544774;
    t06 = t18 + t30;
    t18 = (t18 - t30) * 0.541196100146;
    t30 = t21 + t12;
    t12 = (t21 - t12) * 1.30656296488;
    t21 = t06 + t30;
    t30 = (t06 - t30) * 0.707106781187;
    t06 = t18 + t12;
    t12 = (t18 - t12) * 0.707106781187;
    t06 += t12;
    t18 = t14 + t26;
    t26 = (t14 - t26) * 0.541196100146;
    t14 = t32 + t24;
    t24 = (t32 - t24) * 1.30656296488;
    t32 = t18 + t14;
    t14 = (t18 - t14) * 0.707106781187;
    t18 = t26 + t24;
    t24 = (t26 - t24) * 0.707106781187;
    t18 += t24;
    t32 += t18;
    t18 += t14;
    t26 = t14 + t24;
    t14 = t02 + t16;
    t02 = (t02 - t16) * 0.509795579104;
    t16 = t04 + t20;
    t04 = (t04 - t20) * 0.601344886935;
    t20 = t28 + t22;
    t22 = (t28 - t22) * 0.899976223136;
    t28 = t08 + t10;
    t10 = (t08 - t10) * 2.56291544774;
    t08 = t14 + t28;
    t14 = (t14 - t28) * 0.541196100146;
    t28 = t16 + t20;
    t20 = (t16 - t20) * 1.30656296488;
    t16 = t08 + t28;
    t28 = (t08 - t28) * 0.707106781187;
    t08 = t14 + t20;
    t20 = (t14 - t20) * 0.707106781187;
    t08 += t20;
    t14 = t02 + t10;
    t02 = (t02 - t10) * 0.541196100146;
    t10 = t04 + t22;
    t22 = (t04 - t22) * 1.30656296488;
    t04 = t14 + t10;
    t10 = (t14 - t10) * 0.707106781187;
    t14 = t02 + t22;
    t02 = (t02 - t22) * 0.707106781187;
    t14 += t02;
    t04 += t14;
    t14 += t10;
    t10 += t02;
    t16 += t04;
    t04 += t08;
    t08 += t14;
    t14 += t28;
    t28 += t10;
    t10 += t20;
    t20 += t02;
    t21 += t16;
    t16 += t32;
    t32 += t04;
    t04 += t06;
    t06 += t08;
    t08 += t18;
    t18 += t14;
    t14 += t30;
    t30 += t28;
    t28 += t26;
    t26 += t10;
    t10 += t12;
    t12 += t20;
    t20 += t24;
    t24 += t02;

    d[dp + 48] = -t33;
    d[dp + 49] = d[dp + 47] = -t21;
    d[dp + 50] = d[dp + 46] = -t17;
    d[dp + 51] = d[dp + 45] = -t16;
    d[dp + 52] = d[dp + 44] = -t01;
    d[dp + 53] = d[dp + 43] = -t32;
    d[dp + 54] = d[dp + 42] = -t29;
    d[dp + 55] = d[dp + 41] = -t04;
    d[dp + 56] = d[dp + 40] = -t03;
    d[dp + 57] = d[dp + 39] = -t06;
    d[dp + 58] = d[dp + 38] = -t25;
    d[dp + 59] = d[dp + 37] = -t08;
    d[dp + 60] = d[dp + 36] = -t11;
    d[dp + 61] = d[dp + 35] = -t18;
    d[dp + 62] = d[dp + 34] = -t09;
    d[dp + 63] = d[dp + 33] = -t14;
    d[dp + 32] = -t05;
    d[dp + 0] = t05;
    d[dp + 31] = -t30;
    d[dp + 1] = t30;
    d[dp + 30] = -t27;
    d[dp + 2] = t27;
    d[dp + 29] = -t28;
    d[dp + 3] = t28;
    d[dp + 28] = -t07;
    d[dp + 4] = t07;
    d[dp + 27] = -t26;
    d[dp + 5] = t26;
    d[dp + 26] = -t23;
    d[dp + 6] = t23;
    d[dp + 25] = -t10;
    d[dp + 7] = t10;
    d[dp + 24] = -t15;
    d[dp + 8] = t15;
    d[dp + 23] = -t12;
    d[dp + 9] = t12;
    d[dp + 22] = -t19;
    d[dp + 10] = t19;
    d[dp + 21] = -t20;
    d[dp + 11] = t20;
    d[dp + 20] = -t13;
    d[dp + 12] = t13;
    d[dp + 19] = -t24;
    d[dp + 13] = t24;
    d[dp + 18] = -t31;
    d[dp + 14] = t31;
    d[dp + 17] = -t02;
    d[dp + 15] = t02;
    d[dp + 16] = 0.0;
  }
}
