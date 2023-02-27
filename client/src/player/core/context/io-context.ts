import {
  ThrowHelper,
  type IEvent,
  type ISource,
  type ISourceEventMap,
  type ISourceOption,
} from "@/player/abstraction";
import { EventTarget } from "../event/event-target";
import { DataArriveledEvent } from "../source/event/data-arriveled-event";
import { SourceContainer } from "../source/source-container";

export class IOContext extends EventTarget {
  private _sourceContainer: SourceContainer;

  private _source?: ISource;

  private _bc: BroadcastChannel;

  public constructor() {
    super();
    this._bc = new BroadcastChannel(`player.linker-design`);
    this._sourceContainer = SourceContainer.Default;
  }

  public open(url: string, option?: ISourceOption): void {
    const source = this._sourceContainer.findSource(url);
    ThrowHelper.ThrowIf(!source, `Unsupported Url protocal: ${url}`);
    this._source = source!;
    this._source.addEventListener(
      DataArriveledEvent.Type,
      this.onDataArriveled.bind(this)
    );
    this._source.open(url, option);
  }

  public close(): void {
    if (this._source) this._source.close();
    this._source = undefined;
  }

  private onDataArriveled(e: IEvent): void {
    this._bc.postMessage({
      type: `dataarriveled`,
      data: (e as any).data
    })
  }
}
