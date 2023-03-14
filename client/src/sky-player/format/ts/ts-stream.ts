import type { AVCodecID } from "@/sky-player/codec/codec-id";
import { Stream } from "../stream";
import { VIDEO_TYPES, AUDIO_TYPES } from "./constants";

export class TSStream extends Stream {
  public constructor(id: number = 0, type: number = 0) {
    super(id, type);
  }

  public override get isVideo(): boolean {
    return VIDEO_TYPES.some((x) => x === this.type);
  }

  public override get isAudio(): boolean {
    return AUDIO_TYPES.some((x) => x === this.type);
  }

  public override get isSubtitle(): boolean {
    return false;
  }

  public override get codecType(): AVCodecID {
    return this.type;
  }
}