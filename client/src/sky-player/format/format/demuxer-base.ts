import type { MemoryStream } from "@/sky-player/stream/memory-stream";
import type { Handler } from "@/sky-player/typings/func";
import type { Packet } from "../packet";

export abstract class DemuxerBase {
  protected _stream: MemoryStream;

  protected _option?: unknown;

  public onVideoPacketCompleted?: Handler<Packet>;
  public onAudioPacketCompleted?: Handler<Packet>;
  public onSubtitlePacketCompleted?: Handler<Packet>;

  public constructor(stream: MemoryStream, option?: unknown) {
    this._stream = stream;
    this._option = option;
  }

  public abstract open(): void;

  public abstract demux(): void;

  public close(): void {
    this.onVideoPacketCompleted = undefined;
  }
}
