import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";

export class AudioWorker {
  public static readonly Default = new AudioWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.log(AudioWorker.name, `audio worker starting`);
  }
}

AudioWorker.Default.start();
