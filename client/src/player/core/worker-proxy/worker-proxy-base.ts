import type { IMessage } from "@/player/abstraction";
import { EventTarget } from "../event/event-target";

export abstract class WorkerProxyBase extends EventTarget {
  protected _worker: Worker;

  private _onErrorBound?: (event: ErrorEvent) => void;

  private _onMessageBound?: (event: MessageEvent<IMessage>) => void;

  private _onMessageErrorBound?: (event: MessageEvent<IMessage>) => void;

  public constructor() {
    super();
    this._worker = this.createWorker();
    this.listen();
  }

  protected abstract createWorker(): Worker;

  protected terminate(): void {
    this._worker.terminate();
  }

  protected postMessage(message: IMessage): void {
    this._worker.postMessage(message);
  }

  protected abstract onMessage(e: MessageEvent<IMessage>): void;

  private listen(): void {
    this._onErrorBound = this.onError.bind(this);
    this._onMessageBound = this.onMessage.bind(this);
    this._onMessageErrorBound = this.onMessageError.bind(this);

    this._worker.addEventListener(`error`, this._onErrorBound, false);
    this._worker.addEventListener(`message`, this._onMessageBound, false);
    this._worker.addEventListener(
      `messageerror`,
      this._onMessageErrorBound,
      false
    );
  }

  private onError(e: ErrorEvent): void {
    console.error(e);
  }

  private onMessageError(e: MessageEvent<IMessage>): void {
    console.error(e);
  }
}
