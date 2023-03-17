import type { Packet } from "../format/packet";
import type { Handler } from "../typings/func";
import type { Frame } from "./frame";
import type { IFrame } from "./i-frame";

export interface IDecoder {
  decode(packet: Packet): IFrame | undefined;
  onFrameCompleted?: Handler<Frame>;
}
