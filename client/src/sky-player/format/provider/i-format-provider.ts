import type { MemoryStream } from "@/sky-player/stream/memory-stream";
import type { IDemuxer } from "../i-demuxer";
import type { ProbeResult } from "./probe-result";

export interface IFormatProvider {
  is(format: string): boolean;
  probe(stream: MemoryStream): ProbeResult;
  createDemuxer(stream: MemoryStream): IDemuxer;
}
