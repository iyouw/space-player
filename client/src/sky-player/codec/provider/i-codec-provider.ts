import type { AVCodecID } from "../codec-id";
import type { IDecoder } from "../i-decoder";

export interface ICodecProvider {
  is(codecId: AVCodecID): boolean;
  createDecoder(): IDecoder;
}
