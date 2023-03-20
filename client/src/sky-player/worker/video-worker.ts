import { CHANNEL_NAME } from "../channel/channel-name";
import { CodecEngine } from "../codec/codec-engine";
import { Logging } from "../logging/logging";
import { WorkerReadyMessage } from "../player/messsage/worker-ready-message";

export class VideoWorker {
  public static readonly Default = new VideoWorker();

  private _bc: BroadcastChannel;

  private _engine: CodecEngine;

  public constructor() {
    this._bc = new BroadcastChannel(CHANNEL_NAME);
    this._engine = CodecEngine.CreateDefault(this._bc);
  }

  public start(): void {
    Logging.Trace(VideoWorker.name, `video worker starting`);
    this._engine.start();
    this._bc.postMessage(WorkerReadyMessage.Video);
  }
}

VideoWorker.Default.start();
