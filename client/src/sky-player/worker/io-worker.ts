import type { ChannelMessage } from "../channel/channel-message";
import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";
import type { IMedia } from "../player/i-media";
import { OpenMediaMessage } from "../player/messsage/open-media-message";

export class IOWorker {
  public static readonly Default = new IOWorker();

  private _bc: BroadcastChannel;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
  }

  public start(): void {
    Logging.log(IOWorker.name, `io worker starting`);
    this.listen();
  }

  public listen(): void {
    this._bc.onmessage = this.onMessage.bind(this);
  }

  public onMessage(event: MessageEvent<ChannelMessage<unknown>>): void {
    const { type, data } = event.data;
    switch (type) {
      case OpenMediaMessage.Type:
        this.openMedia(data as IMedia);
        break;
    }
  }

  private openMedia(media: IMedia): void {
    Logging.log(IOWorker.name, JSON.stringify(media, null, `  `));
  }
}

IOWorker.Default.start();
