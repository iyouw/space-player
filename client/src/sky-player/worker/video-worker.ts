import { Logging } from "../logging/logging";
import { SkyPlayer } from "../player/sky-player";

export class VideoWorker {
  public static readonly Default = new VideoWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(SkyPlayer.Channel);
  }

  public start(): void {
    Logging.log(VideoWorker.name, `video worker starting`);
  }
}

VideoWorker.Default.start();