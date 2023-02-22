import type { IMessage } from "@/player/abstraction";
import { Logging } from "@/player/abstraction";
import { WorkerBase } from "./worker-base";

export class AudioDecodeWorker extends WorkerBase {
  public static Default?: AudioDecodeWorker;

  public static Start(): void {
    if (!this.Default) this.Default = new AudioDecodeWorker();
    this.Default.start();
  }

  public override start(): void {
    Logging.LogInformation(
      AudioDecodeWorker.name,
      `audio decode worker starting!`
    );
  }

  protected override onMessage(e: MessageEvent<IMessage>): void {}
}

AudioDecodeWorker.Start();
