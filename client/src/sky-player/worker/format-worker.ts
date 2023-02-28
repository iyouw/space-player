import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";
import { WorkerReadyMessage } from "../player/messsage/worker-ready-message";

export class FormatWorker {
  public static readonly Default = new FormatWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.log(FormatWorker.name, `format worker starting`);
    this._bc.postMessage(new WorkerReadyMessage(WorkerReadyMessage.Format));
  }
}

FormatWorker.Default.start();
