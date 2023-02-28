import type { IMedia } from "@/sky-player/player/i-media";
import type { ISource } from "../source/i-source";

export interface ISourceProvider {
  canOpen(protocol: string): boolean;
  create(media: IMedia, option?: unknown): ISource;
}
