import { ChannelMessage } from "@/sky-player/channel/channel-message";
import type { IMedia } from "../i-media";

export class PauseMediaMessage extends ChannelMessage<IMedia> {
  public static readonly Type = `PAUSE_MEDIA`;

  public constructor(data: IMedia) {
    super(PauseMediaMessage.Type, data);
  }
}