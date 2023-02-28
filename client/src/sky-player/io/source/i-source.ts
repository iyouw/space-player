import type { Handler } from "@/sky-player/typings/func";

export interface ISource {
  open(): void;
  close(): void;
  onReceivedData?: Handler<ArrayBuffer>;
}
