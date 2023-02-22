export interface IFrame {
  isKeyFrame: boolean;
  isInterlacedFrame: boolean;
  isTopFieldFirst: boolean;
  pts: number;
  dts: number;
  duration: number;
  quality: number;
  data: Array<Uint8Array>;
}
