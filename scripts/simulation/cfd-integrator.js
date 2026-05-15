/**
 * FDMStableFluidsSolver – explicit-Euler Finite Difference Method
 * Stable Fluids (Jos Stam, 1999) solver for incompressible flow.
 *
 * Pipeline:  add forces → diffuse → advect → project
 *
 * Designed to be swappable: future solvers (FVM, implicit, etc.) implement
 * the same { step(dt) } contract and receive the same data-buffer references.
 */

export class FDMStableFluidsSolver {
    /**
     * @param {object} opts
     * @param {Grid}          opts.grid
     * @param {Float32Array}  opts.u         – x-velocity    (read/write)
     * @param {Float32Array}  opts.v         – y-velocity    (read/write)
     * @param {Float32Array}  opts.w         – z-velocity    (read/write)
     * @param {Float32Array}  opts.p         – pressure      (read/write)
     * @param {Float32Array}  opts.flags     – solid flags   (read)
     * @param {Float32Array}  opts.uTmp      – scratch buffer (same size as u)
     * @param {Float32Array}  opts.vTmp      – scratch buffer
     * @param {Float32Array}  opts.wTmp      – scratch buffer
     * @param {Float32Array}  opts.pTmp      – scratch buffer, pressure
     * @param {Float32Array}  opts.div       – scratch buffer, divergence
     */
    constructor({ grid, u, v, w, p, flags, uTmp, vTmp, wTmp, pTmp, div }) {
        this.grid   = grid;
        this.u      = u;
        this.v      = v;
        this.w      = w;
        this.p      = p;
        this.flags  = flags;
        this.uTmp   = uTmp;
        this.vTmp   = vTmp;
        this.wTmp   = wTmp;
        this.pTmp   = pTmp;
        this.div    = div;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Public entry point
    // ═══════════════════════════════════════════════════════════════════

    step(dt) {
        this.addForces(dt);
        this.diffuseVelocity(dt);
        this.advectVelocity(dt);
        this.projectVelocity(dt);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  External forces
    // ═══════════════════════════════════════════════════════════════════

    addForces(dt) {
        // Wind and body forces are applied as initial conditions.
        // Override this method / inject per-frame forces as needed.
        // Example: apply gravity or user-controlled wind gusts here.
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Diffusion  (explicit Laplacian / explicit Euler)
    // ═══════════════════════════════════════════════════════════════════

    diffuseVelocity(dt) {
        const { grid, u, v, w, flags, uTmp, vTmp, wTmp } = this;
        const { NX, NY, NZ, NXNY, nu, N } = grid;
        const diff = dt * nu;

        for (let k = 0; k < NZ; k++) {
            for (let j = 0; j < NY; j++) {
                for (let i = 0; i < NX; i++) {
                    const idx = grid.idx(i, j, k);

                    if (flags[idx] !== 0) {
                        uTmp[idx] = 0;
                        vTmp[idx] = 0;
                        wTmp[idx] = 0;
                        continue;
                    }

                    const i1 = i + 1 < NX ? grid.neighborFluid(flags, idx, idx + 1)     : idx;
                    const i2 = i - 1 >= 0 ? grid.neighborFluid(flags, idx, idx - 1)      : idx;
                    const j1 = j + 1 < NY ? grid.neighborFluid(flags, idx, idx + NX)     : idx;
                    const j2 = j - 1 >= 0 ? grid.neighborFluid(flags, idx, idx - NX)     : idx;
                    const k1 = k + 1 < NZ ? grid.neighborFluid(flags, idx, idx + NXNY)   : idx;
                    const k2 = k - 1 >= 0 ? grid.neighborFluid(flags, idx, idx - NXNY)   : idx;

                    // Discrete Laplacian (6-point stencil)
                    const lapU = u[i1] + u[i2] + u[j1] + u[j2] + u[k1] + u[k2] - 6 * u[idx];
                    const lapV = v[i1] + v[i2] + v[j1] + v[j2] + v[k1] + v[k2] - 6 * v[idx];
                    const lapW = w[i1] + w[i2] + w[j1] + w[j2] + w[k1] + w[k2] - 6 * w[idx];

                    uTmp[idx] = u[idx] + diff * lapU;
                    vTmp[idx] = v[idx] + diff * lapV;
                    wTmp[idx] = w[idx] + diff * lapW;
                }
            }
        }

        // Write back
        u.set(uTmp);
        v.set(vTmp);
        w.set(wTmp);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Advection  (semi-Lagrangian with trilinear interpolation)
    // ═══════════════════════════════════════════════════════════════════

    advectVelocity(dt) {
        const { grid, u, v, w, flags, uTmp, vTmp, wTmp } = this;
        const { NX, NY, NZ, NXNY, cellSizeWorld } = grid;

        const invHx = 1.0 / cellSizeWorld[0];
        const invHy = 1.0 / cellSizeWorld[1];
        const invHz = 1.0 / cellSizeWorld[2];

        for (let k = 0; k < NZ; k++) {
            for (let j = 0; j < NY; j++) {
                for (let i = 0; i < NX; i++) {
                    const idx = grid.idx(i, j, k);

                    if (flags[idx] !== 0) {
                        uTmp[idx] = 0;
                        vTmp[idx] = 0;
                        wTmp[idx] = 0;
                        continue;
                    }

                    // Semi-Lagrangian backtrace (explicit Euler)
                    let x = i - dt * u[idx] * invHx;
                    let y = j - dt * v[idx] * invHy;
                    let z = k - dt * w[idx] * invHz;

                    // Clamp to within grid (prevents sampling outside the domain)
                    x = Math.max(0, Math.min(NX - 1.001, x));
                    y = Math.max(0, Math.min(NY - 1.001, y));
                    z = Math.max(0, Math.min(NZ - 1.001, z));

                    uTmp[idx] = trilinearInterp(u, NX, NXNY, x, y, z);
                    vTmp[idx] = trilinearInterp(v, NX, NXNY, x, y, z);
                    wTmp[idx] = trilinearInterp(w, NX, NXNY, x, y, z);
                }
            }
        }

        // Write back
        u.set(uTmp);
        v.set(vTmp);
        w.set(wTmp);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Pressure projection  (Poisson solve → gradient subtraction)
    // ═══════════════════════════════════════════════════════════════════

    projectVelocity(dt) {
        const { grid, u, v, w, p, flags, div, pTmp } = this;
        const { NX, NY, NZ, NXNY, cellSizeWorld, N } = grid;

        const hx = cellSizeWorld[0];
        const hy = cellSizeWorld[1];
        const hz = cellSizeWorld[2];

        const ax = 1.0 / (hx * hx);
        const ay = 1.0 / (hy * hy);
        const az = 1.0 / (hz * hz);
        const denom = 2.0 * (ax + ay + az);

        const neighborFluid = (idx, nidx) => grid.neighborFluid(flags, idx, nidx);

        // ── 1. Compute negative divergence ────────────────────────
        for (let k = 0; k < NZ; k++) {
            for (let j = 0; j < NY; j++) {
                for (let i = 0; i < NX; i++) {
                    const idx = grid.idx(i, j, k);
                    if (flags[idx] !== 0) {
                        div[idx] = 0;
                        continue;
                    }

                    const i1 = i + 1 < NX ? neighborFluid(idx, idx + 1)     : idx;
                    const i2 = i - 1 >= 0 ? neighborFluid(idx, idx - 1)      : idx;
                    const j1 = j + 1 < NY ? neighborFluid(idx, idx + NX)     : idx;
                    const j2 = j - 1 >= 0 ? neighborFluid(idx, idx - NX)     : idx;
                    const k1 = k + 1 < NZ ? neighborFluid(idx, idx + NXNY)   : idx;
                    const k2 = k - 1 >= 0 ? neighborFluid(idx, idx - NXNY)   : idx;

                    div[idx] = -(
                        (u[i1] - u[i2]) / (2.0 * hx) +
                        (v[j1] - v[j2]) / (2.0 * hy) +
                        (w[k1] - w[k2]) / (2.0 * hz)
                    );
                }
            }
        }

        // ── 2. Solve Poisson ∇²p = div  (Jacobi iteration) ───────
        p.fill(0);
        pTmp.fill(0);

        let pOld = p;
        let pNew = pTmp;
        const iterations = 40;

        for (let iter = 0; iter < iterations; iter++) {
            for (let k = 0; k < NZ; k++) {
                for (let j = 0; j < NY; j++) {
                    for (let i = 0; i < NX; i++) {
                        const idx = grid.idx(i, j, k);
                        if (flags[idx] !== 0) {
                            pNew[idx] = 0;
                            continue;
                        }

                        const i1 = i + 1 < NX ? neighborFluid(idx, idx + 1)     : idx;
                        const i2 = i - 1 >= 0 ? neighborFluid(idx, idx - 1)      : idx;
                        const j1 = j + 1 < NY ? neighborFluid(idx, idx + NX)     : idx;
                        const j2 = j - 1 >= 0 ? neighborFluid(idx, idx - NX)     : idx;
                        const k1 = k + 1 < NZ ? neighborFluid(idx, idx + NXNY)   : idx;
                        const k2 = k - 1 >= 0 ? neighborFluid(idx, idx - NXNY)   : idx;

                        pNew[idx] = (
                            (pOld[i1] + pOld[i2]) * ax +
                            (pOld[j1] + pOld[j2]) * ay +
                            (pOld[k1] + pOld[k2]) * az +
                            div[idx]
                        ) / denom;
                    }
                }
            }

            // swap buffers for next iteration
            const tmp = pOld;
            pOld = pNew;
            pNew = tmp;
        }

        // Ensure `p` holds the final pressure
        if (pOld !== p) {
            p.set(pOld);
        }

        // ── 3. Subtract pressure gradient ─────────────────────────
        for (let k = 0; k < NZ; k++) {
            for (let j = 0; j < NY; j++) {
                for (let i = 0; i < NX; i++) {
                    const idx = grid.idx(i, j, k);
                    if (flags[idx] !== 0) {
                        u[idx] = 0;
                        v[idx] = 0;
                        w[idx] = 0;
                        continue;
                    }

                    const i1 = i + 1 < NX ? neighborFluid(idx, idx + 1)     : idx;
                    const i2 = i - 1 >= 0 ? neighborFluid(idx, idx - 1)      : idx;
                    const j1 = j + 1 < NY ? neighborFluid(idx, idx + NX)     : idx;
                    const j2 = j - 1 >= 0 ? neighborFluid(idx, idx - NX)     : idx;
                    const k1 = k + 1 < NZ ? neighborFluid(idx, idx + NXNY)   : idx;
                    const k2 = k - 1 >= 0 ? neighborFluid(idx, idx - NXNY)   : idx;

                    u[idx] -= (p[i1] - p[i2]) / (2.0 * hx);
                    v[idx] -= (p[j1] - p[j2]) / (2.0 * hy);
                    w[idx] -= (p[k1] - p[k2]) / (2.0 * hz);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Velocity-field access (used by particle tracers)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Interpolate velocity at a continuous grid coordinate.
     * @param {number} x – grid-space X
     * @param {number} y – grid-space Y
     * @param {number} z – grid-space Z
     * @returns {[number, number, number]} interpolated (ux, uy, uz)
     */
    interpolateVelocity(x, y, z) {
        const { u, v, w, grid: { NX, NXNY } } = this;
        return [
            trilinearInterp(u, NX, NXNY, x, y, z),
            trilinearInterp(v, NX, NXNY, x, y, z),
            trilinearInterp(w, NX, NXNY, x, y, z),
        ];
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  Standalone trilinear interpolation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Trilinearly interpolate a 3D scalar field at continuous grid coords (x, y, z).
 *
 * @param {Float32Array} field  – flat 3D array, indexed as [i + j*NX + k*NXNY]
 * @param {number}       NX
 * @param {number}       NXNY   – NX * NY
 * @param {number}       x      – grid-space X (may be fractional)
 * @param {number}       y      – grid-space Y
 * @param {number}       z      – grid-space Z
 * @returns {number} interpolated scalar
 */
function trilinearInterp(field, NX, NXNY, x, y, z) {
    // Clamp to valid range
    x = Math.max(0, Math.min(NX - 1.001, x));
    const N = field.length;
    // estimate NY and NZ from NX and NXNY for clamp purposes
    const NY = NX > 0 ? Math.max(1, Math.round(NXNY / NX)) : 1;
    const NZ = N > 0 ? Math.max(1, Math.round(N / NXNY)) : 1;

    y = Math.max(0, Math.min(NY - 1.001, y));
    z = Math.max(0, Math.min(NZ - 1.001, z));

    const i0 = Math.floor(x);
    const j0 = Math.floor(y);
    const k0 = Math.floor(z);

    const i1 = Math.min(i0 + 1, NX - 1);
    const j1 = Math.min(j0 + 1, NY - 1);
    const k1 = Math.min(k0 + 1, NZ - 1);

    const sx = x - i0;
    const sy = y - j0;
    const sz = z - k0;

    const idx = (i, j, k) => i + j * NX + k * NXNY;

    const c000 = field[idx(i0, j0, k0)];
    const c100 = field[idx(i1, j0, k0)];
    const c010 = field[idx(i0, j1, k0)];
    const c110 = field[idx(i1, j1, k0)];
    const c001 = field[idx(i0, j0, k1)];
    const c101 = field[idx(i1, j0, k1)];
    const c011 = field[idx(i0, j1, k1)];
    const c111 = field[idx(i1, j1, k1)];

    const sxc = 1 - sx;
    const syc = 1 - sy;
    const szc = 1 - sz;

    return (
        sxc * syc * szc * c000 +
        sx  * syc * szc * c100 +
        sxc * sy  * szc * c010 +
        sx  * sy  * szc * c110 +
        sxc * syc * sz  * c001 +
        sx  * syc * sz  * c101 +
        sxc * sy  * sz  * c011 +
        sx  * sy  * sz  * c111
    );
}
