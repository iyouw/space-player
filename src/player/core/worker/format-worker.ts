import type { IMessage } from "@/player/abstraction";
import { Logging } from "@/player/abstraction";
import { FormatContext } from "../context/format-context";
import { WorkerBase } from "./worker-base";

export class DemuxWorker extends WorkerBase {
  public static Default?: DemuxWorker;

  public static Start(): void {
    if (!this.Default) this.Default = new DemuxWorker();
    this.Default.start();
  }

  private _formateContext: FormatContext;

  public constructor() {
    super();
    this._formateContext = new FormatContext();
  }

  public override start(): void {
    Logging.LogInformation(DemuxWorker.name, `demux worker starting`);
  }

  protected override onMessage(e: MessageEvent<IMessage>): void {
    const { type, data } = e.data;
    switch (type) {
      case "dataarriveled":
        this.onDataArriveled(data as ArrayBuffer);
        break;
    }
  }

  private onDataArriveled(data: ArrayBuffer): void {
    this._formateContext.appendData(data);
  }
}

DemuxWorker.Start();
