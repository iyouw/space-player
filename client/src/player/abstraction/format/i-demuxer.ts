import type { BitBuffer } from "@/player/core/buffer/bit-buffer";
import type { IProbeResult } from "./i-probe-result";

export interface IDemuxer {
  probe(buffer: BitBuffer): IProbeResult;
  demux(buffer: BitBuffer): void;
}
