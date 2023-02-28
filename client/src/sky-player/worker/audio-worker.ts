import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";
import { WorkerReadyMessage } from "../player/messsage/worker-ready-message";

export class AudioWorker {
  public static readonly Default = new AudioWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.log(AudioWorker.name, `audio worker starting`);
    this._bc.postMessage(new WorkerReadyMessage(WorkerReadyMessage.Audio));
  }
}

AudioWorker.Default.start();
