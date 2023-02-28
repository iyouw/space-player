import { ChannelMessage } from "@/sky-player/channel/channel-message";

export class WorkerReadyMessage extends ChannelMessage<number> {
  public static readonly Type = `WORKER_READY`;

  public static readonly IO = 1;

  public static readonly Format = 1 << 1;

  public static readonly Video = 1 << 2;

  public static readonly Audio = 1 << 3;

  public static readonly Subtitle = 1 << 4;

  public static readonly Ready =
    WorkerReadyMessage.IO |
    WorkerReadyMessage.Format |
    WorkerReadyMessage.Video |
    WorkerReadyMessage.Audio |
    WorkerReadyMessage.Subtitle;

  public constructor(data: number) {
    super(WorkerReadyMessage.Type, data);
  }
}
