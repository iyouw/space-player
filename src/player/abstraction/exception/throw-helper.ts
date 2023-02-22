export class ThrowHelper {
  public static ThrowIfFalsy(expression: unknown, message: string): void {
    if (!expression) throw new Error(message);
    if (typeof expression === `number` && Number.isNaN(expression))
      throw new Error(message);
  }
}
