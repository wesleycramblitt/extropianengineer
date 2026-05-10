class CFDIntegrator {
    constructor(p, u, v,w, settings) {
       this.p = p;
       this.u = u;
    }

    step(dt) {
        this.p.fill(0);
        this.externalForces(dt);
        this.diffuse(dt);
        this.advect(dt);
        this.project(dt);
    }

    externalForces(dt) {

    }

    advect(dt) {
        const N = this.NX * this.NY * this.NZ;
        const u_new = new Float32Array(N);
        const v_new = new Float32Array(N);
        const w_new = new Float32Array(N);

        for (let k = 0; k < this.NZ; k++) {
            for (let j = 0; j < this.NY; j++) {
                for (let i = 0; i < this.NX; i++) {
                    const idx = i + j * this.NX + k * this.NXNY;
                    if (this.flags[idx] !== 0) continue;

                    // Backtrace
                    let x = i - dt * this.u[idx] / this.cellSizeWorld[0];
                    let y = j - dt * this.v[idx] / this.cellSizeWorld[1];
                    let z = k - dt * this.w[idx] / this.cellSizeWorld[2];

                    // Clamp to grid bounds
                    x = Math.max(0, Math.min(this.NX - 1, x));
                    y = Math.max(0, Math.min(this.NY - 1, y));
                    z = Math.max(0, Math.min(this.NZ - 1, z));

                    // Trilinear interpolation
                    u_new[idx] = this.trilinearInterp(this.u, x, y, z);
                    v_new[idx] = this.trilinearInterp(this.v, x, y, z);
                    w_new[idx] = this.trilinearInterp(this.w, x, y, z);
                }
            }
        }
        this.u = u_new;
        this.v = v_new;
        this.w = w_new;
    }

   project(dt) {
        const N = this.NX * this.NY * this.NZ;

        const hx = this.cellSizeWorld[0];
        const hy = this.cellSizeWorld[1];
        const hz = this.cellSizeWorld[2];

        const ax = 1.0 / (hx * hx);
        const ay = 1.0 / (hy * hy);
        const az = 1.0 / (hz * hz);
        const denom = 2.0 * (ax + ay + az);

        const div = new Float32Array(N);

        this.p.fill(0);

        if (!this.pTmp || this.pTmp.length !== N) {
            this.pTmp = new Float32Array(N);
        }

        const neighborFluid = (idx, nidx) => {
            return this.flags[nidx] === 0 ? nidx : idx;
        };

        // Compute negative divergence
        for (let k = 0; k < this.NZ; k++) {
            for (let j = 0; j < this.NY; j++) {
                for (let i = 0; i < this.NX; i++) {
                    const idx = i + j * this.NX + k * this.NXNY;
                    if (this.flags[idx] !== 0) continue;

                    const i1 = i + 1 < this.NX ? neighborFluid(idx, idx + 1) : idx;
                    const i2 = i - 1 >= 0      ? neighborFluid(idx, idx - 1) : idx;
                    const j1 = j + 1 < this.NY ? neighborFluid(idx, idx + this.NX) : idx;
                    const j2 = j - 1 >= 0      ? neighborFluid(idx, idx - this.NX) : idx;
                    const k1 = k + 1 < this.NZ ? neighborFluid(idx, idx + this.NXNY) : idx;
                    const k2 = k - 1 >= 0      ? neighborFluid(idx, idx - this.NXNY) : idx;

                    div[idx] = -(
                        (this.u[i1] - this.u[i2]) / (2.0 * hx) +
                        (this.v[j1] - this.v[j2]) / (2.0 * hy) +
                        (this.w[k1] - this.w[k2]) / (2.0 * hz)
                    );
                }
            }
        }

        let pOld = this.p;
        let pNew = this.pTmp;
        pNew.fill(0);

        const iterations = 40;

        for (let iter = 0; iter < iterations; iter++) {
            for (let k = 0; k < this.NZ; k++) {
                for (let j = 0; j < this.NY; j++) {
                    for (let i = 0; i < this.NX; i++) {
                        const idx = i + j * this.NX + k * this.NXNY;
                        if (this.flags[idx] !== 0) {
                            pNew[idx] = 0;
                            continue;
                        }

                        const i1 = i + 1 < this.NX ? neighborFluid(idx, idx + 1) : idx;
                        const i2 = i - 1 >= 0      ? neighborFluid(idx, idx - 1) : idx;
                        const j1 = j + 1 < this.NY ? neighborFluid(idx, idx + this.NX) : idx;
                        const j2 = j - 1 >= 0      ? neighborFluid(idx, idx - this.NX) : idx;
                        const k1 = k + 1 < this.NZ ? neighborFluid(idx, idx + this.NXNY) : idx;
                        const k2 = k - 1 >= 0      ? neighborFluid(idx, idx - this.NXNY) : idx;

                        pNew[idx] =
                            (
                                (pOld[i1] + pOld[i2]) * ax +
                                (pOld[j1] + pOld[j2]) * ay +
                                (pOld[k1] + pOld[k2]) * az +
                                div[idx]
                            ) / denom;
                    }
                }
            }

            const tmp = pOld;
            pOld = pNew;
            pNew = tmp;
        }

        // Make sure this.p contains final pressure
        if (pOld !== this.p) {
            this.p.set(pOld);
        }

        const p = this.p;

        // Subtract pressure gradient
        for (let k = 0; k < this.NZ; k++) {
            for (let j = 0; j < this.NY; j++) {
                for (let i = 0; i < this.NX; i++) {
                    const idx = i + j * this.NX + k * this.NXNY;
                    if (this.flags[idx] !== 0) {
                        this.u[idx] = 0;
                        this.v[idx] = 0;
                        this.w[idx] = 0;
                        continue;
                    }

                    const i1 = i + 1 < this.NX ? neighborFluid(idx, idx + 1) : idx;
                    const i2 = i - 1 >= 0      ? neighborFluid(idx, idx - 1) : idx;
                    const j1 = j + 1 < this.NY ? neighborFluid(idx, idx + this.NX) : idx;
                    const j2 = j - 1 >= 0      ? neighborFluid(idx, idx - this.NX) : idx;
                    const k1 = k + 1 < this.NZ ? neighborFluid(idx, idx + this.NXNY) : idx;
                    const k2 = k - 1 >= 0      ? neighborFluid(idx, idx - this.NXNY) : idx;

                    this.u[idx] -= (p[i1] - p[i2]) / (2.0 * hx);
                    this.v[idx] -= (p[j1] - p[j2]) / (2.0 * hy);
                    this.w[idx] -= (p[k1] - p[k2]) / (2.0 * hz);
                }
            }
        }
    }

    diffuse(dt) {
        const u_new = new Float32Array(N);
        const v_new = new Float32Array(N);
        const w_new = new Float32Array(N);
        const diff = dt * nu;
        
        for (let k = 0; k < this.NZ; k++) {
            for (let j = 0; j < this.NY; j++) {
                for (let i = 0; i < this.NX; i++) {
                    const idx = i + j * this.NX + k * this.NXNY;
                    if (this.flags[idx] !== 0) continue;

                    const i1 = this.neighborOrSelf(idx, i + 1 < this.NX ? idx + 1 : idx);
                    const i2 = this.neighborOrSelf(idx, i - 1 >= 0 ? idx - 1 : idx);
                    const j1 = this.neighborOrSelf(idx, j + 1 < this.NY ? idx + this.NX : idx);
                    const j2 = this.neighborOrSelf(idx, j - 1 >= 0 ? idx - this.NX : idx);
                    const k1 = this.neighborOrSelf(idx, k + 1 < this.NZ ? idx + this.NXNY : idx);
                    const k2 = this.neighborOrSelf(idx, k - 1 >= 0 ? idx - this.NXNY : idx);
                    
                    u_new[idx] = this.u[idx] + diff * (this.u[i1] + this.u[i2] + this.u[j1] + this.u[j2] + this.u[k1] + this.u[k2] - 6 * this.u[idx]);
                    v_new[idx] = this.v[idx] + diff * (this.v[i1] + this.v[i2] + this.v[j1] + this.v[j2] + this.v[k1] + this.v[k2] - 6 * this.v[idx]);
                    w_new[idx] = this.w[idx] + diff * (this.w[i1] + this.w[i2] + this.w[j1] + this.w[j2] + this.w[k1] + this.w[k2] - 6 * this.w[idx]);
                }
            }
        }
        this.u = u_new;
        this.v = v_new;
        this.w = w_new;

    }

    trilinearInterp(field, x, y, z) {
        // Clamp FIRST
        x = Math.max(0, Math.min(this.NX - 1.001, x));
        y = Math.max(0, Math.min(this.NY - 1.001, y));
        z = Math.max(0, Math.min(this.NZ - 1.001, z));

        const i0 = Math.floor(x);
        const j0 = Math.floor(y);
        const k0 = Math.floor(z);

        const i1 = Math.min(i0 + 1, this.NX - 1);
        const j1 = Math.min(j0 + 1, this.NY - 1);
        const k1 = Math.min(k0 + 1, this.NZ - 1);

        const sx = x - i0;
        const sy = y - j0;
        const sz = z - k0;

        const idx = (i, j, k) => i + j * this.NX + k * this.NXNY;

        const c000 = field[idx(i0, j0, k0)];
        const c100 = field[idx(i1, j0, k0)];
        const c010 = field[idx(i0, j1, k0)];
        const c110 = field[idx(i1, j1, k0)];
        const c001 = field[idx(i0, j0, k1)];
        const c101 = field[idx(i1, j0, k1)];
        const c011 = field[idx(i0, j1, k1)];
        const c111 = field[idx(i1, j1, k1)];

        return (
            (1 - sx) * (1 - sy) * (1 - sz) * c000 +
            sx       * (1 - sy) * (1 - sz) * c100 +
            (1 - sx) * sy       * (1 - sz) * c010 +
            sx       * sy       * (1 - sz) * c110 +
            (1 - sx) * (1 - sy) * sz       * c001 +
            sx       * (1 - sy) * sz       * c101 +
            (1 - sx) * sy       * sz       * c011 +
            sx       * sy       * sz       * c111
        );
    }
    
    interpolateVelocity(x, y, z) {
        return [
            this.trilinearInterp(this.u, x, y, z),
            this.trilinearInterp(this.v, x, y, z),
            this.trilinearInterp(this.w, x, y, z)
        ];
    }

}
