import { ChannelMessage } from "@/sky-player/channel/channel-message";
import type { IMedia } from "../i-media";

export class OpenMediaMessage extends ChannelMessage<IMedia> {
  public static readonly Type = `OPEN_MEDIA`;

  public constructor(data: IMedia) {
    super(OpenMediaMessage.Type, data);
  }
}
