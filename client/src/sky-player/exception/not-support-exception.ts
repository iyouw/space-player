export class NotSupportException extends Error {
  public constructor(message: string) {
    super(`Not support: ${message}`);
  }
}
