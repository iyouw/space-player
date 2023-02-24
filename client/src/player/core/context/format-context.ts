import type { IDemuxer } from "@/player/abstraction";
import { BitBuffer } from "../buffer/bit-buffer";
import { FormatContainer } from "../format/format-container";

export class FormatContext {
  private _formatContainer: FormatContainer;

  private _buffer: BitBuffer;

  private _demuxer?: IDemuxer;

  private _notSupportedFormat: boolean;

  public constructor() {
    this._formatContainer = FormatContainer.Default;
    this._buffer = new BitBuffer();
    this._notSupportedFormat = false;
  }

  public appendData(data: ArrayBuffer): void {
    if (this._notSupportedFormat) return;
    this._buffer.appendBuffer(data);
    if (!this._demuxer) {
      const res = this._formatContainer.probe(this._buffer);
      if (res.needMoreData) return;
      if (!res.match) {
        this._notSupportedFormat = true;
        return;
      } else {
        this._demuxer = res.demuxer;
      }
    }
    this._demuxer!.demux(this._buffer);
  }
}
