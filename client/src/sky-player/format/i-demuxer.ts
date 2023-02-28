import type { Handler } from "@/sky-player/typings/func";
import type { Packet } from "./packet";

export interface IDemuxer {
  open(): void;
  close(): void;
  demux(): void;
  onVideoPacketCompleted?: Handler<Packet>;
  onAudioPacketCompleted?: Handler<Packet>;
  onSubtitlePacketCompleted?: Handler<Packet>;
}
