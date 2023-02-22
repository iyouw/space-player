import type { ISource } from "@/player/abstraction";
import { WebSocketSource } from "./web-socket-source";

export class SourceContainer {
  public static readonly Default = SourceContainer.CreateDefault();

  public static CreateDefault(): SourceContainer {
    const container = new SourceContainer();
    container.appendSource(WebSocketSource.Default);
    return container;
  }

  private _sources: Array<ISource>;

  public constructor() {
    this._sources = new Array<ISource>();
  }

  public appendSource(source: ISource): SourceContainer {
    this._sources.push(source);
    return this;
  }

  public prependSource(source: ISource): SourceContainer {
    this._sources.unshift(source);
    return this;
  }

  public findSource(url: string): ISource | undefined {
    for (const source of this._sources) {
      if (source.canConnect(url)) return source;
    }
  }
}
