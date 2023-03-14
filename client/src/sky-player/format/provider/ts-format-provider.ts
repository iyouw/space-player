import type { MemoryStream } from "@/sky-player/stream/memory-stream";
import type { IDemuxer } from "../i-demuxer";
import { TSDemuxer } from "../ts/ts-demuxer";
import type { IFormatProvider } from "./i-format-provider";
import { ProbeResult } from "./probe-result";

export class TSFormatProvider implements IFormatProvider {
  public is(format: string): boolean {
    return format.endsWith(`.ts`);
  }

  public probe(stream: MemoryStream): ProbeResult {
    const packetSize = 188;
    if (!stream.has(packetSize * 3)) return ProbeResult.NeedData();
    const startCode = 0x47;
    for (let i = 0; i < 188; i++) {
      if (
        stream.get(i) === startCode &&
        stream.get(i + packetSize) === startCode &&
        stream.get(i + packetSize * 2) === startCode
      ) {
        return ProbeResult.Success(this);
      }
    }
    return ProbeResult.Fail();
  }

  public createDemuxer(stream: MemoryStream, option?: unknown): IDemuxer {
    return new TSDemuxer(stream, option);
  }
}
