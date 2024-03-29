import type { AVCodecID } from "./codec-id";

export interface IFrame {
  pts: number;
  codecId: AVCodecID;
  width: number;
  height: number;
  bitrate: number;
  sampleRate: number;
  frameSize: number;
}
