import type { ChannelMessage } from "../channel/channel-message";
import { Engine } from "../engine/engine";
import type { Packet } from "../format/packet";
import { Logging } from "../logging/logging";
import { DecodeVideoMessage } from "../player/messsage/decode-video-message";
import { RenderVideoMessage } from "../player/messsage/render-video-message";
import type { Frame } from "./frame";
import type { IDecoder } from "./i-decoder";
import type { ICodecProvider } from "./provider/i-codec-provider";
import { Mpeg1Provider } from "./provider/mpeg1-provider";

export class CodecEngine extends Engine<ICodecProvider> {
  public static CreateDefault(bc: BroadcastChannel): CodecEngine {
    const res = new CodecEngine(bc);
    res.register(new Mpeg1Provider());
    return res;
  }

  private _decoder?: IDecoder;

  public constructor(bc: BroadcastChannel) {
    super(bc);
  }

  protected override onMessage(
    event: MessageEvent<ChannelMessage<unknown>>
  ): void {
    const { type, data } = event.data;
    if (type === DecodeVideoMessage.Type) {
      this.decodeVideoPacket(data as Packet);
    }
  }

  private decodeVideoPacket(packet: Packet): void {
    Logging.Info(CodecEngine.name, `receive packet for decoding`);
    this.findDecoder(packet);
    const frame = this._decoder!.decode(packet);
    if (!frame) return;
    this.send(new RenderVideoMessage(frame));
  }

  private findDecoder(packet: Packet): void {
    if (this._decoder) return;
    const provider = this.find((x) => x.is(packet.codecId));
    if (!provider) return;
    this._decoder = provider.createDecoder();
    this._decoder.onFrameCompleted = this.onFrameCompleted.bind(this);
  }

  private onFrameCompleted(frame: Frame): void {
    this.send(new RenderVideoMessage(frame));
  }
}
