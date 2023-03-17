export class WebGLProgramLinkException extends Error {
  public constructor(message: string) {
    super(`WebGL program link error: ${message}`);
  }
}
