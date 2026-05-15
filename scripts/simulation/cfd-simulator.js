/**
 * CFDSimulator – high-level orchestrator for the CFD simulation.
 *
 * Responsibilities:
 *   • Owns the grid, velocity / pressure arrays, solid flags, and scratch buffers.
 *   • Creates and wires together the solver (injectable strategy) and tracer particles.
 *   • Exposes particle position / velocity arrays for the GPU-side renderer.
 *   • Provides the velocity-field lookup callback consumed by the particle tracer.
 *   • Handles solid-boundary voxelisation from entity meshes.
 *
 * Extensibility:
 *   The `solverFactory` option lets callers inject FVM, implicit, or custom
 *   solvers without touching this file.  The solver must accept the same
 *   buffer references and expose a `step(dt)` method.
 */

import { Grid }                           from "/scripts/simulation/grid.js";
import { FDMStableFluidsSolver }           from "/scripts/simulation/cfd-integrator.js";
import { Particles }                       from "/scripts/simulation/particles.js";
import { enforceNoPenetration, enforceSolidVelocities, enforceInletVelocity }
    from "/scripts/simulation/boundary-conditions.js";
import { voxelizeMeshSurface }             from "/scripts/simulation/voxel.js";

export class CFDSimulator {
    /**
     * @param {Array<object>} entities – scene entities; used for solid voxelisation
     * @param {object}        settings
     * @param {number}        settings.particleCount – number of tracer particles
     * @param {number}        [settings.nx] – grid resolution X
     * @param {number}        [settings.ny] – grid resolution Y
     * @param {number}        [settings.nz] – grid resolution Z
     * @param {Array<number>} [settings.wind_speed] – ambient wind [ux, uy, uz]
     * @param {number}        [settings.nu] – kinematic viscosity
     * @param {number}        [settings.rho] – density
     * @param {function}      [settings.solverFactory] – ({grid,u,v,w,p,flags,...}) => solver
     */
    constructor(entities = [], settings = {}) {
        // ── grid ─────────────────────────────────────────────────
        this.grid = new Grid(settings);

        // ── primary arrays ───────────────────────────────────────
        const N = this.grid.N;
        this.u     = new Float32Array(N);
        this.v     = new Float32Array(N);
        this.w     = new Float32Array(N);
        this.p     = new Float32Array(N);
        this.flags = new Float32Array(N);   // 0 = fluid, 1 = solid

        // ── scratch buffers (pre-allocated, never new'd per frame) ──
        this.uTmp = new Float32Array(N);
        this.vTmp = new Float32Array(N);
        this.wTmp = new Float32Array(N);
        this.pTmp = new Float32Array(N);
        this.div  = new Float32Array(N);

        // ── initialise velocity field ────────────────────────────
        const wind = this.grid.WIND_SPEED;
        for (let i = 0; i < N; i++) {
            this.u[i] = wind[0];
            this.v[i] = wind[1];
            this.w[i] = wind[2];
        }

        // ── solid voxelisation from entity meshes ────────────────
        this.entities = entities;
        this.updateSolidFlagsFromEntities();

        // ── solver (injectable strategy) ─────────────────────────
        const factory = settings.solverFactory || defaultSolverFactory;
        this.solver = factory({
            grid:  this.grid,
            u:     this.u,
            v:     this.v,
            w:     this.w,
            p:     this.p,
            flags: this.flags,
            uTmp:  this.uTmp,
            vTmp:  this.vTmp,
            wTmp:  this.wTmp,
            pTmp:  this.pTmp,
            div:   this.div,
        });

        // ── particle tracer ──────────────────────────────────────
        this.particles = new Particles({
            grid:           this.grid,
            particleCount:  settings.particleCount || 1000,
            getVelocityAt:  (wx, wy, wz) => this.getVelocityAt(wx, wy, wz),
        });

        // Expose for GPU renderer (Float32Array by reference — no copies)
        this.positions  = this.particles.positions;
        this.velocities = this.particles.velocities;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Per-frame simulation step
    // ═══════════════════════════════════════════════════════════════════

    step(dt) {
        // 1. Solve velocity field: forces → diffuse → advect → project
        this.solver.step(dt);

        // 2. Enforce boundary conditions
        enforceInletVelocity(this.grid, this.u, this.v, this.w, this.flags);
        enforceSolidVelocities(this.grid, this.u, this.v, this.w, this.flags);
        enforceNoPenetration(this.grid, this.u, this.v, this.w, this.flags);

        // 3. Advect tracer particles through the updated velocity field
        this.particles.update(dt);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Velocity-field access
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Interpolate velocity at an arbitrary world-space position.
     * Used as the callback for particle advection.
     *
     * @param {number} wx – world X
     * @param {number} wy – world Y
     * @param {number} wz – world Z
     * @returns {[number, number, number]} interpolated velocity
     */
    getVelocityAt(wx, wy, wz) {
        const [gx, gy, gz] = this.grid.worldToGrid([wx, wy, wz]);

        // Clamp to grid interior
        const cx = Math.max(0, Math.min(this.grid.NX - 1.001, gx));
        const cy = Math.max(0, Math.min(this.grid.NY - 1.001, gy));
        const cz = Math.max(0, Math.min(this.grid.NZ - 1.001, gz));

        return this.solver.interpolateVelocity(cx, cy, cz);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Solid-boundary voxelisation
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Rebuild the solid-flags array from the collision-entity meshes.
     * Call this when solid geometry moves or changes.
     */
    updateSolidFlagsFromEntities() {
        this.flags.fill(0);

        for (const entity of this.entities) {
            if (entity.collision !== 1 || !entity.mesh) continue;

            // Extract positions + indices from the mesh’s original data
            const mesh = entity.mesh;
            const data = {
                positions: mesh.positions,
                indices:   mesh.indices,
            };

            voxelizeMeshSurface(this.grid, this.flags, data);
        }

        // Immediately zero-out velocity inside geometry
        enforceSolidVelocities(this.grid, this.u, this.v, this.w, this.flags);
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  Default solver factory (explicit Euler FDM)
// ═══════════════════════════════════════════════════════════════════════

function defaultSolverFactory(opts) {
    return new FDMStableFluidsSolver(opts);
}
