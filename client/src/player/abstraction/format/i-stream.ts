import type { IPacket } from "../codec/i-packet";

export interface IStream {
  id: number;
  type: number;
  isVideo: boolean;
  isAudio: boolean;
  isSubtitle: boolean;
  packet?: IPacket;
}
