export interface IPacket {
  data: Array<Uint8Array>;
  pts: number;
  dts: number;
  duration: number;
}
