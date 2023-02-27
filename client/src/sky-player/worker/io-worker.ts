import { Logging } from "../logging/logging";
import { SkyPlayer } from "../player/sky-player";

export class IOWorker {
  public static readonly Default = new IOWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(SkyPlayer.Channel);
  }

  public start(): void {
    Logging.log(IOWorker.name, `io worker starting`);
  }
}

IOWorker.Default.start();