import { type IMessage, Logging } from "@/player/abstraction";

export class VideoDecodeWorker {
  public static Default: VideoDecodeWorker = new VideoDecodeWorker();

  public static Start(): void {
    this.Default.start();
  }

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(`player.linker-design`);
  }

  public start(): void {
    Logging.LogInformation(
      VideoDecodeWorker.name,
      `video decode worker starting!`
    );
  }
}

VideoDecodeWorker.Start();
