import type { IEventListenerOption } from "./i-add-event-listener-option";
import type { IEvent } from "./i-event";

export interface IEventListener {
  (event: IEvent): void;
  option?: IEventListenerOption;
}
