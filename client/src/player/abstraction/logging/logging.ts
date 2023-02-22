export class Logging {
  public static LogInformation(category: string, message: string): void {
    const msg = `[${category}]: ${message}`;
    console.log(msg);
  }
}
