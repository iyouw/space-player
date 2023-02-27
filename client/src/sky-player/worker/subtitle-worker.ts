import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";

export class SubtitleWorker {
  public static readonly Default = new SubtitleWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.log(SubtitleWorker.name, `subtitle worker starting`);
  }
}

SubtitleWorker.Default.start();
