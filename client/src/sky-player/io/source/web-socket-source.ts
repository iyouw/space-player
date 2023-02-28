import type { IMedia } from "@/sky-player/player/i-media";
import type { Handler } from "@/sky-player/typings/func";
import type { ISource } from "./i-source";

export class WebSocketSource implements ISource {
  private _media: IMedia;

  private _option?: unknown;

  public onReceivedData?: Handler<ArrayBuffer>;

  private _socket?: WebSocket;

  public constructor(media: IMedia, option?: unknown) {
    this._media = media;
    this._option = option;
  }

  public open(): void {
    this._socket = new WebSocket(this._media.url);
    this._socket.binaryType = `arraybuffer`;
    this._socket.onmessage = this.onReceivedMessage.bind(this);
  }

  public close(): void {
    this._socket = undefined;
    this.onReceivedData = undefined;
  }

  private onReceivedMessage(event: MessageEvent<ArrayBuffer>): void {
    if (this.onReceivedData) this.onReceivedData(event.data);
  }
}
