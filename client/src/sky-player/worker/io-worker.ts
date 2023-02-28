import { CHANNEL_NAME } from "../channel/channel-name";
import { IOEngine } from "../io/io-engine";
import { Logging } from "../logging/logging";

import { WorkerReadyMessage } from "../player/messsage/worker-ready-message";

export class IOWorker {
  public static readonly Default = new IOWorker();

  private _bc: BroadcastChannel;

  private _engine: IOEngine;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
    this._engine = IOEngine.CreateDefault(this._bc);
  }

  public start(): void {
    Logging.log(IOWorker.name, `io worker starting`);
    this._engine.start();
    this._bc.postMessage(new WorkerReadyMessage(WorkerReadyMessage.IO));
  }
}

IOWorker.Default.start();
