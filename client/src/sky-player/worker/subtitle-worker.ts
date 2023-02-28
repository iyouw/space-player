import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";
import { WorkerReadyMessage } from "../player/messsage/worker-ready-message";

export class SubtitleWorker {
  public static readonly Default = new SubtitleWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.Info(SubtitleWorker.name, `subtitle worker starting`);
    this._bc.postMessage(new WorkerReadyMessage(WorkerReadyMessage.Subtitle));
  }
}

SubtitleWorker.Default.start();
