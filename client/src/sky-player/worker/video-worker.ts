import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";
import { WorkerReadyMessage } from "../player/messsage/worker-ready-message";

export class VideoWorker {
  public static readonly Default = new VideoWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.Info(VideoWorker.name, `video worker starting`);
    this._bc.postMessage(new WorkerReadyMessage(WorkerReadyMessage.Video));
  }
}

VideoWorker.Default.start();
