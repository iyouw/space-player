import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class DecodeSubtitleMessage extends ChannelMessage {
  public static readonly Type = `DECODE_SUBTITLE`;

  public constructor(data: unknown) {
    super(DecodeSubtitleMessage.Type, data);
  }
}
