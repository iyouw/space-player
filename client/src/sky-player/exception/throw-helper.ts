export class ThrowHelper {
  public static ThrowIf(expression: unknown, message: string): void {
    if (expression) throw new Error(message);
  }
}
