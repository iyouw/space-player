import { ChannelMessage } from "@/sky-player/channel/channel-message";
import type { IMedia } from "../i-media";

export class PlayMediaMessage extends ChannelMessage<IMedia> {
  public static readonly Type = `PLAY_MEDIA`;

  public constructor(data: IMedia) {
    super(PlayMediaMessage.Type, data);
  }
}
