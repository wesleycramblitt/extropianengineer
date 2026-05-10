import { quat } from "/scripts/math/quat.js";
import Grid from "/scripts/simulation/grid.js";

// Grid with current state in each cell: pressure, velocity, solid, etc.
// Semi-implicit Euler integration
// Finite Difference Method (FDM) Stable Fluids solver

export class CFDSimulator {
    constructor(entities, settings) {
        this.particleCount = settings.particleCount || 1000;
        
        this.grid = new Grid(settings);

        this.particles = new Particles(settings);
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

        this.integrator = new CFDIntegrator();

        // Solids/boundaries within grid (0: fluid, !=0: solid/boundary)
        this.flags = new Float32Array(N);
        this.entities = entities;

        this.updateSolidFlagsFromEntities();
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
    
    step(dt) {

        this.integator.step(dt);

        this.particles.update();
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

}
