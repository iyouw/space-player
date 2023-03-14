import type { ChannelMessage } from "../channel/channel-message";
import type { Predicate } from "../typings/func";

export abstract class Engine<T = unknown> {
  private _providers: Array<T>;

  private _bc: BroadcastChannel;

  public constructor(bc: BroadcastChannel) {
    this._providers = new Array<T>();
    this._bc = bc;
  }

  public get providers(): Array<T> {
    return this._providers;
  }

  public start(): void {
    this.listen();
  }

  public stop(): void {
    this.unListen();
  }

  public register(provider: T): void {
    this._providers.push(provider);
  }

  protected find(predicate: Predicate<T>): T | undefined {
    for (const provider of this._providers) {
      if (predicate(provider)) return provider;
    }
    return undefined;
  }

  protected abstract onMessage(event: MessageEvent<ChannelMessage>): void;

  protected send(message: ChannelMessage): void {
    this._bc.postMessage(message);
  }

  private listen(): void {
    this._bc.onmessage = this.onMessage.bind(this);
  }

  private unListen(): void {
    this._bc.onmessage = null;
  }
}
