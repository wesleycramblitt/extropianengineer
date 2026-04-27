import { resizeCanvasToDisplaySize } from "/scripts/graphics/gl.js";
import { unLitVert } from "/scripts/graphics/shaders/unlit.vert.js";
import { unLitFrag } from "/scripts/graphics/shaders/unlit.frag.js";
import { litVert } from "/scripts/graphics/shaders/lit.vert.js";
import { litFrag } from "/scripts/graphics/shaders/lit.frag.js";
import { backgroundVert } from "/scripts/graphics/shaders/background.vert.js";
import { backgroundFrag } from "/scripts/graphics/shaders/background.frag.js";

import { ShaderProgram } from "/scripts/graphics/shader.js";


export class Renderer {
  constructor(gl, canvas) {
    this.gl = gl;
    this.canvas = canvas;
    this.litShader = new ShaderProgram(gl, litVert, litFrag);
    this.unLitShader = new ShaderProgram(gl, unLitVert, unLitFrag);
    this.backgroundShader = new ShaderProgram(gl, backgroundVert, backgroundFrag);

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

  drawMesh(mesh, modelMatrix, camera, lightDir, cameraPos, color) {
    const gl = this.gl;
    
    var shader = this.litShader;
    shader.use();
    shader.setMat4("uModel", modelMatrix);
    shader.setMat4("uView", camera.view);
    shader.setMat4("uProjection", camera.projection);
    shader.setVec3("uLightDir", lightDir);
    shader.setVec3("uCameraPos", cameraPos);
    shader.setVec3("uColor", color);
    mesh.draw();
  }

  drawLines(mesh,  modelMatrix, camera,cameraPos, color) {
    const gl = this.gl;
    var shader = this.unlitShader;

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

      var shader = this.backgroundShader;
      shader.use();
      shader.setTexture("uBackground", texture, 0);

      gl.bindVertexArray(this.fullscreenVAO);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);

      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
    }
}
