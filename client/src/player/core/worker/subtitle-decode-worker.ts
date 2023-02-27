import type { IMessage } from "@/player/abstraction";
import { Logging } from "@/player/abstraction";

export class SubtitleDecodeWorker {
  public static Default: SubtitleDecodeWorker = new SubtitleDecodeWorker()

  public static Start(): void {
    this.Default.start();
  }

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(`player.linker-design`);
  }

  public start(): void {
    Logging.LogInformation(
      SubtitleDecodeWorker.name,
      `subtitle decode worker starting!`
    );
  }
}

SubtitleDecodeWorker.Start();
