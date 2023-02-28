import type { ChannelMessage } from "../channel/channel-message";
import { Logging } from "../logging/logging";
import type { IMedia } from "../player/i-media";
import { FormatMediaMessage } from "../player/messsage/format-media-message";
import { OpenMediaMessage } from "../player/messsage/open-media-message";
import { OpenMediaErrorMessage } from "../player/messsage/open-medua-error-message";
import type { ISourceProvider } from "./provider/i-source-provider";
import { WebSocketSourceProvider } from "./provider/web-socket-source-provider";
import type { ISource } from "./source/i-source";

export class IOEngine {
  public static CreateDefault(bc: BroadcastChannel): IOEngine {
    const res = new IOEngine(bc);
    res.register(new WebSocketSourceProvider());
    return res;
  }

  private _providers: Array<ISourceProvider>;

  private _bc: BroadcastChannel;

  private _source?: ISource;

  public constructor(bc: BroadcastChannel) {
    this._providers = new Array<ISourceProvider>();
    this._bc = bc;
  }

  public register(source: ISourceProvider): void {
    this._providers.push(source);
  }

  public find(protocol: string): ISourceProvider | undefined {
    for (const provider of this._providers) {
      if (provider.canOpen(protocol)) return provider;
    }
    return undefined;
  }

  public start(): void {
    Logging.log(IOEngine.name, `io engine is starting`);
    this.listen();
  }

  public stop(): void {
    Logging.log(IOEngine.name, `io engine is stoping!`);
    this._source?.close();
    this._source = undefined;
    this.unListen();
  }

  private listen(): void {
    Logging.debug(IOEngine.name, `listen broadcast channel`);
    this._bc.onmessage = this.onMessage.bind(this);
  }

  private unListen(): void {
    this._bc.onmessage = null;
  }

  private onMessage(event: MessageEvent<ChannelMessage<unknown>>): void {
    const { type, data } = event.data;
    switch (type) {
      case OpenMediaMessage.Type:
        this.openMedia(data as IMedia);
        break;
    }
  }

  // message handlers
  private openMedia(media: IMedia): void {
    Logging.log(IOEngine.name, JSON.stringify(media));
    const provider = this.find(media.url);
    if (!provider) {
      this._bc.postMessage(new OpenMediaErrorMessage(media));
      return;
    }
    this._source?.close();
    this._source = provider.create(media);
    this._source.onReceivedData = this.onReceivedData.bind(this);
    this._source.open();
  }

  private onReceivedData(data: ArrayBuffer): void {
    Logging.log(IOEngine.name, `received source data`);
    this._bc.postMessage(new FormatMediaMessage(data));
  }
}
