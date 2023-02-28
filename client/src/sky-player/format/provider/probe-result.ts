import type { IFormatProvider } from "./i-format-provider";
import { ProbeStatus } from "./probe-status";

export class ProbeResult {
  public static Fail(): ProbeResult {
    return new ProbeResult(ProbeStatus.Failure);
  }

  public static Success(provider: IFormatProvider): ProbeResult {
    return new ProbeResult(ProbeStatus.Success, provider);
  }

  public static NeedData(): ProbeResult {
    return new ProbeResult(ProbeStatus.NeedData);
  }

  public readonly status: ProbeStatus;
  public readonly provider?: IFormatProvider;

  private constructor(status: ProbeStatus, provider?: IFormatProvider) {
    this.status = status;
    this.provider = provider;
  }

  public get isNeedData(): boolean {
    return this.status === ProbeStatus.NeedData;
  }

  public get isFailure(): boolean {
    return this.status === ProbeStatus.Failure;
  }

  public get isSuccess(): boolean {
    return this.status === ProbeStatus.Success;
  }
}
