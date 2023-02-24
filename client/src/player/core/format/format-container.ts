import type { IDemuxer, IProbeResult } from "@/player/abstraction";
import type { BitBuffer } from "../buffer/bit-buffer";
import { TSDemuxer } from "./ts/ts-demuxer";

export class FormatContainer {
  public static readonly Default = FormatContainer.CreateDefault();

  public static CreateDefault(): FormatContainer {
    const container = new FormatContainer();
    container.append(TSDemuxer.Default);
    return container;
  }

  private _formats: Array<IDemuxer>;

  public constructor() {
    this._formats = new Array<IDemuxer>();
  }

  public append(format: IDemuxer): FormatContainer {
    this._formats.push(format);
    return this;
  }

  public prepend(format: IDemuxer): FormatContainer {
    this._formats.unshift(format);
    return this;
  }

  public probe(buffer: BitBuffer): IProbeResult {
    let res: IProbeResult | undefined;
    for (const format of this._formats) {
      const pr = format.probe(buffer);
      if (pr.match) {
        res = {
          match: pr.match,
          demuxer: format,
        };
        break;
      } else if (pr.needMoreData && !res) {
        res = { needMoreData: true };
      }
    }
    if (!res) res = { match: false };
    return res;
  }
}
