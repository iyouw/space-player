import type { IMessage } from "@/player/abstraction";
import { Logging } from "@/player/abstraction";
import { FormatContext } from "../context/format-context";

export class FormatWorker {
  public static readonly Default = new FormatWorker();

  public static Start(): void {
    FormatWorker.Default.start();
  }

  private _bc: BroadcastChannel;

  private _context: FormatContext

  public constructor() {
    this._bc = new BroadcastChannel(`player.linker-design`);
    this._context = new FormatContext();
  }

  public start(): void {
    Logging.LogInformation(FormatWorker.name, `format worker starting!`);
    this._bc.onmessage = this.onMessage.bind(this);
  }

  public onMessage(event: MessageEvent<IMessage>): void {
    const { type, data } = event.data;
    switch (type) {
      case `dataarriveled`:
        this._context.appendData(data as ArrayBuffer);
        break;
    }
  }
}

FormatWorker.Start();
