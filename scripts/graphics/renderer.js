import { resizeCanvasToDisplaySize } from "/scripts/graphics/gl.js";
import { composeTRS } from "/scripts/math/transform.js";


export class Renderer {
  constructor(gl, canvas, camera) {
    this.gl = gl;
    this.canvas = canvas;
    this.camera = camera;

  }

  beginFrame() {
    const gl = this.gl;
    const camera = this.camera;

    resizeCanvasToDisplaySize(this.canvas);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    camera.updateProjection(this.canvas.width / this.canvas.height);
    camera.updateView();

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }


  draw(entities) {
    this.beginFrame()

    for (var entity of entities) {
        if (entity.model && entity.translation) {
            const t = entity.translation;
            composeTRS(entity.model,t.position, t.rotation, t.scale); 
        }
        entity.draw();
    }
  }

  
}
