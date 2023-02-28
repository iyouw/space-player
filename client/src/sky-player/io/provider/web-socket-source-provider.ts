import type { IMedia } from "@/sky-player/player/i-media";
import type { ISource } from "../source/i-source";
import { WebSocketSource } from "../source/web-socket-source";
import type { ISourceProvider } from "./i-source-provider";

export class WebSocketSourceProvider implements ISourceProvider {
  public static readonly Pattern = /^wss?:\/\//;

  public canOpen(protocol: string): boolean {
    return WebSocketSourceProvider.Pattern.test(protocol);
  }

  public create(media: IMedia, option?: unknown): ISource {
    return new WebSocketSource(media, option);
  }
}
