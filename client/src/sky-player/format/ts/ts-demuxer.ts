import { DemuxerBase } from "../demuxer-base";
import type { IDemuxer } from "../i-demuxer";

export class TSDemuxer extends DemuxerBase implements IDemuxer {
  public override demux(): void {
    while (this._stream.has(188 >> 3)) {
      this.parsePacket();
    }
  }

  private parsePacket(): void {

  }
}
