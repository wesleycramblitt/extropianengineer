import { resizeCanvasToDisplaySize } from "/scripts/graphics/gl.js";

export class Renderer {
  constructor(gl, canvas) {
    this.gl = gl;
    this.canvas = canvas;
  }

  beginFrame(camera) {
    const gl = this.gl;

    resizeCanvasToDisplaySize(this.canvas);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    camera.updateProjection(this.canvas.width / this.canvas.height);
    camera.updateView();

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  drawMesh(mesh, shader, modelMatrix, camera, lightDir, cameraPos, color) {
    const gl = this.gl;

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    shader.use();
    shader.setMat4("uModel", modelMatrix);
    shader.setMat4("uView", camera.view);
    shader.setMat4("uProjection", camera.projection);
    shader.setVec3("uLightDir", lightDir);
    shader.setVec3("uCameraPos", cameraPos);
    shader.setVec3("uColor", color);
    mesh.draw();
  }

  drawLines(mesh, shader, modelMatrix, camera,cameraPos, color) {
    const gl = this.gl;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    shader.use();
    shader.setMat4("uModel", modelMatrix);
    shader.setMat4("uView", camera.view);
    shader.setMat4("uProjection", camera.projection);
    shader.setVec3("uCameraPos", cameraPos);
    shader.setVec3("uColor", color);
    mesh.draw();
  }



  drawBackground(shader, texture) {
      const gl = this.gl;

      gl.depthMask(false);
      gl.disable(gl.DEPTH_TEST);

      shader.use();
      shader.setTexture("uBackground", texture, 0);

      gl.bindVertexArray(this.fullscreenVAO);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);

      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
    }
}
