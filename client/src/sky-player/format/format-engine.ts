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
import type { Handler } from "../typings/func";
import { DecodeVideoMessage } from "../player/messsage/decode-video-message";
import { DecodeAudioMessage } from "../player/messsage/decode-audio-message";
import { DecodeSubtitleMessage } from "../player/messsage/decode-subtitle-message";

export class FormatEngine extends Engine<IFormatProvider> {
  public static CreateDefault(bc: BroadcastChannel): FormatEngine {
    const res = new FormatEngine(bc);
    res.register(new TSFormatProvider());
    return res;
  }

  private _stream?: MemoryStream;

  private _demuxer?: IDemuxer;

  private _isUnknowFormat?: boolean;


  public constructor(bc: BroadcastChannel) {
    super(bc);
  }

  public stop(): void {
    super.stop();
    this._demuxer?.dispose();
    this._demuxer = undefined;
    this._stream = undefined;
  }

  protected override onMessage(event: MessageEvent<ChannelMessage>): void {
    const { type, data } = event.data;
    if (type !== FormatMediaMessage.Type) return;
    this.formatMedia(data as ArrayBuffer);
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
        this.monitorDemuxer();
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

  private monitorDemuxer(): void {
    if (!this._demuxer) return;
    this._demuxer.onAudioPacketCompleted = this.onAudioPacketCompleted.bind(this);
    this._demuxer.onSubtitlePacketCompleted = this.onSubtitlePacketCompleted.bind(this);
    this._demuxer.onVideoPacketCompleted = this.onVideoPacketCompleted.bind(this);
  }

  private onVideoPacketCompleted(packet: Packet): void {
    const decodeVideoMessage = new DecodeVideoMessage(packet);
    this.send(decodeVideoMessage);
  }

  private onAudioPacketCompleted(packet: Packet): void {
    const decodeAudioMessage = new DecodeAudioMessage(packet);
    this.send(decodeAudioMessage);
  }

  private onSubtitlePacketCompleted(packet: Packet): void {
    const decodeSubtitleMessage = new DecodeSubtitleMessage(packet);
    this.send(decodeSubtitleMessage);
  }
}
