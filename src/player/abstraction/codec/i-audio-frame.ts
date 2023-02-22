import type { IChannelLayout } from "./i-channel-layout";
import type { IFrame } from "./i-frame";
import type { SampleFormat } from "./sample-format";

export interface IAudioFrame extends IFrame {
  samples: number;
  sampleFormat: SampleFormat;
  sampleRate: number;
  channelLayout: IChannelLayout;
}
