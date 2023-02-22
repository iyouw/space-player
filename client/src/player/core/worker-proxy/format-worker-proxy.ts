import type { IEvent, IMessage } from "@/player/abstraction";
import type { IOContext } from "../context/io-context";
import { DataArriveledEvent } from "../source/event/data-arriveled-event";
import { WorkerProxyBase } from "./worker-proxy-base";

export class FormatWorkerProxy extends WorkerProxyBase {
  public connect(ioContext: IOContext): void {
    ioContext.addEventListener(
      DataArriveledEvent.Type,
      this.onDataArriveled.bind(this)
    );
  }

  protected override createWorker(): Worker {
    return new Worker(new URL("../worker/format-worker", import.meta.url), {
      type: `module`,
    });
  }

  protected override onMessage(e: MessageEvent<IMessage<unknown>>): void {
    const { type } = e.data;
    switch (type) {
      default:
        break;
    }
  }

  private onDataArriveled(event: IEvent): void {
    const e = event as DataArriveledEvent;
    const msg: IMessage<ArrayBuffer> = {
      type: e.type,
      data: e.data,
    };
    this.postMessage(msg);
  }
}
