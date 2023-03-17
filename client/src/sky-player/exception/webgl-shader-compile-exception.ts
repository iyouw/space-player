export class WebGLShaderCompileException extends Error {
  public constructor(message: string) {
    super(`WebGL shader compile error: ${message}`);
  }
}
