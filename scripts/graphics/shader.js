function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }

  return shader;
}

export class ShaderProgram {
  constructor(gl, vertSource, fragSource) {
    this.gl = gl;
    this.uniforms = new Map();

    const vs = compileShader(gl, gl.VERTEX_SHADER, vertSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program link error: ${log}`);
    }

    this.program = program;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name) {
    if (!this.uniforms.has(name)) {
      this.uniforms.set(name, this.gl.getUniformLocation(this.program, name));
    }
    return this.uniforms.get(name);
  }

  setMat4(name, value) {
    this.gl.uniformMatrix4fv(this.getUniformLocation(name), false, value);
  }

  setVec3(name, value) {
    this.gl.uniform3fv(this.getUniformLocation(name), value);
  }

  setFloat(name, value) {
    this.gl.uniform1f(this.getUniformLocation(name), value);
  }

  setTexture(name, texture, unit = 0) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(this.getUniformLocation(name), unit);
  }
}
