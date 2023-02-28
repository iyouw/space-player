import type { ChannelMessage } from "../channel/channel-message";
import { CHANNEL_NAME } from "../channel/channel-name";
import { Logging } from "../logging/logging";
import type { IMedia } from "./i-media";
import type { IPlayerOption } from "./i-player-opton";
import { OpenMediaMessage } from "./messsage/open-media-message";
import { WorkerReadyMessage } from "./messsage/worker-ready-message";

export class SkyPlayer {
  private _bc: BroadcastChannel;

  private _ioWorker: Worker;
  private _formatWorker: Worker;
  private _videoWorker: Worker;
  private _audioWorker: Worker;
  private _subtitleWorker: Worker;

  private _option?: IPlayerOption;
  private _root?: HTMLElement;

  private _paused: boolean;
  private _playing: boolean;
  private _streaming: boolean;

  private _ready: boolean;
  private _readyFlag: number;

  private _media?: IMedia;

  public constructor(option?: IPlayerOption) {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
    this.listen();

    this._ioWorker = new Worker(
      new URL(`../worker/io-worker`, import.meta.url),
      { type: `module` }
    );
    this._formatWorker = new Worker(
      new URL(`../worker/format-worker`, import.meta.url),
      { type: `module` }
    );
    this._videoWorker = new Worker(
      new URL(`../worker/video-worker`, import.meta.url),
      { type: `module` }
    );
    this._audioWorker = new Worker(
      new URL(`../worker/audio-worker`, import.meta.url),
      { type: `module` }
    );
    this._subtitleWorker = new Worker(
      new URL(`../worker/subtitle-worker`, import.meta.url),
      { type: `module` }
    );

    this._option = option;

    this._paused = false;
    this._playing = false;
    this._streaming = false;
    this._ready = false;
    this._readyFlag = 0;
  }

  public mount(root: HTMLElement): void {
    this._root = root;
  }

  public async play(media: IMedia): Promise<void> {
    await this.waitReady();
    this._media = media;
    Logging.debug(SkyPlayer.name, `play media`);
    this._bc.postMessage(new OpenMediaMessage(media));
  }

  private listen(): void {
    this._bc.onmessage = this.onMessage.bind(this);
  }

  private onMessage(event: MessageEvent<ChannelMessage>): void {
    const { type, data } = event.data;
    switch (type) {
      case WorkerReadyMessage.Type:
        this.onReady(data as number);
        break;
    }
  }

  private onReady(flag: number): void {
    Logging.debug(SkyPlayer.name, `${flag} worker is ready`);
    this._readyFlag |= flag;
    if (this._readyFlag !== WorkerReadyMessage.Ready) return;
    this._ready = true;
  }

  private waitReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this._ready) resolve();
        setTimeout(() => checkReady(), 10);
      }
      checkReady();
    });
  }
}
