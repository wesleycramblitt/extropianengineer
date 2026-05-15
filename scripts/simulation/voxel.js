/**
 * Voxel – mesh-to-grid voxelisation utility.
 *
 * Converts triangle meshes into solid-cell flags on a simulation grid.
 * Used to place obstacle geometry into CFD / rigid-body simulations.
 */

/**
 * Thin wrapper over a 3‑component array so callers can use plain arrays
 * without mutating shared state.
 */
const V3 = {
    sub(a, b)    { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; },
    add(a, b)    { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; },
    mul(a, s)    { return [a[0] * s, a[1] * s, a[2] * s]; },
    dot(a, b)    { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
};

/**
 * Find the closest point on triangle (a, b, c) to point p.
 * Uses barycentric-coordinate test (Möller–Trumbore projection variant).
 */
function closestPointOnTriangle(p, a, b, c) {
    const ab = V3.sub(b, a);
    const ac = V3.sub(c, a);
    const ap = V3.sub(p, a);

    const d1 = V3.dot(ab, ap);
    const d2 = V3.dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return a;

    const bp = V3.sub(p, b);
    const d3 = V3.dot(ab, bp);
    const d4 = V3.dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return b;

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
        const v = d1 / (d1 - d3);
        return V3.add(a, V3.mul(ab, v));
    }

    const cp = V3.sub(p, c);
    const d5 = V3.dot(ab, cp);
    const d6 = V3.dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return c;

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
        const w = d2 / (d2 - d6);
        return V3.add(a, V3.mul(ac, w));
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
        const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
        return V3.add(b, V3.mul(V3.sub(c, b), w));
    }

    const denom = 1 / (va + vb + vc);
    const v = vb * denom;
    const w = vc * denom;
    return V3.add(a, V3.add(V3.mul(ab, v), V3.mul(ac, w)));
}

/**
 * Check whether grid point p (in grid coords) is within `thickness`
 * of the triangle defined by a, b, c (also grid coords).
 */
function pointNearTriangle(p, a, b, c, thickness) {
    const q = closestPointOnTriangle(p, a, b, c);
    const dx = p[0] - q[0];
    const dy = p[1] - q[1];
    const dz = p[2] - q[2];
    return dx * dx + dy * dy + dz * dz <= thickness * thickness;
}

/**
 * Voxelise a single triangle's surface onto the flags array.
 *
 * @param {Grid}          grid
 * @param {Float32Array}  flags     – solid flags array (mutated)
 * @param {Array<number>} aWorld    – triangle vertex A in world coords
 * @param {Array<number>} bWorld    – triangle vertex B in world coords
 * @param {Array<number>} cWorld    – triangle vertex C in world coords
 * @param {number}        thickness – shell thickness in grid-cell units (default 1)
 */
export function voxelizeTriangle(grid, flags, aWorld, bWorld, cWorld, thickness = 1) {
    const a = grid.worldToGrid(aWorld);
    const b = grid.worldToGrid(bWorld);
    const c = grid.worldToGrid(cWorld);

    const minI = Math.max(0,         Math.floor(Math.min(a[0], b[0], c[0]) - thickness));
    const minJ = Math.max(0,         Math.floor(Math.min(a[1], b[1], c[1]) - thickness));
    const minK = Math.max(0,         Math.floor(Math.min(a[2], b[2], c[2]) - thickness));

    const maxI = Math.min(grid.NX - 1, Math.ceil(Math.max(a[0], b[0], c[0]) + thickness));
    const maxJ = Math.min(grid.NY - 1, Math.ceil(Math.max(a[1], b[1], c[1]) + thickness));
    const maxK = Math.min(grid.NZ - 1, Math.ceil(Math.max(a[2], b[2], c[2]) + thickness));

    for (let k = minK; k <= maxK; k++) {
        for (let j = minJ; j <= maxJ; j++) {
            for (let i = minI; i <= maxI; i++) {
                // test cell centre
                const p = [i + 0.5, j + 0.5, k + 0.5];
                if (pointNearTriangle(p, a, b, c, thickness)) {
                    flags[grid.idx(i, j, k)] = 1;
                }
            }
        }
    }
}

/**
 * Voxelise an entire triangle mesh's surface.
 *
 * @param {Grid}          grid
 * @param {Float32Array}  flags     – solid flags array (mutated)
 * @param {object}        meshData  – { positions: number[], indices: number[] }
 * @param {number}        thickness – shell thickness in grid-cell units (default 1)
 */
export function voxelizeMeshSurface(grid, flags, meshData, thickness = 1) {
    const { positions, indices } = meshData;
    if (!positions || !indices) return;

    for (let t = 0; t < indices.length; t += 3) {
        const ia = indices[t + 0] * 3;
        const ib = indices[t + 1] * 3;
        const ic = indices[t + 2] * 3;

        voxelizeTriangle(
            grid, flags,
            [positions[ia + 0], positions[ia + 1], positions[ia + 2]],
            [positions[ib + 0], positions[ib + 1], positions[ib + 2]],
            [positions[ic + 0], positions[ic + 1], positions[ic + 2]],
            thickness,
        );
    }
}
