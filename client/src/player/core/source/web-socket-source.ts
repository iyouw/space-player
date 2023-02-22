import type {
  ISource,
  ISourceEventMap,
  ISourceOption,
} from "@/player/abstraction";
import { EventTarget } from "../event/event-target";
import { DataArriveledEvent } from "./event/data-arriveled-event";

export class WebSocketSource extends EventTarget implements ISource {
  public static readonly Default = new WebSocketSource();

  private _socket?: WebSocket;
  private _option?: ISourceOption;

  private _progress: number;

  public constructor() {
    super();
    this._progress = 0;
  }

  public get progress(): number {
    return this._progress;
  }

  public canConnect(url: string): boolean {
    return /^(wss?):\/\//.test(url);
  }

  public open(url: string, option?: ISourceOption): void {
    this._progress = 0;
    this._option = option;
    this._socket = new WebSocket(url);
    this._socket.binaryType = `arraybuffer`;
    this._socket.onclose = this.onClose.bind(this);
    this._socket.onerror = this.onError.bind(this);
    this._socket.onmessage = this.onMessage.bind(this);
    this._socket.onopen = this.onOpen.bind(this);
  }

  public close(): void {
    if (this._socket) this._socket.close();
    this._socket = undefined;
    this._progress = 0;
  }

  private onClose(e: CloseEvent): void {}

  private onError(e: Event): void {}

  private onMessage(e: MessageEvent<ArrayBuffer>): void {
    const { data } = e;
    this.dispatchEvent(new DataArriveledEvent(data));
  }

  private onOpen(e: Event): void {
    this._progress = 1;
  }
}
