import type { IMessage } from "@/player/abstraction";
import { Logging } from "@/player/abstraction";

export class AudioDecodeWorker{
  public static Default: AudioDecodeWorker = new AudioDecodeWorker();

  public static Start(): void {
    this.Default.start();
  }

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(`player.linker-design`);
  }

  public start(): void {
    Logging.LogInformation(
      AudioDecodeWorker.name,
      `audio decode worker starting!`
    );
  }
}

AudioDecodeWorker.Start();
