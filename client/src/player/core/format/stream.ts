import type { IStream } from "@/player/abstraction";

export class Stream implements IStream {
  private _id: number;
  private _type: number;

  public constructor(id: number, type: number) {
    this._id = id;
    this._type = type;
  }

  public get id(): number {
    return this._id;
  }

  public get type(): number {
    return this._type;
  }

  public get isVideo(): boolean {
    return false;
  }

  public get isAudio(): boolean {
    return false;
  }

  public get isSubtitle(): boolean {
    return false;
  }
}
