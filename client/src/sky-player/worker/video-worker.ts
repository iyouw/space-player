import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";

export class VideoWorker {
  public static readonly Default = new VideoWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.log(VideoWorker.name, `video worker starting`);
  }
}

VideoWorker.Default.start();
