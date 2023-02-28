import type { ChannelMessage } from "../channel/channel-message";
import { Engine } from "../engine/engine";
import { Logging } from "../logging/logging";
import type { IMedia } from "../player/i-media";
import { FormatMediaMessage } from "../player/messsage/format-media-message";
import { OpenMediaMessage } from "../player/messsage/open-media-message";
import { OpenMediaErrorMessage } from "../player/messsage/open-medua-error-message";
import type { ISourceProvider } from "./provider/i-source-provider";
import { WebSocketSourceProvider } from "./provider/web-socket-source-provider";
import type { ISource } from "./source/i-source";

export class IOEngine extends Engine<ISourceProvider> {
  public static CreateDefault(bc: BroadcastChannel): IOEngine {
    const res = new IOEngine(bc);
    res.register(new WebSocketSourceProvider());
    return res;
  }

  private _source?: ISource;

  public stop(): void {
    super.stop();
    this._source?.close();
    this._source = undefined;
  }

  protected override onMessage(event: MessageEvent<ChannelMessage>): void {
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
    const provider = this.find((provider) => provider.canOpen(media.url));
    if (!provider) {
      this.send(new OpenMediaErrorMessage(media));
      return;
    }
    this._source?.close();
    this._source = provider.create(media);
    this._source.onReceivedData = this.onReceivedData.bind(this);
    this._source.open();
  }

  private onReceivedData(data: ArrayBuffer): void {
    Logging.log(IOEngine.name, `received source data`);
    this.send(new FormatMediaMessage(data));
  }
}
