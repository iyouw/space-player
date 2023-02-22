import type { IEventTarget } from "../event/i-event-target";
import type { ISourceEventMap } from "./event/i-source-event-map";
import type { ISourceOption } from "./i-source-option";

export interface ISource extends IEventTarget {
  canConnect(url: string): boolean;
  open(url: string, option?: ISourceOption): void;
  close(): void;
}
