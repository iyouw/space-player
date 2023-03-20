import type { Packet } from "@/sky-player/format/packet";
import type { Handler } from "@/sky-player/typings/func";
import { Frame } from "../frame";
import type { IDecoder } from "../i-decoder";
import type { IFrame } from "../i-frame";

export class Mp2Decoder implements IDecoder {
  public onFrameCompleted?: Handler<Frame>;

  public decode(packet: Packet): IFrame | undefined {
    const res = new Frame(packet.pts, packet.codecId);

    return res;
  }
}
