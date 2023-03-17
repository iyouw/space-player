import { NotSupportException } from "@/sky-player/exception/not-support-exception";
import { WebGLProgramLinkException } from "@/sky-player/exception/webgl-program-link-exception";
import { WebGLShaderCompileException } from "@/sky-player/exception/webgl-shader-compile-exception";
import type { IPlayerOption } from "@/sky-player/player/i-player-opton";
import {
  SHADER_FRAGMENT_LOADING,
  SHADER_FRAGMENT_YCRCB_TO_RGBA,
  SHADER_VERTEX_IDENTITY,
} from "./shaders";

export class GLRenderer {
  public static IsSupported(): boolean {
    try {
      if (!window.WebGLRenderingContext) {
        return false;
      }

      const canvas = document.createElement(`canvas`);
      return !!(
        canvas.getContext(`webgl`) || canvas.getContext(`experimental-webgl`)
      );
    } catch (err) {
      return false;
    }
  }

  private _option?: IPlayerOption;
  private _program?: WebGLProgram;
  private _loadingProgram?: WebGLProgram;

  private _vertexBuffer?: WebGLBuffer;

  private _textureY?: WebGLTexture;
  private _textureCb?: WebGLTexture;
  private _textureCr?: WebGLTexture;

  private _canvas?: HTMLCanvasElement;

  private _enabled: boolean;
  private _hasTextureData: Record<number, boolean>;

  private _width: number;
  private _height: number;

  private _gl?: WebGLRenderingContext;
  private _shouldCreateUnclampedViews: boolean;

  public handleContextLostBound: EventListener;
  public handleContextRestoredBound: EventListener;

  public constructor(option?: IPlayerOption) {
    this._option = option;
    this._hasTextureData = {};
    this._shouldCreateUnclampedViews = false;
    this._width = 0;
    this._height = 0;
    this.handleContextLostBound = this.handleContextLost.bind(this);
    this.handleContextRestoredBound = this.handleContextRestore.bind(this);
    this._enabled = false;
  }

  public mount(root: HTMLElement): void {
    this._canvas = document.createElement(`canvas`);
    this._canvas.width = this._width = root.clientWidth;
    this._canvas.height = this._height = root.clientHeight;
    root.appendChild(this._canvas);
    this._gl = this.createContext();
    this.registerEvent();
    this.initGL();
    this._enabled = true;
  }

  public render(
    y: Uint8Array | Uint8ClampedArray,
    cb: Uint8Array | Uint8ClampedArray,
    cr: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    if (!this._enabled) return;

    if (this._width !== width || this._height != height)
      this.resize(width, height);

    const gl = this._gl!;

    const w = ((this._width + 15) >> 4) << 4;
    const h = this._height;
    const w2 = w >> 1;
    const h2 = h >> 1;

    if (y instanceof Uint8ClampedArray && this._shouldCreateUnclampedViews) {
      y = new Uint8Array(y.buffer);
      cb = new Uint8Array(cb.buffer);
      cr = new Uint8Array(cr.buffer);
    }

    gl.useProgram(this._program!);

    this.updateTexture(gl.TEXTURE0, this._textureY!, w, h, y);
    this.updateTexture(gl.TEXTURE1, this._textureCb!, w2, h2, cb);
    this.updateTexture(gl.TEXTURE2, this._textureCr!, w2, h2, cr);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public resize(width: number, height: number): void {
    this._width = width | 0;
    this._height = height | 0;

    this._canvas!.width = this._width;
    this._canvas!.height = this._height;

    this._gl!.useProgram(this._program!);
    const codedWidth = ((this._width + 15) >> 4) << 4;
    this._gl!.viewport(0, 0, codedWidth, this._height);
  }

  public destory(): void {
    const gl = this._gl!;

    // remove texture
    this.deleteTexture(gl.TEXTURE0, this._textureY!);
    this.deleteTexture(gl.TEXTURE1, this._textureCb!);
    this.deleteTexture(gl.TEXTURE2, this._textureCr!);

    // remove program
    gl.useProgram(null);
    gl.deleteProgram(this._program!);
    gl.deleteProgram(this._loadingProgram!);

    // remove buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(this._vertexBuffer!);

    // remove listener
    this._canvas?.removeEventListener(
      `webglcontextlost`,
      this.handleContextLostBound,
      false
    );
    this._canvas?.removeEventListener(
      `webglcontextrestored`,
      this.handleContextRestoredBound,
      false
    );

    this._canvas?.remove();
  }

  private createContext(): WebGLRenderingContext {
    const gl = this._canvas?.getContext(`webgl`, {
      preserveDrawingBuffer: !!this._option?.preserveDrawingBuffer,
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl)
      throw new NotSupportException(
        "can not create webgl rendering context, please check your browser!"
      );
    return gl;
  }

  private handleContextLost(e: Event): void {
    e.preventDefault();
  }

  private handleContextRestore(): void {
    this.initGL();
  }

  private registerEvent(): void {
    this._canvas?.addEventListener(
      `webglcontextlost`,
      this.handleContextLostBound,
      false
    );
    this._canvas?.addEventListener(
      `webglcontextrestored`,
      this.handleContextRestoredBound,
      false
    );
  }

  private initGL(): void {
    this._hasTextureData = {};

    const gl = this._gl!;
    let vertexAttr: number = 0;

    // set pixel format to unpack premultiply alpha
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    // init buffers, set the camera view
    this._vertexBuffer = gl.createBuffer()!;
    const vertexCoords = new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexCoords, gl.STATIC_DRAW);

    // setup the main YCrCb(yuv) to RGBA program
    this._program = this.createProgram(
      SHADER_VERTEX_IDENTITY,
      SHADER_FRAGMENT_YCRCB_TO_RGBA
    );

    vertexAttr = gl.getAttribLocation(this._program, `vertex`);
    gl.enableVertexAttribArray(vertexAttr);
    gl.vertexAttribPointer(vertexAttr, 2, gl.FLOAT, false, 0, 0);

    this._textureY = this.createTexture(0, `textureY`);
    this._textureCb = this.createTexture(1, `textureCb`);
    this._textureCr = this.createTexture(2, `textureCr`);

    // setup the loading animation program
    this._loadingProgram = this.createProgram(
      SHADER_VERTEX_IDENTITY,
      SHADER_FRAGMENT_LOADING
    );
    vertexAttr = gl.getAttribLocation(this._loadingProgram, `vertex`);
    gl.enableVertexAttribArray(vertexAttr);
    gl.vertexAttribPointer(vertexAttr, 2, gl.FLOAT, false, 0, 0);

    this._shouldCreateUnclampedViews = !this.allowClampedTextureData();
  }

  private createProgram(
    vertexShader: string,
    fragmentShader: string
  ): WebGLProgram {
    const gl = this._gl!;
    const program = gl.createProgram();
    if (!program) throw new NotSupportException(`can not create gl program!`);
    gl.attachShader(
      program,
      this.compileShader(gl.VERTEX_SHADER, vertexShader)
    );
    gl.attachShader(
      program,
      this.compileShader(gl.FRAGMENT_SHADER, fragmentShader)
    );
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new WebGLProgramLinkException(gl.getProgramInfoLog(program)!);
    }

    gl.useProgram(program);

    return program;
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this._gl!;
    const shader = gl.createShader(type);
    if (!shader) throw new NotSupportException(`can not create webgl shader`);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new WebGLShaderCompileException(gl.getShaderInfoLog(shader)!);
    }

    return shader;
  }

  private createTexture(index: number, name: string): WebGLTexture {
    const gl = this._gl!;
    const texture = gl.createTexture();
    if (!texture) throw new NotSupportException(`can not create texture`);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(this._program!, name), index);

    return texture;
  }

  private updateTexture(
    index: number,
    texture: WebGLTexture,
    w: number,
    h: number,
    data: Uint8Array | Uint8ClampedArray
  ): void {
    const gl = this._gl!;
    gl.activeTexture(index);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (this._hasTextureData[index]) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        w,
        h,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        data
      );
    } else {
      this._hasTextureData[index] = true;
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        w,
        h,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        data
      );
    }
  }

  private deleteTexture(index: number, texture: WebGLTexture): void {
    const gl = this._gl!;
    gl.activeTexture(index);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteTexture(texture);
  }

  private allowClampedTextureData(): boolean {
    const gl = this._gl!;
    const texture = gl.createTexture();
    if (!texture) throw new NotSupportException(`can not create webgl texture`);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      1,
      1,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      new Uint8ClampedArray([0])
    );

    return gl.getError() === 0;
  }
}
