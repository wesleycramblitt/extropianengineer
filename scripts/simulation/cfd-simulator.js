import { quat } from "/scripts/math/quat.js";

// Grid with current state in each cell: pressure, velocity, solid, etc.
// Semi-implicit Euler integration
// Finite Difference Method (FDM) Stable Fluids solver

export class CFDSimulator {
    constructor(entities, settings) {
        this.particleCount = settings.particleCount || 1000;
        this.NX = settings.nx || 32;
        this.NY = settings.ny || 32;
        this.NZ = settings.nz || 32;
        this.NXNY = this.NX * this.NY;

        this.rho = settings.rho || 1.225; // air density (kg/m^3)
        this.nu = settings.nu || 1.5e-5; // kinematic viscosity (m^2/s)
        this.WIND_SPEED = [-2, 0, 0];

        this.xMin = -1.5;// this.originWorld[0];
        this.xMax = 1.5;//this.originWorld[0] + this.NX * this.cellSizeWorld[0];

        this.yMin = -0.8;//this.originWorld[1];
        this.yMax = 0.8;//this.originWorld[1] + this.NY * this.cellSizeWorld[1];

        this.zMin = -0.8//this.originWorld[2];
        this.zMax = 0.8//this.originWorld[2] + this.NZ * this.cellSizeWorld[2];

        this.originWorld = settings.origin_world || [this.xMin, this.yMin, this.zMin];
        this.cellSizeWorld = [
            (this.xMax - this.xMin) / (this.NX - 1),
            (this.yMax - this.yMin) / (this.NY - 1),
            (this.zMax - this.zMin) / (this.NZ - 1),
        ];
        const N = this.NX * this.NY * this.NZ;

        // Velocity vectors
        this.u = new Float32Array(N);
        this.v = new Float32Array(N);
        this.w = new Float32Array(N);

        for (let i = 0; i < this.u.length; i++) {
            this.u[i] = this.WIND_SPEED[0];            
            this.v[i] = this.WIND_SPEED[1];            
            this.w[i] = this.WIND_SPEED[2];            
        }

        // Pressure
        this.p = new Float32Array(N);
        // Solids/boundaries within grid (0: fluid, !=0: solid/boundary)
        this.flags = new Float32Array(N);
        this.entities = entities;

        this.generateParticles();

        this.updateSolidFlagsFromEntities();
    }

    generateParticles() {
        // Particles in world coordinates
        // positions = [x0, y0, z0, x1, y1, z1, ...]
        // velocities = [vx0, vy0, vz0, vx1, vy1, vz1, ...]

        //TODO: make this method work for all different wind speeds, for now we are assuming +X start
        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);

        for (let p = 0; p < this.particleCount; p++) {

            const base = p * 3;

            this.respawnParticle(base);
        }


    }

    gridToWorld(gridPos) {
        const [i, j, k] = gridPos;
        return [
            this.originWorld[0] + i * this.cellSizeWorld[0],
            this.originWorld[1] + j * this.cellSizeWorld[1],
            this.originWorld[2] + k * this.cellSizeWorld[2]
        ];
    }

    worldToGrid(worldPos) {
        return [
            (worldPos[0] - this.originWorld[0]) / this.cellSizeWorld[0],
            (worldPos[1] - this.originWorld[1]) / this.cellSizeWorld[1],
            (worldPos[2] - this.originWorld[2]) / this.cellSizeWorld[2]
        ];
    }

    voxelizeMeshSurface(mesh) {
        const { positions, indices } = mesh;

        if (!positions || !indices) return;

        for (let t = 0; t < indices.length; t += 3) {
            const ia = indices[t + 0] * 3;
            const ib = indices[t + 1] * 3;
            const ic = indices[t + 2] * 3;

            const a = [positions[ia + 0], positions[ia + 1], positions[ia + 2]];
            const b = [positions[ib + 0], positions[ib + 1], positions[ib + 2]];
            const c = [positions[ic + 0], positions[ic + 1], positions[ic + 2]];

            this.voxelizeTriangleSurface(a, b, c);
        }
    }

    
    voxelizeTriangleSurface(aWorld, bWorld, cWorld) {
        const a = this.worldToGrid(aWorld);
        const b = this.worldToGrid(bWorld);
        const c = this.worldToGrid(cWorld);

        const thickness = 1; // in grid-cell units

        const minI = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]) - thickness));
        const minJ = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]) - thickness));
        const minK = Math.max(0, Math.floor(Math.min(a[2], b[2], c[2]) - thickness));

        const maxI = Math.min(this.NX - 1, Math.ceil(Math.max(a[0], b[0], c[0]) + thickness));
        const maxJ = Math.min(this.NY - 1, Math.ceil(Math.max(a[1], b[1], c[1]) + thickness));
        const maxK = Math.min(this.NZ - 1, Math.ceil(Math.max(a[2], b[2], c[2]) + thickness));

        for (let k = minK; k <= maxK; k++) {
            for (let j = minJ; j <= maxJ; j++) {
                for (let i = minI; i <= maxI; i++) {
                    const p = [i + 0.5, j + 0.5, k + 0.5];

                    if (this.pointNearTriangle(p, a, b, c, thickness)) {
                        const idx = i + j * this.NX + k * this.NXNY;
                        this.flags[idx] = 1;
                    }
                }
            }
        }
    }

    pointNearTriangle(p, a, b, c, thickness) {
        const q = this.closestPointOnTriangle(p, a, b, c);

        const dx = p[0] - q[0];
        const dy = p[1] - q[1];
        const dz = p[2] - q[2];

        return dx * dx + dy * dy + dz * dz <= thickness * thickness;
    }

    closestPointOnTriangle(p, a, b, c) {
        const ab = this.sub(b, a);
        const ac = this.sub(c, a);
        const ap = this.sub(p, a);

        const d1 = this.dot(ab, ap);
        const d2 = this.dot(ac, ap);

        if (d1 <= 0 && d2 <= 0) return a;

        const bp = this.sub(p, b);
        const d3 = this.dot(ab, bp);
        const d4 = this.dot(ac, bp);

        if (d3 >= 0 && d4 <= d3) return b;

        const vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            return this.add(a, this.mul(ab, v));
        }

        const cp = this.sub(p, c);
        const d5 = this.dot(ab, cp);
        const d6 = this.dot(ac, cp);

        if (d6 >= 0 && d5 <= d6) return c;

        const vb = d5 * d2 - d1 * d6;
        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            const w = d2 / (d2 - d6);
            return this.add(a, this.mul(ac, w));
        }

        const va = d3 * d6 - d5 * d4;
        if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
            const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
            return this.add(b, this.mul(this.sub(c, b), w));
        }

        const denom = 1 / (va + vb + vc);
        const v = vb * denom;
        const w = vc * denom;

        return this.add(a, this.add(this.mul(ab, v), this.mul(ac, w)));
    }

    sub(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    add(a, b) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    mul(a, s) {
        return [a[0] * s, a[1] * s, a[2] * s];
    }

    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    updateSolidFlagsFromEntities() {
        this.flags.fill(0);

        for (const entity of this.entities) {
            if (entity.collision !== 1 || !entity.mesh) continue;
                this.voxelizeMeshSurface(entity.mesh);
        }

        this.enforceSolidVelocities();
    }
    
    enforceSolidVelocities() {
        const N = this.NX * this.NY * this.NZ;

        for (let idx = 0; idx < N; idx++) {
            if (this.flags[idx] !== 0) {
                this.u[idx] = 0;
                this.v[idx] = 0;
                this.w[idx] = 0;
            }
        }
    }

    isSolidGrid(x, y, z) {
        const i = Math.floor(x);
        const j = Math.floor(y);
        const k = Math.floor(z);

        if (i < 0 || j < 0 || k < 0 || i >= this.NX || j >= this.NY || k >= this.NZ) {
            return true;
        }

        return this.flags[i + j * this.NX + k * this.NXNY] !== 0;
    }

    neighborOrSelf(idx, nidx) {
        if (nidx < 0 || nidx >= this.flags.length) return idx;
        return this.flags[nidx] === 0 ? nidx : idx;
    }

    respawnParticle(base) {
        const mx = this.cellSizeWorld[0] * 2.0;
        const my = this.cellSizeWorld[1] * 2.0;
        const mz = this.cellSizeWorld[2] * 2.0;

        this.positions[base + 0] = this.xMax - mx;
        this.positions[base + 1] = this.yMin + my + Math.random() * (this.yMax - this.yMin - 2 * my );
        this.positions[base + 2] = this.zMin + mz + Math.random() * (this.zMax - this.zMin - 2 * mz );

        this.velocities[base + 0] = this.WIND_SPEED[0];
        this.velocities[base + 1] = this.WIND_SPEED[1];
        this.velocities[base + 2] = this.WIND_SPEED[2];
    }   
    
    step(dt) {
        const N = this.NX * this.NY * this.NZ;
        const nu = this.nu;
        const wind = this.WIND_SPEED;

        // Reset pressure field
        this.p.fill(0);
        const i = this.NX - 1; // xMax side, since wind is negative X

        for (let k = 0; k < this.NZ; k++) {
            for (let j = 0; j < this.NY; j++) {
              const idx = i + j * this.NX + k * this.NXNY;
              if (this.flags[idx] !== 0) continue;

              this.u[idx] = this.WIND_SPEED[0];
              this.v[idx] = this.WIND_SPEED[1];
              this.w[idx] = this.WIND_SPEED[2];
            }
          }
       
        // 2. Diffuse velocity (Explicit Euler)
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
        this.enforceNoPenetration();

        // 3. Project (make divergence free)
        this.project();

        this.enforceNoPenetration();
        // 4. Advect velocity
        this.advect(dt);

        this.enforceNoPenetration();
        // 5. Project again
        this.project();

        this.enforceNoPenetration();
        // 6. Update particles
        if (this.positions && this.velocities) {

            const particleCount = this.positions.length / 3;

            for (let p = 0; p < particleCount; p++) {

                const base = p * 3;

                const pos = [
                    this.positions[base + 0],
                    this.positions[base + 1],
                    this.positions[base + 2],
                ];

                const [gx, gy, gz] = this.worldToGrid(pos);
                const velGrid = this.interpolateVelocity(gx, gy, gz);

                this.velocities[base + 0] = velGrid[0];
                this.velocities[base + 1] = velGrid[1];
                this.velocities[base + 2] = velGrid[2];

                const nextX = this.positions[base + 0] + dt * velGrid[0];
                const nextY = this.positions[base + 1] + dt * velGrid[1];
                const nextZ = this.positions[base + 2] + dt * velGrid[2];

                const [ngx, ngy, ngz] = this.worldToGrid([nextX, nextY, nextZ]);

                if (!this.isSolidGrid(ngx, ngy, ngz)) {
                    this.positions[base + 0] = nextX;
                    this.positions[base + 1] = nextY;
                    this.positions[base + 2] = nextZ;
                } 
                
                //Move particles to other side once out of bounds
                if (
                    this.positions[base + 0] <= this.xMin +0.15 ||
                    this.positions[base + 0] >= this.xMax  ||
                    this.positions[base + 1] <= this.yMin ||
                    this.positions[base + 1] >= this.yMax ||
                    this.positions[base + 2] <= this.zMin ||
                    this.positions[base + 2] >= this.zMax
                ) {
                    this.respawnParticle(base);
                }
            }
        }
    }

    isSolidIndex(idx) {
        return idx < 0 || idx >= this.flags.length || this.flags[idx] !== 0;
    }

    enforceNoPenetration() {
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

                    const left  = i > 0 ? idx - 1 : -1;
                    const right = i < this.NX - 1 ? idx + 1 : -1;
                    const down  = j > 0 ? idx - this.NX : -1;
                    const up    = j < this.NY - 1 ? idx + this.NX : -1;
                    const back  = k > 0 ? idx - this.NXNY : -1;
                    const front = k < this.NZ - 1 ? idx + this.NXNY : -1;

                    // If moving into a solid neighbor, remove that component.
                    if (this.isSolidIndex(left) && this.u[idx] < 0) this.u[idx] = 0;
                    if (this.isSolidIndex(right) && this.u[idx] > 0) this.u[idx] = 0;

                    if (this.isSolidIndex(down) && this.v[idx] < 0) this.v[idx] = 0;
                    if (this.isSolidIndex(up) && this.v[idx] > 0) this.v[idx] = 0;

                    if (this.isSolidIndex(back) && this.w[idx] < 0) this.w[idx] = 0;
                    if (this.isSolidIndex(front) && this.w[idx] > 0) this.w[idx] = 0;
                }
            }
        }
    }

   project() {
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
