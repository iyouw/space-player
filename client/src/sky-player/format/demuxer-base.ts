import type { MemoryStream } from "@/sky-player/stream/memory-stream";
import type { Handler } from "@/sky-player/typings/func";
import type { Packet } from "./packet";

export abstract class DemuxerBase {
  protected _stream: MemoryStream;

  protected _option?: unknown;

  public onAudioPacketCompleted?: Handler<Packet>;
  public onSubtitlePacketCompleted?: Handler<Packet>;
  public onVideoPacketCompleted?: Handler<Packet>;

  public constructor(stream: MemoryStream, option?: unknown) {
    this._stream = stream;
    this._option = option;
  }

  public abstract demux(): void;

  public dispose(): void {
    this.onAudioPacketCompleted = undefined;
    this.onSubtitlePacketCompleted = undefined;
    this.onVideoPacketCompleted = undefined;
  }
}
