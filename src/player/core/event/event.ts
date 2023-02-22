import type { IEvent } from "@/player/abstraction";

export class Event implements IEvent {
  public readonly type: string;

  public constructor(type: string) {
    this.type = type;
  }
}
