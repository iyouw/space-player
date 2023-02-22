import type { IEvent } from "../../event/i-event";

export interface IDataArriveledEvent extends IEvent {
  data: ArrayBuffer;
}
