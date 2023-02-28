import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class FormatMediaMessage extends ChannelMessage<ArrayBuffer> {
  public static readonly Type = `FORMAT_MEDIA`;

  public constructor(data: ArrayBuffer) {
    super(FormatMediaMessage.Type, data);
  }
}
