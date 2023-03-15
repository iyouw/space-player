import { Counter } from "@/sky-player/counter/counter";
import { Program } from "../program";

export class TSProgram extends Program {
  public readonly counter: Counter;

  public constructor(id: number = 0, number: number = 0) {
    super(id, number);
    this.counter = new Counter();
  }

  public get isCompleted(): boolean {
    return this.counter.isMax;
  }

  public setMax(max: number): void {
    this.counter.setMax(max);
  }
}
