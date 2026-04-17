export function quat(x = 0, y = 0, z = 0, w = 1) {
  return new Float32Array([x, y, z, w]);
}

export function identity(out) {
  out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 1;
  return out;
}

export function normalize(out, q) {
  const len = Math.hypot(q[0], q[1], q[2], q[3]);
  if (len > 1e-8) {
    const inv = 1 / len;
    out[0] = q[0] * inv;
    out[1] = q[1] * inv;
    out[2] = q[2] * inv;
    out[3] = q[3] * inv;
  }
  return out;
}

export function fromAxisAngle(out, axis, radians) {
  const half = radians * 0.5;
  const s = Math.sin(half);
  out[0] = axis[0] * s;
  out[1] = axis[1] * s;
  out[2] = axis[2] * s;
  out[3] = Math.cos(half);
  return normalize(out, out);
}

export function multiply(out, a, b) {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3];
  const bx = b[0], by = b[1], bz = b[2], bw = b[3];

  out[0] = aw*bx + ax*bw + ay*bz - az*by;
  out[1] = aw*by - ax*bz + ay*bw + az*bx;
  out[2] = aw*bz + ax*by - ay*bx + az*bw;
  out[3] = aw*bw - ax*bx - ay*by - az*bz;
  return out;
}

export function toMat4(out, q) {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;

  out[0] = 1 - (yy + zz); out[1] = xy + wz;     out[2] = xz - wy;     out[3] = 0;
  out[4] = xy - wz;       out[5] = 1 - (xx + zz); out[6] = yz + wx;   out[7] = 0;
  out[8] = xz + wy;       out[9] = yz - wx;     out[10] = 1 - (xx + yy); out[11] = 0;
  out[12] = 0;            out[13] = 0;          out[14] = 0;          out[15] = 1;

  return out;
}
