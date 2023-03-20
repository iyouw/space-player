import { LogLevel } from "./log-level";

export class Logging {
  public static Level: LogLevel = LogLevel.Debug;

  public static Trace(category: string, message: string): void {
    if (LogLevel.Trace < this.Level) return;
    const msg = this.FormatMessage(`trace`, category, message);
    console.log(msg);
  }

  public static Debug(category: string, message: string): void {
    if (LogLevel.Debug < this.Level) return;
    const msg = this.FormatMessage(`debug`, category, message);
    console.log(msg);
  }

  public static Info(category: string, message: string): void {
    if (LogLevel.Information < this.Level) return;
    const msg = this.FormatMessage(`info`, category, message);
    console.log(msg);
  }

  public static Warn(category: string, message: string): void {
    if (LogLevel.Warning < this.Level) return;
    const msg = this.FormatMessage(`warn`, category, message);
    console.warn(msg);
  }

  public static Error(category: string, message: string): void {
    if (LogLevel.Error < this.Level) return;
    const msg = this.FormatMessage(`error`, category, message);
    console.error(msg);
  }

  public static Critical(category: string, message: string): void {
    if (LogLevel.Critical < this.Level) return;
    const msg = this.FormatMessage(`critical`, category, message);
    console.error(msg);
  }

  private static GetDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes() + 1;
    const second = now.getSeconds();
    return `${year}-${month}-${date} ${hour}:${minute}:${second}`;
  }

  private static FormatMessage(
    prefix: string,
    category: string,
    message: string
  ): string {
    const now = this.GetDateTime();
    const padding = ` `.repeat(prefix.length + 2);
    return `${prefix}: ${category} [${now}]\n${padding}${message}`;
  }
}
