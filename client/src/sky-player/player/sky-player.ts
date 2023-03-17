import type { ChannelMessage } from "../channel/channel-message";
import { CHANNEL_NAME } from "../channel/channel-name";
import type { Frame } from "../codec/frame";
import { Logging } from "../logging/logging";
import { GLRenderer } from "../renderer/webgl/gl-renderer";
import type { IMedia } from "./i-media";
import type { IPlayerOption } from "./i-player-opton";
import { OpenMediaMessage } from "./messsage/open-media-message";
import { RenderAudioMessage } from "./messsage/render-audio-message";
import { RenderSubtitleMessage } from "./messsage/render-subtitle-message";
import { RenderVideoMessage } from "./messsage/render-video-message";
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

  private _audioFrameQueue: Array<Frame>;
  private _subtitleFrameQueue: Array<Frame>;
  private _videoFrameQueue: Array<Frame>;

  private _animationId: number;

  private _renderer: GLRenderer;

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

    this._audioFrameQueue = new Array<Frame>();
    this._subtitleFrameQueue = new Array<Frame>();
    this._videoFrameQueue = new Array<Frame>();

    this._animationId = 0;

    this._renderer = new GLRenderer(option);
  }

  public mount(root: HTMLElement): void {
    this._root = root;
    this._renderer.mount(root);
  }

  public async play(media: IMedia): Promise<void> {
    await this.waitReady();
    this._media = media;
    Logging.Debug(SkyPlayer.name, `play media`);
    this._bc.postMessage(new OpenMediaMessage(media));
    this.doPlay();
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
      case RenderAudioMessage.Type:
        this.renderAudio(data);
        break;
      case RenderSubtitleMessage.Type:
        this.renderSubtitle(data);
        break;
      case RenderVideoMessage.Type:
        this.renderVideo(data);
        break;
    }
  }

  private onReady(flag: number): void {
    Logging.Debug(SkyPlayer.name, `${flag} worker is ready`);
    this._readyFlag |= flag;
    if (this._readyFlag !== WorkerReadyMessage.Ready) return;
    this._ready = true;
  }

  private waitReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this._ready) resolve();
        setTimeout(() => checkReady(), 10);
      };
      checkReady();
    });
  }

  private renderAudio(data: unknown): void {
    Logging.Debug(SkyPlayer.name, `received audio frame`);
    this._audioFrameQueue.push(data as Frame);
  }

  private renderSubtitle(data: unknown): void {
    Logging.Debug(SkyPlayer.name, `received subtitle frame`);
    this._subtitleFrameQueue.push(data as Frame);
  }

  private renderVideo(data: unknown): void {
    Logging.Debug(SkyPlayer.name, `received video frame`);
    this._videoFrameQueue.push(data as Frame);
  }

  private doPlay(): void {
    if (this._animationId) return;

    this._animationId = requestAnimationFrame(this.update.bind(this));
    // this._wantsToPlay = true;
    this._paused = false;
  }

  private update(): void {
    this._animationId = requestAnimationFrame(this.update.bind(this));

    // if (!this._videoFrameQueue.length) this._renderer.renderProgress(0.8);

    this.updateForStreaming();
  }

  private updateForStreaming(): void {
    const frame = this._videoFrameQueue.shift();
    if (!frame) return;
    const buffers = frame.buffers;
    this._renderer.render(
      buffers[0],
      buffers[1],
      buffers[2],
      frame.width,
      frame.height
    );
  }
}
