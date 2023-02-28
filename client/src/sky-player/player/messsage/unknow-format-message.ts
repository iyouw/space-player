import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class UnknowFormatMessage extends ChannelMessage<string> {
  public static readonly Type = `UNKNOW_FORMAT`;

  public constructor(data: string = ``) {
    super(UnknowFormatMessage.Type, data);
  }
}
