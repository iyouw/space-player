import type { IEventMap } from "../../event/i-event-map";
import type { IDataArriveledEvent } from "./i-data-arriveled-event";

export interface ISourceEventMap extends IEventMap {
  dataarriveled: IDataArriveledEvent;
}
