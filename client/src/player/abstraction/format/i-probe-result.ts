import type { IDemuxer } from "./i-demuxer";

export interface IProbeResult {
  needMoreData?: boolean;
  match?: boolean;
  demuxer?: IDemuxer;
}
