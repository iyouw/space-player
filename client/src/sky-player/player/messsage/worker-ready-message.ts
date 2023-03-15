import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class WorkerReadyMessage extends ChannelMessage<number> {
  public static readonly Type = `WORKER_READY`;

  public static readonly IOFlag = 1;

  public static readonly FormatFlag = 1 << 1;

  public static readonly VideoFlag = 1 << 2;

  public static readonly AudioFlag = 1 << 3;

  public static readonly SubtitleFlag = 1 << 4;

  public static readonly Ready =
    WorkerReadyMessage.IOFlag |
    WorkerReadyMessage.FormatFlag |
    WorkerReadyMessage.VideoFlag |
    WorkerReadyMessage.AudioFlag |
    WorkerReadyMessage.SubtitleFlag;

  public static readonly IO = new WorkerReadyMessage(WorkerReadyMessage.IOFlag);

  public static readonly Format = new WorkerReadyMessage(
    WorkerReadyMessage.FormatFlag
  );

  public static readonly Video = new WorkerReadyMessage(
    WorkerReadyMessage.VideoFlag
  );

  public static readonly Audio = new WorkerReadyMessage(
    WorkerReadyMessage.AudioFlag
  );

  public static readonly Subtitle = new WorkerReadyMessage(
    WorkerReadyMessage.SubtitleFlag
  );

  public constructor(data: number) {
    super(WorkerReadyMessage.Type, data);
  }
}
