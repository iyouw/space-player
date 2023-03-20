import type { Packet } from "@/sky-player/format/packet";
import type { IDecoder } from "../i-decoder";
import { Frame } from "../frame";
import { MemoryStream } from "@/sky-player/stream/memory-stream";
import type { BitReader } from "@/sky-player/stream/bit-reader";
import {
  CODE_BLOCK_PATTERN,
  DCT_COEFF,
  DCT_DC_SIZE_CHROMINANCE,
  DCT_DC_SIZE_LUMINANCE,
  DEFAULT_INTRA_QUANT_MATRIX,
  DEFAULT_NON_INTRA_QUANT_MATRIX,
  MACROBLOCK_ADDRESS_INCREMENT,
  MACROBLOCK_TYPE,
  MOTION,
  PICTURE_RATE,
  PICTURE_TYPE,
  PREMULTIPLIER_MATRIX,
  START,
  ZIG_ZAG,
} from "./constants";
import type { Handler } from "@/sky-player/typings/func";

export class Mpeg1Decoder implements IDecoder {
  private _customIntraQuantMatrix: Uint8Array = new Uint8Array(64);

  private _customNonIntraQuantMatrix: Uint8Array = new Uint8Array(64);

  private _blockData: Int32Array = new Int32Array(64);

  private _intraQuantMatrix?: Uint8Array;

  private _nonIntraQuantMatrix?: Uint8Array;

  private _width: number = 0;
  private _height: number = 0;

  private _mbWidth: number = 0;
  private _mbHeight: number = 0;
  private _mbSize: number = 0;

  private _codedWidth: number = 0;
  private _codedHeight: number = 0;
  private _codedSize: number = 0;

  private _halfWidth: number = 0;
  private _halfHeight: number = 0;

  // Sequence layer
  private _frameRate: number = 30;
  private _hasSequenceHeader: boolean = false;

  // Picture layer
  private _currentY?: Uint8ClampedArray;
  private _currentCr?: Uint8ClampedArray;
  private _currentCb?: Uint8ClampedArray;

  private _pictureType: number = 0;

  private _currentY32?: Uint32Array;
  private _currentCr32?: Uint32Array;
  private _currentCb32?: Uint32Array;

  // Buffers for motion compensation
  private _forwardY?: Uint8ClampedArray;
  private _forwardCr?: Uint8ClampedArray;
  private _forwardCb?: Uint8ClampedArray;

  private _fullPelForward: number = 0;
  private _forwardFCode: number = 0;
  private _forwardRSize: number = 0;
  private _forwardF: number = 0;

  private _forwardY32?: Uint32Array;
  private _forwardCr32?: Uint32Array;
  private _forwardCb32?: Uint32Array;

  // Slice Layer
  private _quantizerScale: number = 0;
  private _sliceBegin: boolean = false;

  // Macroblock Layer
  private _macroblockAddress: number = 0;
  private _mbRow: number = 0;
  private _mbCol: number = 0;

  private _macroblockType: number = 0;
  private _macroblockIntra: number = 0;
  private _macroblockMotFw: number = 0;

  private _motionFwH: number = 0;
  private _motionFwV: number = 0;
  private _motionFwHPrev: number = 0;
  private _motionFwVPrev: number = 0;

  // Block Layer
  private _dcPredictorY: number = 0;
  private _dcPredictorCr: number = 0;
  private _dcPredictorCb: number = 0;

  onFrameCompleted?: Handler<Frame>;

  public decode(packet: Packet): Frame | undefined {
    const res = new Frame(
      packet.pts,
      packet.codecId,
      this._width,
      this._height
    );
    const reader = this.createPacketReader(packet);
    if (!this.decodeSequenceLayer(reader, res)) return;
    if (!this.decodePicture(reader, res)) return;
    return res;
  }

  // sequence layer
  private decodeSequenceLayer(reader: BitReader, frame: Frame): boolean {
    if (this._hasSequenceHeader) return true;
    if (reader.findStartCode(START.SEQUENCE) === -1) return false;
    // get size
    const newWidth = reader.read(12);
    const newHeight = reader.read(12);
    // skip pixel aspect ratio
    reader.skip(4);
    // get frame rate
    this._frameRate = PICTURE_RATE[reader.read(4)];
    // skip bit_rate, marker, buffer_size and constrained bit
    reader.skip(18 + 1 + 10 + 1);

    // size change
    if (this._width !== newWidth || this._height !== newHeight) {
      frame.width = this._width = newWidth;
      frame.height = this._height = newHeight;
      this.initBuffers();
    }

    // load custom intra quant matrix
    if (reader.read(1)) {
      for (let i = 0; i < 64; i++) {
        this._customIntraQuantMatrix[ZIG_ZAG[i]] = reader.read(8);
      }
      this._intraQuantMatrix = this._customIntraQuantMatrix;
    }

    // load custom non intra quant matrix
    if (reader.read(1)) {
      for (let i = 0; i < 64; i++) {
        this._customNonIntraQuantMatrix[ZIG_ZAG[i]] = reader.read(8);
      }
      this._nonIntraQuantMatrix = this._customNonIntraQuantMatrix;
    }

    this._hasSequenceHeader = true;
    return true;
  }

  // picture layer
  private decodePicture(reader: BitReader, frame: Frame): boolean {
    if (!this._hasSequenceHeader) return false;
    if (reader.findStartCode(START.PICTURE) === -1) return false;
    // skip temporalReference
    reader.skip(10);
    // read picture type
    this._pictureType = reader.read(3);
    // skip vbv_delay
    reader.skip(16);
    // skip B and D frames or unknow coding type
    if (this._pictureType <= 0 || this._pictureType >= PICTURE_TYPE.B)
      return false;
    // full_pel_forward, forward_f_code, it is P frame
    if (this._pictureType === PICTURE_TYPE.PREDICTIVE) {
      this._fullPelForward = reader.read(1);
      this._forwardFCode = reader.read(3);
      // ignore picture with zero forward_f_code
      if (this._forwardFCode === 0) return false;
      this._forwardRSize = this._forwardFCode - 1;
      this._forwardF = 1 << this._forwardRSize;
    }

    let code = 0;
    do {
      code = reader.findNextStartCode();
    } while (code === START.EXTENSION || code === START.USER_DATA);

    while (code >= START.SLICE_FIRST && code <= START.SLICE_LAST) {
      this.decodeSlice(code & 0x000000ff, reader);
      code = reader.findNextStartCode();
    }

    // We found the next start code; rewind 32bits and let the main loop handle it
    if (code !== -1) reader.rewind(32);

    // add picture data to buffer.pixel format is yuv
    frame.addBuffer(this._currentY!);
    frame.addBuffer(this._currentCr!);
    frame.addBuffer(this._currentCb!);
    this.onFrameCompleted?.(frame);

    // if this is a reference picture then rotate the prediction pointers
    if (
      this._pictureType === PICTURE_TYPE.INTRA ||
      this._pictureType === PICTURE_TYPE.PREDICTIVE
    ) {
      this.rotatePredictionPointers();
    }
    return true;
  }

  // slice layer
  private decodeSlice(slice: number, reader: BitReader) {
    this._sliceBegin = true;
    this._macroblockAddress = (slice - 1) * this._mbWidth - 1;

    // reset motion vectors and DC predictors
    this.resetMotionVectors();
    this.resetDcPredictors();

    this._quantizerScale = reader.read(5);

    // skip extra bits
    while (reader.read(1)) {
      reader.skip(8);
    }

    do {
      this.decodeMacroblock(reader);
    } while (!reader.isNextBytesAreStartCode());
  }

  // macro block layer
  private decodeMacroblock(reader: BitReader): void {
    // decode macroblock_address_increment
    let increment = 0;
    let t = this.readHuffman(MACROBLOCK_ADDRESS_INCREMENT, reader);

    // skip macroblock_stuffing
    while (t === 34) {
      t = this.readHuffman(MACROBLOCK_ADDRESS_INCREMENT, reader);
    }

    // macroblock_escape
    while (t === 35) {
      increment += 33;
      t = this.readHuffman(MACROBLOCK_ADDRESS_INCREMENT, reader);
    }
    increment += t;

    // process any skipped macroblocks
    if (this._sliceBegin) {
      this._sliceBegin = false;
      this._macroblockAddress += increment;
    } else {
      // illegal macroblock_address_increment (too large)
      if (this._macroblockAddress + increment >= this._mbSize) return;

      if (increment > 1) {
        // skipped macroblocks reset dc predictors
        this.resetDcPredictors();

        if (this._pictureType === PICTURE_TYPE.PREDICTIVE) {
          this.resetMotionVectors();
        }
      }

      // predict skipped macroblocks
      while (increment > 1) {
        this._macroblockAddress++;
        this._mbRow = (this._macroblockAddress / this._mbWidth) | 0;
        this._mbCol = this._macroblockAddress % this._mbWidth;
        // assign yuv
        this.copyMacroblock(
          this._motionFwH,
          this._motionFwV,
          this._forwardY!,
          this._forwardCr!,
          this._forwardCb!
        );
        increment--;
      }
      this._macroblockAddress++;
    }

    this._mbRow = (this._macroblockAddress / this._mbWidth) | 0;
    this._mbCol = this._macroblockAddress % this._mbWidth;

    // process the current macroblock
    const mbTable = MACROBLOCK_TYPE[this._pictureType];
    this._macroblockType = this.readHuffman(mbTable!, reader);
    this._macroblockIntra = this._macroblockType & 0x01;
    this._macroblockMotFw = this._macroblockType & 0x08;

    // quantizer scale
    if ((this._macroblockType & 0x10) !== 0) {
      this._quantizerScale = reader.read(5);
    }

    if (this._macroblockIntra) {
      // intra coded macroblocks reset motion vectors
      this.resetMotionVectors();
    } else {
      // non intra macroblocks reset dc predictors
      this.resetDcPredictors();

      this.decodeMotionVectors(reader);
      // assign yuv
      this.copyMacroblock(
        this._motionFwH,
        this._motionFwV,
        this._forwardY!,
        this._forwardCr!,
        this._forwardCb!
      );
    }

    // decode blocks
    const cbp =
      (this._macroblockType & 0x02) !== 0
        ? this.readHuffman(CODE_BLOCK_PATTERN, reader)
        : this._macroblockIntra
        ? 0x3f
        : 0;
    for (let block = 0, mask = 0x20; block < 6; block++) {
      if ((cbp & mask) !== 0) {
        this.decodeBlock(block, reader);
      }
      mask >>= 1;
    }
  }

  // motion vectors
  private decodeMotionVectors(reader: BitReader) {
    let code: number;
    let d: number;
    let r: number = 0;

    // motion forward
    if (this._macroblockMotFw) {
      //  horizental forward
      code = this.readHuffman(MOTION, reader);
      if (code !== 0 && this._forwardF !== 1) {
        r = reader.read(this._forwardRSize);
        d = ((Math.abs(code) - 1) << this._forwardRSize) + r + 1;
        if (code < 0) {
          d = -d;
        }
      } else {
        d = code;
      }

      this._motionFwHPrev += d;
      if (this._motionFwHPrev > (this._forwardF << 4) - 1) {
        this._motionFwHPrev -= this._forwardF << 5;
      } else if (this._motionFwHPrev < -this._forwardF << 4) {
        this._motionFwHPrev += this._forwardF << 5;
      }

      this._motionFwH = this._motionFwHPrev;
      if (this._fullPelForward) {
        this._motionFwH <<= 1;
      }

      // vertical forward
      code = this.readHuffman(MOTION, reader);
      if (code !== 0 && this._forwardF !== 1) {
        r = reader.read(this._forwardRSize);
        d = ((Math.abs(code) - 1) << this._forwardRSize) + r + 1;
        if (code < 0) {
          d = -d;
        }
      } else {
        d = code;
      }

      this._motionFwVPrev += d;
      if (this._motionFwVPrev > (this._forwardF << 4) - 1) {
        this._motionFwVPrev -= this._forwardF << 5;
      } else if (this._motionFwVPrev < -this._forwardF << 4) {
        this._motionFwVPrev += this._forwardF << 5;
      }

      this._motionFwV = this._motionFwVPrev;
      if (this._fullPelForward) {
        this._motionFwV <<= 1;
      }
    } else if (this._pictureType === PICTURE_TYPE.PREDICTIVE) {
      // no motion information in p frame, reset vectors
      this.resetMotionVectors();
    }
  }

  // block layer
  private decodeBlock(block: number, reader: BitReader) {
    let n: number = 0;
    let quantMatrix: Uint8Array | undefined;

    // decode dc coefficient of intra-coded blocks
    if (this._macroblockIntra) {
      let predictor: number;
      let dctSize: number;

      // dc prediction, pixel space
      if (block < 4) {
        predictor = this._dcPredictorY;
        dctSize = this.readHuffman(DCT_DC_SIZE_LUMINANCE, reader);
      } else {
        predictor = block === 4 ? this._dcPredictorCr : this._dcPredictorCb;
        dctSize = this.readHuffman(DCT_DC_SIZE_CHROMINANCE, reader);
      }

      // read dc coeff
      if (dctSize > 0) {
        const differential = reader.read(dctSize);
        if ((differential & (1 << (dctSize - 1))) !== 0) {
          this._blockData[0] = predictor + differential;
        } else {
          this._blockData[0] =
            predictor + ((-1 << dctSize) | (differential + 1));
        }
      } else {
        this._blockData[0] = predictor;
      }

      // save predictor value
      if (block < 4) {
        this._dcPredictorY = this._blockData[0];
      } else if (block === 4) {
        this._dcPredictorCr = this._blockData[0];
      } else {
        this._dcPredictorCb = this._blockData[0];
      }

      // dequantize + premultiply
      this._blockData[0] <<= 3 + 5;
      quantMatrix = this._intraQuantMatrix;
      n = 1;
    } else {
      quantMatrix = this._nonIntraQuantMatrix;
    }

    // decode ac coefficients (+ dc for non-intra)
    let level = 0;
    while (true) {
      let run: number = 0;
      const coeff = this.readHuffman(DCT_COEFF, reader);

      if (coeff === 0x0001 && n > 0 && reader.read(1) === 0) {
        // end block
        break;
      }

      if (coeff === 0xffff) {
        // escape
        run = reader.read(6);
        level = reader.read(8);
        if (level === 0) {
          level = reader.read(8);
        } else if (level === 128) {
          level = reader.read(8) - 256;
        } else if (level > 128) {
          level = level - 256;
        }
      } else {
        run = coeff >> 8;
        level = coeff & 0xff;
        if (reader.read(1)) {
          level = -level;
        }
      }

      n += run;
      const dezigZagged = ZIG_ZAG[n];
      n++;

      // dequantize, oddify, clip
      level <<= 1;
      if (!this._macroblockIntra) {
        level += level < 0 ? -1 : 1;
      }
      level = (level * this._quantizerScale * quantMatrix![dezigZagged]) >> 4;
      if ((level & 1) === 0) {
        level -= level > 0 ? 1 : -1;
      }
      if (level > 2047) {
        level = 2047;
      } else if (level < -2048) {
        level = -2048;
      }

      // save premultiplied coefficient
      this._blockData[dezigZagged] = level * PREMULTIPLIER_MATRIX[dezigZagged];
    }

    // move block to it's place
    let destArray: Uint8ClampedArray;
    let destIndex: number;
    let scan: number;

    if (block < 4) {
      destArray = this._currentY!;
      scan = this._codedWidth - 8;
      destIndex = (this._mbRow * this._codedWidth + this._mbCol) << 4;
      if ((block & 1) !== 0) {
        destIndex += 8;
      }
      if ((block & 2) !== 0) {
        destIndex += this._codedWidth << 3;
      }
    } else {
      destArray = block === 4 ? this._currentCb! : this._currentCr!;
      scan = (this._codedWidth >> 1) - 8;
      destIndex = ((this._mbRow * this._codedWidth) << 2) + (this._mbCol << 3);
    }

    if (this._macroblockIntra) {
      // overwrite (no prediction)
      if (n === 1) {
        this.copyValueToDestination(
          (this._blockData[0] + 128) >> 8,
          destArray,
          destIndex,
          scan
        );
        this._blockData[0] = 0;
      } else {
        this.idct(this._blockData);
        this.copyBlockToDestination(
          this._blockData,
          destArray,
          destIndex,
          scan
        );
        this._blockData.fill(0);
      }
    } else {
      // add data to the predicted macroblock
      if (n === 1) {
        this.addValueToDestination(
          (this._blockData[0] + 128) >> 8,
          destArray,
          destIndex,
          scan
        );
        this._blockData[0] = 0;
      } else {
        this.idct(this._blockData);
        this.addBlockToDestination(this._blockData, destArray, destIndex, scan);
        this._blockData.fill(0);
      }
    }

    n = 0;
  }

  // helpers
  private createPacketReader(packet: Packet): BitReader {
    const totalLength = packet.buffers.reduce(
      (ret, buf) => (ret += buf.byteLength),
      0
    );
    const stream = new MemoryStream(totalLength);
    stream.write(packet.buffers);
    return stream.readBit();
  }

  private initBuffers(): void {
    this._intraQuantMatrix = DEFAULT_INTRA_QUANT_MATRIX;
    this._nonIntraQuantMatrix = DEFAULT_NON_INTRA_QUANT_MATRIX;

    this._mbWidth = (this._width + 15) >> 4;
    this._mbHeight = (this._height + 15) >> 4;
    this._mbSize = this._mbWidth * this._mbHeight;

    this._codedWidth = this._mbWidth << 4;
    this._codedHeight = this._mbHeight << 4;
    this._codedSize = this._codedWidth * this._codedHeight;

    this._halfWidth = this._mbWidth << 3;
    this._halfHeight = this._mbHeight << 3;

    // Allocated buffers and resize canvas
    this._currentY = new Uint8ClampedArray(this._codedSize);
    this._currentY32 = new Uint32Array(this._currentY.buffer);

    this._currentCr = new Uint8ClampedArray(this._codedSize >> 2);
    this._currentCr32 = new Uint32Array(this._currentCr.buffer);

    this._currentCb = new Uint8ClampedArray(this._codedSize >> 2);
    this._currentCb32 = new Uint32Array(this._currentCb.buffer);

    this._forwardY = new Uint8ClampedArray(this._codedSize);
    this._forwardY32 = new Uint32Array(this._forwardY.buffer);

    this._forwardCr = new Uint8ClampedArray(this._codedSize >> 2);
    this._forwardCr32 = new Uint32Array(this._forwardCr.buffer);

    this._forwardCb = new Uint8ClampedArray(this._codedSize >> 2);
    this._forwardCb32 = new Uint32Array(this._forwardCb.buffer);
  }

  private rotatePredictionPointers(): void {
    const tmpY = this._forwardY;
    const tmpY32 = this._forwardY32;
    const tmpCr = this._forwardCr;
    const tmpCr32 = this._forwardCr32;
    const tmpCb = this._forwardCb;
    const tmpCb32 = this._forwardCb32;

    this._forwardY = this._currentY;
    this._forwardY32 = this._currentY32;
    this._forwardCr = this._currentCr;
    this._forwardCr32 = this._currentCr32;
    this._forwardCb = this._currentCb;
    this._forwardCb32 = this._currentCb32;

    this._currentY = tmpY;
    this._currentY32 = tmpY32;
    this._currentCr = tmpCr;
    this._currentCr32 = tmpCr32;
    this._currentCb = tmpCb;
    this._currentCb32 = tmpCb32;
  }

  private resetMotionVectors(): void {
    this._motionFwH = this._motionFwHPrev = 0;
    this._motionFwV = this._motionFwVPrev = 0;
  }

  private resetDcPredictors(): void {
    this._dcPredictorY = 128;
    this._dcPredictorCr = 128;
    this._dcPredictorCb = 128;
  }

  private readHuffman(
    codeTable: Uint8Array | Int8Array | Int16Array | Int32Array,
    reader: BitReader
  ): number {
    let state = 0;
    do {
      state = codeTable[state + reader.read(1)];
    } while (state >= 0 && codeTable[state] !== 0);

    return codeTable[state + 2];
  }

  private copyMacroblock(
    motionH: number,
    motionV: number,
    sY: Uint8ClampedArray,
    sCr: Uint8ClampedArray,
    sCb: Uint8ClampedArray
  ): void {
    let width: number;
    let scan: number;
    let H: number;
    let V: number;
    let oddH: boolean;
    let oddV: boolean;
    let src: number;
    let dest: number;
    let last: number;

    // We use 32bit writes here
    const dY = this._currentY32!,
      dCb = this._currentCb32!,
      dCr = this._currentCr32!;

    // Luminance
    width = this._codedWidth;
    scan = width - 16;

    H = motionH >> 1;
    V = motionV >> 1;
    oddH = (motionH & 1) === 1;
    oddV = (motionV & 1) === 1;

    src = ((this._mbRow << 4) + V) * width + (this._mbCol << 4) + H;
    dest = (this._mbRow * width + this._mbCol) << 2;
    last = dest + (width << 2);

    let x: number;
    let y1: number;
    let y2: number;
    let y: number;
    if (oddH) {
      if (oddV) {
        while (dest < last) {
          y1 = sY[src] + sY[src + width];
          src++;
          for (x = 0; x < 4; x++) {
            y2 = sY[src] + sY[src + width];
            src++;
            y = ((y1 + y2 + 2) >> 2) & 0xff;

            y1 = sY[src] + sY[src + width];
            src++;
            y |= ((y1 + y2 + 2) << 6) & 0xff00;

            y2 = sY[src] + sY[src + width];
            src++;
            y |= ((y1 + y2 + 2) << 14) & 0xff0000;

            y1 = sY[src] + sY[src + width];
            src++;
            y |= ((y1 + y2 + 2) << 22) & 0xff000000;

            dY[dest++] = y;
          }
          dest += scan >> 2;
          src += scan - 1;
        }
      } else {
        while (dest < last) {
          y1 = sY[src++];
          for (x = 0; x < 4; x++) {
            y2 = sY[src++];
            y = ((y1 + y2 + 1) >> 1) & 0xff;

            y1 = sY[src++];
            y |= ((y1 + y2 + 1) << 7) & 0xff00;

            y2 = sY[src++];
            y |= ((y1 + y2 + 1) << 15) & 0xff0000;

            y1 = sY[src++];
            y |= ((y1 + y2 + 1) << 23) & 0xff000000;

            dY[dest++] = y;
          }
          dest += scan >> 2;
          src += scan - 1;
        }
      }
    } else {
      if (oddV) {
        while (dest < last) {
          for (x = 0; x < 4; x++) {
            y = ((sY[src] + sY[src + width] + 1) >> 1) & 0xff;
            src++;
            y |= ((sY[src] + sY[src + width] + 1) << 7) & 0xff00;
            src++;
            y |= ((sY[src] + sY[src + width] + 1) << 15) & 0xff0000;
            src++;
            y |= ((sY[src] + sY[src + width] + 1) << 23) & 0xff000000;
            src++;

            dY[dest++] = y;
          }
          dest += scan >> 2;
          src += scan;
        }
      } else {
        while (dest < last) {
          for (x = 0; x < 4; x++) {
            y = sY[src];
            src++;
            y |= sY[src] << 8;
            src++;
            y |= sY[src] << 16;
            src++;
            y |= sY[src] << 24;
            src++;

            dY[dest++] = y;
          }
          dest += scan >> 2;
          src += scan;
        }
      }
    }

    // Chrominance

    width = this._halfWidth;
    scan = width - 8;

    H = (motionH / 2) >> 1;
    V = (motionV / 2) >> 1;
    oddH = ((motionH / 2) & 1) === 1;
    oddV = ((motionV / 2) & 1) === 1;

    src = ((this._mbRow << 3) + V) * width + (this._mbCol << 3) + H;
    dest = (this._mbRow * width + this._mbCol) << 1;
    last = dest + (width << 1);

    let cr1: number;
    let cr2: number;
    let cr: number;
    let cb1: number;
    let cb2: number;
    let cb: number;
    if (oddH) {
      if (oddV) {
        while (dest < last) {
          cr1 = sCr[src] + sCr[src + width];
          cb1 = sCb[src] + sCb[src + width];
          src++;
          for (x = 0; x < 2; x++) {
            cr2 = sCr[src] + sCr[src + width];
            cb2 = sCb[src] + sCb[src + width];
            src++;
            cr = ((cr1 + cr2 + 2) >> 2) & 0xff;
            cb = ((cb1 + cb2 + 2) >> 2) & 0xff;

            cr1 = sCr[src] + sCr[src + width];
            cb1 = sCb[src] + sCb[src + width];
            src++;
            cr |= ((cr1 + cr2 + 2) << 6) & 0xff00;
            cb |= ((cb1 + cb2 + 2) << 6) & 0xff00;

            cr2 = sCr[src] + sCr[src + width];
            cb2 = sCb[src] + sCb[src + width];
            src++;
            cr |= ((cr1 + cr2 + 2) << 14) & 0xff0000;
            cb |= ((cb1 + cb2 + 2) << 14) & 0xff0000;

            cr1 = sCr[src] + sCr[src + width];
            cb1 = sCb[src] + sCb[src + width];
            src++;
            cr |= ((cr1 + cr2 + 2) << 22) & 0xff000000;
            cb |= ((cb1 + cb2 + 2) << 22) & 0xff000000;

            dCr[dest] = cr;
            dCb[dest] = cb;
            dest++;
          }
          dest += scan >> 2;
          src += scan - 1;
        }
      } else {
        while (dest < last) {
          cr1 = sCr[src];
          cb1 = sCb[src];
          src++;
          for (x = 0; x < 2; x++) {
            cr2 = sCr[src];
            cb2 = sCb[src++];
            cr = ((cr1 + cr2 + 1) >> 1) & 0xff;
            cb = ((cb1 + cb2 + 1) >> 1) & 0xff;

            cr1 = sCr[src];
            cb1 = sCb[src++];
            cr |= ((cr1 + cr2 + 1) << 7) & 0xff00;
            cb |= ((cb1 + cb2 + 1) << 7) & 0xff00;

            cr2 = sCr[src];
            cb2 = sCb[src++];
            cr |= ((cr1 + cr2 + 1) << 15) & 0xff0000;
            cb |= ((cb1 + cb2 + 1) << 15) & 0xff0000;

            cr1 = sCr[src];
            cb1 = sCb[src++];
            cr |= ((cr1 + cr2 + 1) << 23) & 0xff000000;
            cb |= ((cb1 + cb2 + 1) << 23) & 0xff000000;

            dCr[dest] = cr;
            dCb[dest] = cb;
            dest++;
          }
          dest += scan >> 2;
          src += scan - 1;
        }
      }
    } else {
      if (oddV) {
        while (dest < last) {
          for (x = 0; x < 2; x++) {
            cr = ((sCr[src] + sCr[src + width] + 1) >> 1) & 0xff;
            cb = ((sCb[src] + sCb[src + width] + 1) >> 1) & 0xff;
            src++;

            cr |= ((sCr[src] + sCr[src + width] + 1) << 7) & 0xff00;
            cb |= ((sCb[src] + sCb[src + width] + 1) << 7) & 0xff00;
            src++;

            cr |= ((sCr[src] + sCr[src + width] + 1) << 15) & 0xff0000;
            cb |= ((sCb[src] + sCb[src + width] + 1) << 15) & 0xff0000;
            src++;

            cr |= ((sCr[src] + sCr[src + width] + 1) << 23) & 0xff000000;
            cb |= ((sCb[src] + sCb[src + width] + 1) << 23) & 0xff000000;
            src++;

            dCr[dest] = cr;
            dCb[dest] = cb;
            dest++;
          }
          dest += scan >> 2;
          src += scan;
        }
      } else {
        while (dest < last) {
          for (x = 0; x < 2; x++) {
            cr = sCr[src];
            cb = sCb[src];
            src++;

            cr |= sCr[src] << 8;
            cb |= sCb[src] << 8;
            src++;

            cr |= sCr[src] << 16;
            cb |= sCb[src] << 16;
            src++;

            cr |= sCr[src] << 24;
            cb |= sCb[src] << 24;
            src++;

            dCr[dest] = cr;
            dCb[dest] = cb;
            dest++;
          }
          dest += scan >> 2;
          src += scan;
        }
      }
    }
  }
  private copyValueToDestination(
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

  private idct(block: Int32Array): void {
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

  private copyBlockToDestination(
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

  private addValueToDestination(
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

  private addBlockToDestination(
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
}
