import type { IStream } from "./i-stream";

export interface IProgram {
  id: number;
  streams: Array<IStream>;
  hasStream: boolean;
  addStream(stream: IStream, key: number): void;
  getStream(streamPID: number): IStream | undefined;
  has(streamPID: number): boolean;
}
