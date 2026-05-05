
import { backgroundVert } from "/scripts/graphics/shaders/background.vert.js";
import { backgroundFrag } from "/scripts/graphics/shaders/background.frag.js";
import { ShaderProgram } from "/scripts/graphics/shader.js";
import { loadTexture } from "../graphics/texture.js";

export class Background {
    constructor(gl, textureSrc) {
      this.gl = gl;
      this.shader = new ShaderProgram(gl, backgroundVert, backgroundFrag);
      this.fullscreenvao =gl.createVertexArray();
 
      this.textureSrc = textureSrc;
    }

    async loadTexture() {
      this.texture = await loadTexture(this.gl, this.textureSrc);
    }
    
    draw() {

      this.gl.depthMask(false);
      this.gl.disable(this.gl.DEPTH_TEST);

      this.shader.use();
      this.shader.setTexture("uBackground", this.texture, 0);

      this.gl.bindVertexArray(this.fullscreenvao);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
      this.gl.bindVertexArray(null);

      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthMask(true);



    }

}
