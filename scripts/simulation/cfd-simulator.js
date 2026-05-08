import { quat } from "/scripts/math/quat.js";

// Grid with current state in each cell: pressure, velocity, solid, etc.
// Semi-implicit Euler integration
// Finite Difference Method (FDM) Stable Fluids solver

export class CFDSimulator {
    constructor(entities, settings) {
        this.originWorld = settings.origin_world || [0, 0, 0];
        this.cellSizeWorld = settings.cell_size_world || [0.1, 0.1, 0.1];
        this.NX = settings.nx || 100;
        this.NY = settings.ny || 100;
        this.NZ = settings.nz || 100;
        this.NXNY = this.NX * this.NY;

        this.rho = settings.rho || 1.225; // air density (kg/m^3)
        this.nu = settings.nu || 1.5e-5; // kinematic viscosity (m^2/s)
        this.WIND_SPEED = settings.wind_speed || [-1, 0, 0];

        const N = this.NX * this.NY * this.NZ;
        // Velocity vectors
        this.u = new Float32Array(N);
        this.v = new Float32Array(N);
        this.w = new Float32Array(N);
        // Pressure
        this.p = new Float32Array(N);
        // Solids/boundaries within grid (0: fluid, !=0: solid/boundary)
        this.flags = new Float32Array(N);
        this.entities = entities;

        // Particles in world coordinates
        this.positions = [];
        this.velocities = [];
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

    step(dt) {
        const N = this.NX * this.NY * this.NZ;
        const nu = this.nu;
        const wind = this.WIND_SPEED;

        // Reset pressure field
        this.p.fill(0);

        // 1. Add forces (wind)
        for (let i = 0; i < N; i++) {
            if (this.flags[i] === 0) {
                this.u[i] += dt * wind[0];
                this.v[i] += dt * wind[1];
                this.w[i] += dt * wind[2];
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

                    const i1 = i + 1 < this.NX ? idx + 1 : idx;
                    const i2 = i - 1 >= 0 ? idx - 1 : idx;
                    const j1 = j + 1 < this.NY ? idx + this.NX : idx;
                    const j2 = j - 1 >= 0 ? idx - this.NX : idx;
                    const k1 = k + 1 < this.NZ ? idx + this.NXNY : idx;
                    const k2 = k - 1 >= 0 ? idx - this.NXNY : idx;

                    u_new[idx] = this.u[idx] + diff * (this.u[i1] + this.u[i2] + this.u[j1] + this.u[j2] + this.u[k1] + this.u[k2] - 6 * this.u[idx]);
                    v_new[idx] = this.v[idx] + diff * (this.v[i1] + this.v[i2] + this.v[j1] + this.v[j2] + this.v[k1] + this.v[k2] - 6 * this.v[idx]);
                    w_new[idx] = this.w[idx] + diff * (this.w[i1] + this.w[i2] + this.w[j1] + this.w[j2] + this.w[k1] + this.w[k2] - 6 * this.w[idx]);
                }
            }
        }
        this.u = u_new;
        this.v = v_new;
        this.w = w_new;

        // 3. Project (make divergence free)
        this.project();

        // 4. Advect velocity
        this.advect(dt);

        // 5. Project again
        this.project();

        // 6. Update particles
        if (this.positions && this.velocities) {
            for (let p = 0; p < this.positions.length; p++) {
                const pos = this.positions[p];
                const vel = this.velocities[p];
                
                const gridPos = this.worldToGrid(pos);
                const [gx, gy, gz] = gridPos;
                const velGrid = this.interpolateVelocity(gx, gy, gz);
                
                vel[0] = velGrid[0];
                vel[1] = velGrid[1];
                vel[2] = velGrid[2];
                
                pos[0] += dt * vel[0];
                pos[1] += dt * vel[1];
                pos[2] += dt * vel[2];
            }
        }
    }

    project() {
        const N = this.NX * this.NY * this.NZ;
        const h = 1.0; // grid spacing
        const p = this.p;
        const div = new Float32Array(N);
        
        // Compute divergence
        for (let k = 0; k < this.NZ; k++) {
            for (let j = 0; j < this.NY; j++) {
                for (let i = 0; i < this.NX; i++) {
                    const idx = i + j * this.NX + k * this.NXNY;
                    if (this.flags[idx] !== 0) continue;

                    const i1 = i + 1 < this.NX ? idx + 1 : idx;
                    const i2 = i - 1 >= 0 ? idx - 1 : idx;
                    const j1 = j + 1 < this.NY ? idx + this.NX : idx;
                    const j2 = j - 1 >= 0 ? idx - this.NX : idx;
                    const k1 = k + 1 < this.NZ ? idx + this.NXNY : idx;
                    const k2 = k - 1 >= 0 ? idx - this.NXNY : idx;

                    div[idx] = -0.5 * (this.u[i1] - this.u[i2] + this.v[j1] - this.v[j2] + this.w[k1] - this.w[k2]) / h;
                }
            }
        }

        // Jacobi iteration for pressure
        const iterations = 20;
        for (let iter = 0; iter < iterations; iter++) {
            for (let k = 0; k < this.NZ; k++) {
                for (let j = 0; j < this.NY; j++) {
                    for (let i = 0; i < this.NX; i++) {
                        const idx = i + j * this.NX + k * this.NXNY;
                        if (this.flags[idx] !== 0) continue;

                        const i1 = i + 1 < this.NX ? idx + 1 : idx;
                        const i2 = i - 1 >= 0 ? idx - 1 : idx;
                        const j1 = j + 1 < this.NY ? idx + this.NX : idx;
                        const j2 = j - 1 >= 0 ? idx - this.NX : idx;
                        const k1 = k + 1 < this.NZ ? idx + this.NXNY : idx;
                        const k2 = k - 1 >= 0 ? idx - this.NXNY : idx;

                        p[idx] = (p[i1] + p[i2] + p[j1] + p[j2] + p[k1] + p[k2] + div[idx]) / 6;
                    }
                }
            }
        }

        // Subtract pressure gradient
        for (let k = 0; k < this.NZ; k++) {
            for (let j = 0; j < this.NY; j++) {
                for (let i = 0; i < this.NX; i++) {
                    const idx = i + j * this.NX + k * this.NXNY;
                    if (this.flags[idx] !== 0) continue;

                    const i1 = i + 1 < this.NX ? idx + 1 : idx;
                    const i2 = i - 1 >= 0 ? idx - 1 : idx;
                    const j1 = j + 1 < this.NY ? idx + this.NX : idx;
                    const j2 = j - 1 >= 0 ? idx - this.NX : idx;
                    const k1 = k + 1 < this.NZ ? idx + this.NXNY : idx;
                    const k2 = k - 1 >= 0 ? idx - this.NXNY : idx;

                    this.u[idx] -= 0.5 * (p[i1] - p[i2]) / h;
                    this.v[idx] -= 0.5 * (p[j1] - p[j2]) / h;
                    this.w[idx] -= 0.5 * (p[k1] - p[k2]) / h;
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
                    let x = i - dt * this.u[idx];
                    let y = j - dt * this.v[idx];
                    let z = k - dt * this.w[idx];

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
        const i = Math.floor(x);
        const j = Math.floor(y);
        const k = Math.floor(z);
        const i1 = Math.min(i + 1, this.NX - 1);
        const j1 = Math.min(j + 1, this.NY - 1);
        const k1 = Math.min(k + 1, this.NZ - 1);
        const i0 = Math.max(i, 0);
        const j0 = Math.max(j, 0);
        const k0 = Math.max(k, 0);

        const sx = x - i0;
        const sy = y - j0;
        const sz = z - k0;

        const i0j0k0 = i0 + j0 * this.NX + k0 * this.NXNY;
        const i1j0k0 = i1 + j0 * this.NX + k0 * this.NXNY;
        const i0j1k0 = i0 + j1 * this.NX + k0 * this.NXNY;
        const i1j1k0 = i1 + j1 * this.NX + k0 * this.NXNY;
        const i0j0k1 = i0 + j0 * this.NX + k1 * this.NXNY;
        const i1j0k1 = i1 + j0 * this.NX + k1 * this.NXNY;
        const i0j1k1 = i0 + j1 * this.NX + k1 * this.NXNY;
        const i1j1k1 = i1 + j1 * this.NX + k1 * this.NXNY;

        return (1 - sx) * (1 - sy) * (1 - sz) * field[i0j0k0] +
               sx * (1 - sy) * (1 - sz) * field[i1j0k0] +
               (1 - sx) * sy * (1 - sz) * field[i0j1k0] +
               sx * sy * (1 - sz) * field[i1j1k0] +
               (1 - sx) * (1 - sy) * sz * field[i0j0k1] +
               sx * (1 - sy) * sz * field[i1j0k1] +
               (1 - sx) * sy * sz * field[i0j1k1] +
               sx * sy * sz * field[i1j1k1];
    }

    interpolateVelocity(x, y, z) {
        return [
            this.trilinearInterp(this.u, x, y, z),
            this.trilinearInterp(this.v, x, y, z),
            this.trilinearInterp(this.w, x, y, z)
        ];
    }
}
