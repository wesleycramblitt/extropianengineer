export function generateAxisLine(size, axis) {
    const vertices = [];
    
    vertices.push(0,0,0);
    if (axis == "x")  vertices.push(size,0,0);
    else if (axis == "y")  vertices.push(0,size,0);
    else   vertices.push(0,0,size);

    return {positions: vertices, topology: "lines"};
}
export function generateGrid(size, divisions) {
    const vertices = [];
    const indices = [];

    const step = size / divisions;
    const half = size / 2;

    let index = 0;

    // Lines parallel to X-axis (vary Y)
    for (let i = 0; i <= divisions; i++) {
        const z = -half + i * step;

        // start point
        vertices.push(-half, 0,z);
        // end point
        vertices.push( half, 0,z);

        indices.push(index, index + 1);
        index += 2;
    }

    // Lines parallel to Y-axis (vary X)
    for (let i = 0; i <= divisions; i++) {
        const x = -half + i * step;

        vertices.push(x, 0,-half);
        vertices.push(x, 0, half);

        indices.push(index, index + 1);
        index += 2;
    }
    return { positions: vertices, indices, topology: "lines"  };
}

export function createCubeData() {

  const vertices = [
    // +Z
    -0.5,-0.5, 0.5,  0,0,1,
     0.5,-0.5, 0.5,  0,0,1,
     0.5, 0.5, 0.5,  0,0,1,
    -0.5, 0.5, 0.5,  0,0,1,

    // -Z
    0.5,-0.5,-0.5,   0,0,-1,
   -0.5,-0.5,-0.5,   0,0,-1,
   -0.5, 0.5,-0.5,   0,0,-1,
    0.5, 0.5,-0.5,   0,0,-1,

    // +X
    0.5,-0.5, 0.5,   1,0,0,
    0.5,-0.5,-0.5,   1,0,0,
    0.5, 0.5,-0.5,   1,0,0,
    0.5, 0.5, 0.5,   1,0,0,

    // -X
   -0.5,-0.5,-0.5,  -1,0,0,
   -0.5,-0.5, 0.5,  -1,0,0,
   -0.5, 0.5, 0.5,  -1,0,0,
   -0.5, 0.5,-0.5,  -1,0,0,

    // +Y
   -0.5, 0.5, 0.5,   0,1,0,
    0.5, 0.5, 0.5,   0,1,0,
    0.5, 0.5,-0.5,   0,1,0,
   -0.5, 0.5,-0.5,   0,1,0,

    // -Y
   -0.5,-0.5,-0.5,   0,-1,0,
    0.5,-0.5,-0.5,   0,-1,0,
    0.5,-0.5, 0.5,   0,-1,0,
   -0.5,-0.5, 0.5,   0,-1,0,
  ];

  const indices = [
     0, 1, 2,  2, 3, 0,
     4, 5, 6,  6, 7, 4,
     8, 9,10, 10,11, 8,
    12,13,14, 14,15,12,
    16,17,18, 18,19,16,
    20,21,22, 22,23,20
  ];

  return { positions: vertices, indices:indices };
}

export function createFloorData(size = 30, uvScale = 1) {
  const h = size * 0.5;

  return {
    positions: new Float32Array([
      -h, 0, -h,
       h, 0, -h,
       h, 0,  h,
      -h, 0,  h,
    ]),

    normals: new Float32Array([
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
    ]),

    uvs: new Float32Array([
      0, 0,
      uvScale, 0,
      uvScale, uvScale,
      0, uvScale,
    ]),

    indices: new Uint16Array([
      0, 2, 1,
      0, 3, 2,
    ]),
  };
}
export function createHollowCylinder({
    innerRadius = 0.5,
    outerRadius = 1.0,
    height = 1.0,
    radialSegments = 32,
    includeTop = true,
    includeBottom = true
} = {}) {
    if (innerRadius <= 0) throw new Error("innerRadius must be > 0");
    if (outerRadius <= innerRadius) throw new Error("outerRadius must be > innerRadius");
    if (radialSegments < 3) throw new Error("radialSegments must be >= 3");

    const positions = [];
    const normals = [];
    const indices = [];
    const halfH = height * 0.5;

    function addVertex(x, y, z, nx, ny, nz) {
        positions.push(x, y, z);
        normals.push(nx, ny, nz);
        return (positions.length / 3) - 1;
    }

    function makeRing(radius, y, nxMul = 1, normalY = 0) {
        const ring = [];
        for (let i = 0; i < radialSegments; i++) {
            const t = (i / radialSegments) * Math.PI * 2;
            const c = Math.cos(t);
            const s = Math.sin(t);
            ring.push(addVertex(
                c * radius,
                y,
                s * radius,
                c * nxMul,
                normalY,
                s * nxMul
            ));
        }
        return ring;
    }

    // ---------------------------
    // OUTER WALL
    // ---------------------------
    {
        const bottom = makeRing(outerRadius, -halfH, 1, 0);
        const top    = makeRing(outerRadius,  halfH, 1, 0);

        for (let i = 0; i < radialSegments; i++) {
            const n = (i + 1) % radialSegments;

            const b0 = bottom[i];
            const b1 = bottom[n];
            const t0 = top[i];
            const t1 = top[n];

            indices.push(b0, b1, t1);
            indices.push(b0, t1, t0);
        }
    }

    // ---------------------------
    // INNER WALL
    // ---------------------------
    {
        const bottom = makeRing(innerRadius, -halfH, -1, 0);
        const top    = makeRing(innerRadius,  halfH, -1, 0);

        for (let i = 0; i < radialSegments; i++) {
            const n = (i + 1) % radialSegments;

            const b0 = bottom[i];
            const b1 = bottom[n];
            const t0 = top[i];
            const t1 = top[n];

            indices.push(b0, t1, b1);
            indices.push(b0, t0, t1);
        }
    }

    // ---------------------------
    // TOP CAP RING
    // ---------------------------
    if (includeTop) {
        const outer = [];
        const inner = [];

        for (let i = 0; i < radialSegments; i++) {
            const t = (i / radialSegments) * Math.PI * 2;
            const c = Math.cos(t);
            const s = Math.sin(t);

            outer.push(addVertex(c * outerRadius, halfH, s * outerRadius, 0, 1, 0));
            inner.push(addVertex(c * innerRadius, halfH, s * innerRadius, 0, 1, 0));
        }

        for (let i = 0; i < radialSegments; i++) {
            const n = (i + 1) % radialSegments;

            const o0 = outer[i];
            const o1 = outer[n];
            const i0 = inner[i];
            const i1 = inner[n];

            indices.push(o0, o1, i1);
            indices.push(o0, i1, i0);
        }
    }

    // ---------------------------
    // BOTTOM CAP RING
    // ---------------------------
    if (includeBottom) {
        const outer = [];
        const inner = [];

        for (let i = 0; i < radialSegments; i++) {
            const t = (i / radialSegments) * Math.PI * 2;
            const c = Math.cos(t);
            const s = Math.sin(t);

            outer.push(addVertex(c * outerRadius, -halfH, s * outerRadius, 0, -1, 0));
            inner.push(addVertex(c * innerRadius, -halfH, s * innerRadius, 0, -1, 0));
        }

        for (let i = 0; i < radialSegments; i++) {
            const n = (i + 1) % radialSegments;

            const o0 = outer[i];
            const o1 = outer[n];
            const i0 = inner[i];
            const i1 = inner[n];

            indices.push(o0, i1, o1);
            indices.push(o0, i0, i1);
        }
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices)
    };
}
