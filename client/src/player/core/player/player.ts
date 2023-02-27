import type {
  IAudioFrame,
  IFrame,
  IMediaInformation,
  IVideoFrame,
} from "@/player/abstraction";
import type { IPlayerOption } from "@/player/abstraction/player/i-player-option";

import { ThrowHelper } from "@/player/abstraction/exception/throw-helper";
import { IOContext } from "../context/io-context";

export class Player {
  private _mediaInformation?: IMediaInformation;

  private _bc: BroadcastChannel;

  private _ioContext: IOContext;

  private _formatWorker: Worker;

  private _videoDecodeWorker: Worker;
  private _audioDecodeWorker: Worker;
  private _subtitleDecodeWorker: Worker;

  private _videoFrameQueue: Array<IVideoFrame>;
  private _audioFrameQueue: Array<IAudioFrame>;
  private _subtitleFrameQueue: Array<IFrame>;

  private _root?: HTMLElement;
  private _option?: IPlayerOption;

  private _paused: boolean = false;
  private _playing: boolean = false;
  private _streaming: boolean = false;

  public constructor(option?: IPlayerOption) {
    this._option = option;
    this._bc = new BroadcastChannel(`player.linker-design`);

    this._ioContext = new IOContext();
    
    this._formatWorker = new Worker(new URL(`../worker/format-worker`, import.meta.url), { type: `module`});
    this._videoDecodeWorker = new Worker(new URL(`../worker/video-decode-worker`, import.meta.url), {type: `module`});
    this._audioDecodeWorker = new Worker(new URL(`../worker/audio-decode-worker`, import.meta.url), {type: `module`});
    this._subtitleDecodeWorker = new Worker(new URL(`../worker/subtitle-decode-worker`, import.meta.url), {type: `module`});

    this._videoFrameQueue = new Array<IVideoFrame>();
    this._audioFrameQueue = new Array<IAudioFrame>();
    this._subtitleFrameQueue = new Array<IFrame>();

  }

  public mount(root: HTMLElement): Player {
    this._root = root;
    return this;
  }

  public load(mediaInfo: IMediaInformation): Player {
    ThrowHelper.ThrowIf(!this._root, `player haddn't mount to the dom`);
    if (this._mediaInformation) this.stop();
    this._mediaInformation = mediaInfo;
    this._ioContext.open(this._mediaInformation.url);
    return this;
  }

  public play(): Player {
    return this;
  }

  public pause(): Player {
    return this;
  }

  public stop(): Player {
    return this;
  }
}
