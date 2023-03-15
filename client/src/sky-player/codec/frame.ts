import { AVCodecID } from "./codec-id";
import type { IFrame } from "./i-frame";

export class Frame implements IFrame {
  public pts: number;
  public codecId: AVCodecID;
  public width: number;
  public height: number;

  public constructor(
    pts: number = 0,
    codecId: AVCodecID = AVCodecID.AV_CODEC_ID_NONE,
    width: number = 0,
    height: number = 0
  ) {
    this.pts = pts;
    this.codecId =codecId;
    this.width = width;
    this.height = height;
  }
}