import { Event } from "../../event/event";

export class DataArriveledEvent extends Event {
  public static readonly Type = `dataarriveled`;

  public readonly data: ArrayBuffer;

  public constructor(data: ArrayBuffer) {
    super(DataArriveledEvent.Type);

    this.data = data;
  }
}
