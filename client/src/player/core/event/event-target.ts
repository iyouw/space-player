import type {
  IEvent,
  IEventListener,
  IEventListenerOption,
  IEventTarget,
} from "@/player/abstraction";

export class EventTarget implements IEventTarget {
  private _eventMap: Map<string, Array<IEventListener>>;

  public constructor() {
    this._eventMap = new Map<string, Array<IEventListener>>();
  }

  public addEventListener<T extends IEvent = IEvent>(
    type: string,
    listener: IEventListener,
    option?: IEventListenerOption | undefined
  ): void {
    listener.option = option;
    const listeners = this._eventMap.get(type);
    if (listeners) {
      if (listeners.some((x) => x === listener)) listeners.push(listener);
    } else {
      this._eventMap.set(type, [listener]);
    }
  }

  public removeEventListener(
    type: string,
    listener?: IEventListener | undefined
  ): void {
    if (!listener) {
      this._eventMap.delete(type);
      return;
    }
    const listeners = this._eventMap.get(type);
    if (listeners) {
      const index = listeners.findIndex((x) => x === listener);
      if (index !== -1) listeners.splice(index, 1);
    }
  }

  public dispatchEvent(event: IEvent): void {
    const { type } = event;
    const listeners = this._eventMap.get(type);
    if (!listeners) return;
    listeners.forEach((listen) => listen(event));
    this._eventMap.set(
      type,
      listeners.filter((x) => !x.option?.once)
    );
  }
}
