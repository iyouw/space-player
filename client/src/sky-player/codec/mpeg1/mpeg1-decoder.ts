import type { Packet } from "@/sky-player/format/packet";
import type { IDecoder } from "../i-decoder";
import { Frame } from '../frame'
import { MemoryStream } from "@/sky-player/stream/memory-stream";
import type { BitReader } from "@/sky-player/stream/bit-reader";
import { DEFAULT_INTRA_QUANT_MATRIX, DEFAULT_NON_INTRA_QUANT_MATRIX, PICTURE_RATE, START, ZIG_ZAG } from "./constants";

export class Mpeg1Decoder implements IDecoder {
  private _customIntraQuantMatrix: Uint8Array = new Uint8Array(64);

  private _customNonIntraQuantMatrix: Uint8Array = new Uint8Array(64);

  private _blockData: Int32Array = new Int32Array(64);

  private _intraQuantMatrix?: Uint8Array;

  private _nonIntraQuantMatrix?: Uint8Array;

  private _currentFrame: number = 0;

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


  public decode(packet: Packet): Frame {
    const res = new Frame(packet.pts, packet.codecId);
    const stream = new MemoryStream();
    stream.write(packet.buffers);
    const reader = stream.readBit(stream.length << 3);
    this.decodeSequenceLayer(reader);
    this.decodePicture(reader);
    return res;
  }

  private decodeSequenceLayer(reader: BitReader): void {
    if (this._hasSequenceHeader) return;
    if (reader.findStartCode(START.SEQUENCE) === -1) return;
    this.decodeSequenceHeader(reader);
  }

  private decodeSequenceHeader(reader: BitReader): void {
    const newWidth = reader.read(12)!;
    const newHeight = reader.read(12)!;
    // skip pixel aspect ratio
    reader.skip(4);
    // get frame rate
    this._frameRate = PICTURE_RATE[reader.read(4)!];
    // skip bit_rate, marker, buffer_size and constrained bit
    reader.skip(18 + 1 + 10 + 1);

    // size change
    if (this._width !== newWidth || this._height !== newHeight) {
      this._width = newWidth;
      this._height = newHeight;
      this.initBuffers();
    }

    // load custom intra quant matrix
    if (reader.read(1)!) {
      for (let i= 0; i < 64; i++) {
        this._customIntraQuantMatrix[ZIG_ZAG[i]] = reader.read(8)!;
      }
      this._intraQuantMatrix = this._customIntraQuantMatrix;
    }

    // load custom non intra quant matrix
    if (reader.read(1)!) {
      for (let i = 0; i < 64; i++) {
        this._customNonIntraQuantMatrix[ZIG_ZAG[i]] = reader.read(8)!;
      }
      this._nonIntraQuantMatrix = this._customNonIntraQuantMatrix;
    }

    this._hasSequenceHeader = true;
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

  private decodePicture(reader: BitReader): void {

  }
}