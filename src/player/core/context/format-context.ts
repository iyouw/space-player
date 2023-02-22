import { Logging } from "@/player/abstraction";
import { FormatContainer } from "../format/format-container";

export class FormatContext {
  private _formatContainer: FormatContainer;

  private _buffers: Array<ArrayBuffer>;

  public constructor() {
    this._formatContainer = FormatContainer.Default;
    this._buffers = new Array<ArrayBuffer>();
  }

  public appendData(data: ArrayBuffer): void {
    this._buffers.push(data);
    Logging.LogInformation(
      FormatContext.name,
      `is packet length: ${data.byteLength % 188 === 0}, ${
        data.byteLength / 188
      } packets, received(byte): ${
        data.byteLength
      }, total received(byte): ${this._buffers.reduce(
        (ret, item) => (ret += item.byteLength),
        0
      )}`
    );
  }
}
