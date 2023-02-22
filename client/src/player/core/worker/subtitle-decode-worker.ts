import type { IMessage } from "@/player/abstraction";
import { Logging } from "@/player/abstraction";
import { WorkerBase } from "./worker-base";

export class SubtitleDecodeWorker extends WorkerBase {
  public static Default?: SubtitleDecodeWorker;

  public static Start(): void {
    if (!this.Default) this.Default = new SubtitleDecodeWorker();
    this.Default.start();
  }

  public override start(): void {
    Logging.LogInformation(
      SubtitleDecodeWorker.name,
      `subtitle decode worker starting!`
    );
  }

  protected override onMessage(e: MessageEvent<IMessage>): void {}
}

SubtitleDecodeWorker.Start();
