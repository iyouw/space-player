import { Logging } from "../logging/logging";
import { SkyPlayer } from "../player/sky-player";

export class FormatWorker {
  public static readonly Default = new FormatWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(SkyPlayer.Channel);
  }

  public start(): void {
    Logging.log(FormatWorker.name, `format worker starting`);
  }
}

FormatWorker.Default.start();