import { mat4, multiply, scaling } from "./mat4.js";
import { toMat4 } from "./quat.js";

export function composeTRS(out, position, rotationQuat, scaleVec3) {
  const r = mat4();
  const s = mat4();

  toMat4(r, rotationQuat);
  scaling(s, scaleVec3[0], scaleVec3[1], scaleVec3[2]);

  multiply(out, r, s);
  out[12] = position[0];
  out[13] = position[1];
  out[14] = position[2];
  out[15] = 1;

  return out;
}
