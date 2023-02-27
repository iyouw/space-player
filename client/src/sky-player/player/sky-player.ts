import type { IMedia } from "./i-media";
import type { IPlayerOption } from "./i-player-opton";

export class SkyPlayer {
  public static readonly Channel = `sky-player.linker-design`;

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

  private _media?: IMedia;

  public constructor(option?: IPlayerOption) {
    this._bc = new BroadcastChannel(SkyPlayer.Channel);
    
    this._ioWorker = new Worker(new URL(`../worker/io-worker`, import.meta.url), {type: `module`});
    this._formatWorker = new Worker(new URL(`../worker/format-worker`, import.meta.url), {type: `module`});
    this._videoWorker = new Worker(new URL(`../worker/video-worker`, import.meta.url), {type: `module`});
    this._audioWorker = new Worker(new URL(`../worker/audio-worker`, import.meta.url), {type: `module`});
    this._subtitleWorker = new Worker(new URL(`../worker/subtitle-worker`, import.meta.url), {type: `module`});

    this._option = option;

    this._paused = false;
    this._playing = false;
    this._streaming = false;
  }

  public mount(root: HTMLElement): void {
    this._root = root;
  }

  public play(media: IMedia): void {
    this._media = media;
    this._bc.postMessage({
      type: `CONNECT_MEDIA`,
      data: media
    });
  }
}