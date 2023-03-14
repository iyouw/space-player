import type { Handler } from "@/sky-player/typings/func";
import type { Packet } from "./packet";

export interface IDemuxer {
  demux(): void;
  onVideoPacketCompleted?: Handler<Packet>;
  onAudioPacketCompleted?: Handler<Packet>;
  onSubtitlePacketCompleted?: Handler<Packet>;
  dispose(): void;
}
