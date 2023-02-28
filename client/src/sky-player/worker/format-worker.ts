import { CHANNEL_NAME } from "../channel/channel-name";
import { FormatEngine } from "../format/format-engine";
import { Logging } from "../logging/logging";
import { WorkerReadyMessage } from "../player/messsage/worker-ready-message";

export class FormatWorker {
  public static readonly Default = new FormatWorker();

  private _bc: BroadcastChannel;

  private _engine: FormatEngine;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
    this._engine = new FormatEngine(this._bc);
  }

  public start(): void {
    Logging.Info(FormatWorker.name, `format worker starting`);
    this._engine.start();
    this._bc.postMessage(new WorkerReadyMessage(WorkerReadyMessage.Format));
  }
}

FormatWorker.Default.start();
