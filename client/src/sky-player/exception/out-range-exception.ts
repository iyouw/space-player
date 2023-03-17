export class OutRangeExcenption extends Error {
  public readonly start: number;
  public readonly end: number;
  public readonly current: number;
  public readonly reason?: string;

  public constructor(
    start: number,
    end: number,
    current: number,
    reason?: string
  ) {
    super(`out of range. start: ${start}, end: ${end}, current: ${current}`);
    this.start = start;
    this.end = end;
    this.current = current;
    this.reason = reason;
  }
}
