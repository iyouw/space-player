import { Logging } from "../logging/logging";
import { SkyPlayer } from "../player/sky-player";

export class AudioWorker {
  public static readonly Default = new AudioWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(SkyPlayer.Channel);
  }

  public start(): void {
    Logging.log(AudioWorker.name, `audio worker starting`);
  }
}

AudioWorker.Default.start();