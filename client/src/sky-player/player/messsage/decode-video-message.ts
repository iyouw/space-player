import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class DecodeVideoMessage extends ChannelMessage {
  public static readonly Type = `DECODE_VIDEO`;

  public constructor(data: unknown) {
    super(DecodeVideoMessage.Type, data);
  }
}
