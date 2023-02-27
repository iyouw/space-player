import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class DecodeAudioMessage extends ChannelMessage {
  public static readonly Type = `DECODE_AUDIO`;

  public constructor(data: unknown) {
    super(DecodeAudioMessage.Type, data);
  }
}
