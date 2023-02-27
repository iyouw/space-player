import { Logging } from "../logging/logging";
import { SkyPlayer } from "../player/sky-player";

export class SubtitleWorker {
  public static readonly Default = new SubtitleWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(SkyPlayer.Channel);
  }

  public start(): void {
    Logging.log(SubtitleWorker.name, `subtitle worker starting`);
  }
}

SubtitleWorker.Default.start();