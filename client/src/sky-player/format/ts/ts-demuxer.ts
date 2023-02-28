import { DemuxerBase } from "../demuxer-base";
import type { IDemuxer } from "../i-demuxer";

export class TSDemuxer extends DemuxerBase implements IDemuxer {
  public override open(): void {}

  public override demux(): void {}
}
