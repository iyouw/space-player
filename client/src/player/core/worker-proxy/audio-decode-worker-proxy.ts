import type { IMessage } from "@/player/abstraction";
import { WorkerProxyBase } from "./worker-proxy-base";

export class AudioDecodeWorkerProxy extends WorkerProxyBase {
  protected override createWorker(): Worker {
    return new Worker(
      new URL(`../worker/audio-decode-worker`, import.meta.url),
      {
        type: `module`,
      }
    );
  }

  protected override onMessage(e: MessageEvent<IMessage>): void {
    const { type } = e.data;
    switch (type) {
      default:
        break;
    }
  }
}
