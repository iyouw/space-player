import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class RenderSubtitleMessage extends ChannelMessage {
  public static readonly Type = `RENDER_SUBTITLE`;

  public constructor(data: unknown) {
    super(RenderSubtitleMessage.Type, data);
  }
}
