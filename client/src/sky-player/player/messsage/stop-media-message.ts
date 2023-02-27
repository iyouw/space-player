import { ChannelMessage } from "@/sky-player/channel/channel-message";
import type { IMedia } from "../i-media";

export class StopMediaMessage extends ChannelMessage<IMedia> {
  public static readonly Type = `STOP_MEDIA`;

  public constructor(data: IMedia) {
    super(StopMediaMessage.Type, data);
  }
}