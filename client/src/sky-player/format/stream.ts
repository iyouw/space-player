export abstract class Stream {
  public id: number;
  public type: number;
  
  public constructor(id: number = NaN, type: number = NaN) {
    this.id = id;
    this.type = type;
  }

  public abstract get isVideo(): boolean;
  public abstract get isAudio(): boolean;
  public abstract get isSubtitle(): boolean;
  public abstract get codecType(): number;
}