import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class RenderVideoMessage extends ChannelMessage {
  public static readonly Type = `RENDER_VIDEO`;

  public constructor(data: unknown) {
    super(RenderVideoMessage.Type, data);
  }
}
