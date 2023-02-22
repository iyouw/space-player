import { type IMessage, Logging } from "@/player/abstraction";
import { WorkerBase } from "./worker-base";

export class VideoDecodeWorker extends WorkerBase {
  public static Default?: VideoDecodeWorker;

  public static Start(): void {
    if (!this.Default) this.Default = new VideoDecodeWorker();
    this.Default.start();
  }

  public override start(): void {
    Logging.LogInformation(
      VideoDecodeWorker.name,
      `video decode worker starting!`
    );
  }

  protected onMessage(e: MessageEvent<IMessage>): void {}
}

VideoDecodeWorker.Start();
