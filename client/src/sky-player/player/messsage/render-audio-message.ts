import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class RenderAudioMessage extends ChannelMessage {
  public static readonly Type = `RENDER_AUDIO`;

  public constructor(data: unknown) {
    super(RenderAudioMessage.Type, data);
  }
}
