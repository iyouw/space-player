import type { IEventListenerOption } from "./i-add-event-listener-option";
import type { IEvent } from "./i-event";
import type { IEventListener } from "./i-event-listener";

export interface IEventTarget {
  addEventListener(
    type: string,
    listenner: IEventListener,
    option?: IEventListenerOption
  ): void;
  removeEventListener(type: string, listenner?: IEventListener): void;
  dispatchEvent(event: IEvent): void;
}
