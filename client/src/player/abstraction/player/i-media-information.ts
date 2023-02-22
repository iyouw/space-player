import type { CodecType } from "../codec/codec-type";
import type { MediaFormat } from "../format/media-format";

export interface IMediaInformation {
  url: string;
  format: MediaFormat;
  audioCodec: CodecType;
  videoCodec: CodecType;
}
