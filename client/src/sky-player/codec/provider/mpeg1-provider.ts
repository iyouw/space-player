import { AVCodecID } from "../codec-id";
import type { IDecoder } from "../i-decoder";
import { Mpeg1Decoder } from "../mpeg1/mpeg1-decoder";
import type { ICodecProvider } from "./i-codec-provider";

export class Mpeg1Provider implements ICodecProvider {
  public is(codecId: AVCodecID): boolean {
    return codecId === AVCodecID.AV_CODEC_ID_MPEG2VIDEO;
  }

  public createDecoder(): IDecoder {
    return new Mpeg1Decoder();
  }
}