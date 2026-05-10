import { mat4, lookAt, perspective } from "/scripts/math/mat4.js";
import { vec3 } from "/scripts/math/vec3.js";

export class Camera {
  constructor() {
    this.eye = vec3(2,3, 2);
    this.target = vec3(0, 0, 0);
    this.up = vec3(0, 1, 0);

    this.fovY = Math.PI / 4;
    this.near = 0.1;
    this.far = 100.0;

    this.view = mat4();
    this.projection = mat4();
  }

  updateView() {
    lookAt(this.view, this.eye, this.target, this.up);
  }

  updateProjection(aspect) {
    perspective(this.projection, this.fovY, aspect, this.near, this.far);
  }
}
