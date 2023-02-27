import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";

export class FormatWorker {
  public static readonly Default = new FormatWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.log(FormatWorker.name, `format worker starting`);
  }
}

FormatWorker.Default.start();
