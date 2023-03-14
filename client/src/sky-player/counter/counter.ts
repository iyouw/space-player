export class Counter {
  private _max: number;
  private _count: number;

  public constructor(max: number = 0) {
    this._max = max;
    this._count = 0;
  }

  public get isMax(): boolean {
    return this._max !== 0 && this._count >= this._max;
  }

  public setMax(max: number): void {
    this._max = max;
  }

  public count(count: number): void {
    this._count += count;
  }
}