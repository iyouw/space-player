import type { IStream } from "./i-stream";

export interface IProgram {
  id: number;
  streams: Array<IStream>;
  hasStream: boolean;
  addStream(stream: IStream, key: number): void;
  has(streamPID: number): boolean;
}
