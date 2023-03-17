export const SHADER_VERTEX_IDENTITY = `
  attribute vec2 vertex;
  varying vec2 texCoord;
  void main() {
    texCoord = vertex;
    gl_Position = vec4((vertex * 2.0 - 1.0) * vec2(1, -1), 0.0, 1.0);
  }
`;

export const SHADER_FRAGMENT_YCRCB_TO_RGBA = `
  precision mediump float;
  uniform sampler2D textureY;
  uniform sampler2D textureCb;
  uniform sampler2D textureCr;
  varying vec2 texCoord;
  mat4 rec601 = mat4(
    1.16438,  0.00000,  1.59603, -0.87079,
    1.16438, -0.39176, -0.81297,  0.52959,
    1.16438,  2.01723,  0.00000, -1.08139,
    0, 0, 0, 1
  );
  void main() {
    float y = texture2D(textureY, texCoord).r;
    float cb = texture2D(textureCb, texCoord).r;
    float cr = texture2D(textureCr, texCoord).r;

    gl_FragColor = vec4(y, cr, cb, 1.0) * rec601;
  }
`;

export const SHADER_FRAGMENT_LOADING = `
  precision mediump float;
  uniform float progress;
  varying  vec2 texCoord;
  void main() {
    float c = ceil(progress - (1.0 -texCoord.y));
    gl_FragColor = vec4(c, c, c, 1);
  }
`;
