export class Mesh {
  constructor(gl, data) {
    this.gl = gl;

    // Prefer engine-level topology names over raw GL enums
    this.topology = data.topology ?? "triangles";
    this.drawMode = Mesh.getGLDrawMode(gl, this.topology);

    const positions = data.positions;
    const normals = data.normals ?? null;
    const uvs = data.uvs ?? null;
    const indices = data.indices ?? null;

    if (!positions || positions.length % 3 !== 0) {
      throw new Error("Mesh positions must exist and have length multiple of 3.");
    }

    const vertexCount = positions.length / 3;

    if (normals && normals.length / 3 !== vertexCount) {
      throw new Error("Normals count must match positions count.");
    }

    if (uvs && uvs.length / 2 !== vertexCount) {
      throw new Error("UV count must match positions count.");
    }

    const hasNormals = !!normals;
    const hasUVs = !!uvs;

    this.hasNormals = hasNormals;
    this.hasUVs = hasUVs;

    // Layout: position(3) + normal(3 optional) + uv(2 optional)
    this.strideFloats = 3 + (hasNormals ? 3 : 0) + (hasUVs ? 2 : 0);
    this.strideBytes = this.strideFloats * 4;

    const interleaved = new Float32Array(vertexCount * this.strideFloats);

    for (let i = 0; i < vertexCount; i++) {
      let dst = i * this.strideFloats;
      let src3 = i * 3;

      interleaved[dst++] = positions[src3 + 0];
      interleaved[dst++] = positions[src3 + 1];
      interleaved[dst++] = positions[src3 + 2];

      if (hasNormals) {
        interleaved[dst++] = normals[src3 + 0];
        interleaved[dst++] = normals[src3 + 1];
        interleaved[dst++] = normals[src3 + 2];
      }

      if (hasUVs) {
        const src2 = i * 2;
        interleaved[dst++] = uvs[src2 + 0];
        interleaved[dst++] = uvs[src2 + 1];
      }
    }

    this.vertexCount = vertexCount;
    this.indexCount = indices ? indices.length : 0;
    this.isIndexed = !!indices;

    this.validatePrimitiveCounts();

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ebo = this.isIndexed ? gl.createBuffer() : null;

    if (!this.vao || !this.vbo || (this.isIndexed && !this.ebo)) {
      throw new Error("Failed to create WebGL mesh buffers.");
    }

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);

    let offset = 0;

    // location 0 = position
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, this.strideBytes, offset);
    offset += 3 * 4;

    // location 1 = normal
    if (hasNormals) {
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, this.strideBytes, offset);
      offset += 3 * 4;
    }

    // location 2 = uv
    if (hasUVs) {
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, this.strideBytes, offset);
      offset += 2 * 4;
    }

    if (this.isIndexed) {
      let indexArray;
      if (vertexCount > 65535) {
        indexArray = new Uint32Array(indices);
        this.indexType = gl.UNSIGNED_INT;
      } else {
        indexArray = new Uint16Array(indices);
        this.indexType = gl.UNSIGNED_SHORT;
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
    } else {
      this.indexType = null;
    }

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  static getGLDrawMode(gl, topology) {
    switch (topology) {
      case "triangles": return gl.TRIANGLES;
      case "lines": return gl.LINES;
      case "line_strip": return gl.LINE_STRIP;
      case "line_loop": return gl.LINE_LOOP;
      case "points": return gl.POINTS;
      case "triangle_strip": return gl.TRIANGLE_STRIP;
      case "triangle_fan": return gl.TRIANGLE_FAN;
      default:
        throw new Error(`Unsupported mesh topology: ${topology}`);
    }
  }

  validatePrimitiveCounts() {
    const count = this.isIndexed ? this.indexCount : this.vertexCount;

    switch (this.topology) {
      case "triangles":
        if (count % 3 !== 0) {
          console.warn(`Mesh topology "${this.topology}" usually expects count % 3 === 0, got ${count}.`);
        }
        break;

      case "lines":
        if (count % 2 !== 0) {
          console.warn(`Mesh topology "${this.topology}" usually expects count % 2 === 0, got ${count}.`);
        }
        break;

      case "line_strip":
      case "line_loop":
        if (count < 2) {
          console.warn(`Mesh topology "${this.topology}" usually expects at least 2 vertices/indices, got ${count}.`);
        }
        break;

      case "points":
        if (count < 1) {
          console.warn(`Mesh topology "${this.topology}" has no vertices.`);
        }
        break;
    }
  }

  draw() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    if (this.isIndexed) {
      gl.drawElements(this.drawMode, this.indexCount, this.indexType, 0);
    } else {
      gl.drawArrays(this.drawMode, 0, this.vertexCount);
    }

    gl.bindVertexArray(null);
  }

  destroy() {
    const gl = this.gl;
    if (this.vbo) gl.deleteBuffer(this.vbo);
    if (this.ebo) gl.deleteBuffer(this.ebo);
    if (this.vao) gl.deleteVertexArray(this.vao);

    this.vbo = null;
    this.ebo = null;
    this.vao = null;
  }
}
