import type { CodecType } from "@/player/abstraction";

export class CodecContainer {
  public static readonly Default = CodecContainer.CreateDefault();

  public static CreateDefault(): CodecContainer {
    const container = new CodecContainer();

    return container;
  }

  public findCodec(codecId: CodecType): boolean {
    return false;
  }
}
