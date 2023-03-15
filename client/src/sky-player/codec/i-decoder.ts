import type { Packet } from "../format/packet";
import type { IFrame } from "./i-frame";

export interface IDecoder {
  decode(packet: Packet): IFrame;
}