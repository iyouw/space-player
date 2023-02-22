export interface IMessage<T = unknown> {
  type: string;
  data: T;
}
