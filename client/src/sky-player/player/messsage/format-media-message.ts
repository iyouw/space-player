import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class FormatMediaMessage extends ChannelMessage {
  public static readonly Type = `FORMAT_MEDIA`;

  public constructor(data: unknown) {
    super(FormatMediaMessage.Type, data);
  }
}
