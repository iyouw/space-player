import type { IMessage } from "@/player/abstraction";

export abstract class WorkerBase {
  private _onMessageBound?: (e: MessageEvent<IMessage>) => void;

  public constructor() {
    this.listen();
  }

  public abstract start(): void;

  protected postMessage(message: IMessage): void {
    self.postMessage(message);
  }

  protected abstract onMessage(e: MessageEvent<IMessage>): void;

  private listen(): void {
    this._onMessageBound = this.onMessage.bind(this);

    self.addEventListener("message", this._onMessageBound, false);
  }
}
