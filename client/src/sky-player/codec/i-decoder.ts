import type { Packet } from "../format/packet";
import type { Handler } from "../typings/func";
import type { IFrame } from "./i-frame";

export interface IDecoder {
  decode(packet: Packet): void;
  onFrameCompleted?: Handler<IFrame>;
}
