import type {
  IAudioFrame,
  IFrame,
  IMediaInformation,
  IVideoFrame,
} from "@/player/abstraction";
import type { IPlayerOption } from "@/player/abstraction/player/i-player-option";

import { ThrowHelper } from "@/player/abstraction/exception/throw-helper";
import { IOContext } from "../context/io-context";

import { AudioDecodeWorkerProxy } from "../worker-proxy/audio-decode-worker-proxy";
import { FormatWorkerProxy } from "../worker-proxy/format-worker-proxy";
import { SubtitleDecodeWorkerProxy } from "../worker-proxy/subtitle-decode-worker-proxy";
import { VideoDecodeWorkerProxy } from "../worker-proxy/video-decode-worker-proxy";

export class Player {
  private _mediaInformation?: IMediaInformation;

  private _ioContext: IOContext;

  private _formatWorkerProxy: FormatWorkerProxy;

  private _videoDecodeWorkerProxy: VideoDecodeWorkerProxy;
  private _audioDecodeWorkerProxy: AudioDecodeWorkerProxy;
  private _subtitleDecodeWorkerProxy: SubtitleDecodeWorkerProxy;

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

    this._ioContext = new IOContext();
    this._formatWorkerProxy = new FormatWorkerProxy();
    this._videoDecodeWorkerProxy = new VideoDecodeWorkerProxy();
    this._audioDecodeWorkerProxy = new AudioDecodeWorkerProxy();
    this._subtitleDecodeWorkerProxy = new SubtitleDecodeWorkerProxy();
    this._videoFrameQueue = new Array<IVideoFrame>();
    this._audioFrameQueue = new Array<IAudioFrame>();
    this._subtitleFrameQueue = new Array<IFrame>();

    this._formatWorkerProxy.connect(this._ioContext);
  }

  public mount(root: HTMLElement): Player {
    this._root = root;
    return this;
  }

  public load(mediaInfo: IMediaInformation): Player {
    ThrowHelper.ThrowIfFalsy(this._root, `player haddn't mount to the dom`);
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
