export class ChannelMessage<Data = unknown> {
  public readonly type: string;
  public readonly data: Data;

  public constructor(type: string, data: Data) {
    this.type = type;
    this.data = data;
  }
}
