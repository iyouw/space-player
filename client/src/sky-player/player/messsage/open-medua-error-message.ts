import { ChannelMessage } from "@/sky-player/channel/channel-message";
import type { IMedia } from "../i-media";

export class OpenMediaErrorMessage extends ChannelMessage<IMedia> {
  public static readonly Type = `OPEN_MEDIA_ERROR`;

  public constructor(data: IMedia) {
    super(OpenMediaErrorMessage.Type, data);
  }
}
