import type { ChannelMessage } from "../channel/channel-message";
import { Engine } from "../engine/engine";
import { Logging } from "../logging/logging";
import { FormatMediaMessage } from "../player/messsage/format-media-message";
import { UnknowFormatMessage } from "../player/messsage/unknow-format-message";
import { MemoryStream } from "../stream/memory-stream";
import type { IFormatProvider } from "./provider/i-format-provider";
import { TSFormatProvider } from "./provider/ts-format-provider";
import type { IDemuxer } from "./i-demuxer";
import type { Packet } from "./packet";

export class FormatEngine extends Engine<IFormatProvider> {
  public static CreateDefault(bc: BroadcastChannel): FormatEngine {
    const res = new FormatEngine(bc);
    res.register(new TSFormatProvider());
    return res;
  }

  private _stream?: MemoryStream;

  private _demuxer?: IDemuxer;

  private _programs?: Array<unknown>;

  private _streams?: Array<unknown>;

  private _selectedProgram?: unknown;

  private _selectedVideoStream?: unknown;

  private _selectedAudioStream?: unknown;

  private _selectedSubtitleStream?: unknown;

  private _videoPacket?: Packet;

  private _audioPacket?: Packet;

  private _subtitlePacket?: Packet;

  private _isUnknowFormat?: boolean;

  public stop(): void {
    super.stop();
    this._demuxer?.close();
    this._demuxer = undefined;
    this._stream = undefined;
    this._programs = undefined;
    this._streams = undefined;
    this._selectedProgram = undefined;
    this._selectedVideoStream = undefined;
    this._selectedAudioStream = undefined;
    this._selectedSubtitleStream = undefined;
    this._videoPacket = undefined;
    this._audioPacket = undefined;
    this._subtitlePacket = undefined;
  }

  protected override onMessage(event: MessageEvent<ChannelMessage>): void {
    const { type, data } = event.data;
    switch (type) {
      case FormatMediaMessage.Type:
        this.formatMedia(data as ArrayBuffer);
        break;
    }
  }

  private formatMedia(data: ArrayBuffer): void {
    if (this._isUnknowFormat) return;
    Logging.Info(FormatEngine.name, `start format media`);
    try {
      this.receiveData(data);
      this.selectDemuxer();
      this.demuxing();
    } catch (error: unknown) {
      if (error instanceof UnknowFormatMessage) this.send(error);
      else if (error instanceof Error)
        Logging.Error(FormatEngine.name, error.message);
      else Logging.Error(FormatEngine.name, `${error}`);
    }
  }

  private receiveData(data: ArrayBuffer): void {
    if (!this._stream) this._stream = new MemoryStream();
    this._stream.write(data);
  }

  private selectDemuxer(): void {
    if (this._demuxer) return;
    let success: boolean = false;
    let needData: boolean = false;
    for (const provider of this.providers) {
      const res = provider.probe(this._stream!);
      if (res.isSuccess) {
        this._demuxer = res.provider!.createDemuxer(this._stream!);
        success = true;
        break;
      }
      if (res.isNeedData) needData = true;
    }
    if (success || needData) return;
    throw new UnknowFormatMessage();
  }

  private demuxing(): void {
    this._demuxer?.demux();
  }
}
