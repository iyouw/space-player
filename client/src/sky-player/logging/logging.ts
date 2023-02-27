export class Logging {
  public static trace(category: string, message: string): void {
    const msg = this.formatMessage(`trace`, category, message);
    console.log(msg);
  }

  public static log(category: string, message: string): void {
    const msg = this.formatMessage(`info`, category, message);
    console.log(msg);
  }

  public static debug(category: string, message: string): void {
    const msg = this.formatMessage(`debug`, category, message);
    console.log(msg);
  }

  public static warn(category: string, message: string): void {
    const msg = this.formatMessage(`warn`, category, message);
    console.warn(msg);
  }

  public static error(category: string, message: string): void {
    const msg = this.formatMessage(`error`, category, message);
    console.error(msg);
  }

  public static critical(category: string, message: string): void {
    const msg = this.formatMessage(`critical`, category, message);
    console.error(msg);
  }

  private static getDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes() + 1;
    const second = now.getSeconds();
    return `${year}-${month}-${date} ${hour}:${minute}:${second}`;
  }

  private static formatMessage(
    prefix: string,
    category: string,
    message: string
  ): string {
    const now = this.getDateTime();
    const padding = ` `.repeat(prefix.length + 2);
    return `${prefix}: ${category} [${now}]\n${padding}${message}`;
  }
}
