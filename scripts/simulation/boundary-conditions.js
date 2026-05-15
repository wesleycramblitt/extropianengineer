/**
 * Boundary Conditions – reusable solid-wall no-slip / no-penetration operators.
 *
 * These are pure functions that mutate the velocity arrays in-place.
 * They are solver-agnostic: FDM, FVM, or any other discretization that
 * uses the same velocity-per-cell arrays and solid-flags array can call them.
 */

/**
 * Zero out velocity inside any cell marked solid.
 * (Ensures there is never residual velocity inside geometry.)
 *
 * @param {Grid}          grid
 * @param {Float32Array}  u     – x-velocity
 * @param {Float32Array}  v     – y-velocity
 * @param {Float32Array}  w     – z-velocity
 * @param {Float32Array}  flags – solid flag (0 = fluid, ≠0 = solid)
 */
export function enforceSolidVelocities(grid, u, v, w, flags) {
    const N = grid.N;
    for (let idx = 0; idx < N; idx++) {
        if (flags[idx] !== 0) {
            u[idx] = 0;
            v[idx] = 0;
            w[idx] = 0;
        }
    }
}

/**
 * Inject continuous inflow at the domain face(s) determined by wind direction.
 *
 * This is a Dirichlet boundary condition: the velocity at the inlet layer is
 * force-set to the ambient wind each timestep.  Without this, the velocity
 * field decays to zero because every timestep the solver dissipates momentum
 * through boundary interactions and projection with no source term.
 *
 * Inlet face is inferred from the sign of each wind component:
 *   wind[0] < 0  →  inlet at i = NX-1 (right face)
 *   wind[0] > 0  →  inlet at i = 0     (left face)
 *   (same logic for Y and Z)
 *
 * @param {Grid}          grid
 * @param {Float32Array}  u     – x-velocity
 * @param {Float32Array}  v     – y-velocity
 * @param {Float32Array}  w     – z-velocity
 * @param {Float32Array}  flags – solid flag (0 = fluid, ≠0 = solid)
 * @param {number}        [thickness=2] – number of cell layers at the inlet face
 */
export function enforceInletVelocity(grid, u, v, w, flags, thickness = 2) {
    const wind = grid.WIND_SPEED;
    const { NX, NY, NZ } = grid;

    // ── X-inlet ──────────────────────────────────────────────────
    if (wind[0] !== 0) {
        const iInlet  = wind[0] < 0 ? NX - 1 : 0;          // which face
        const iStep   = wind[0] < 0 ? -1     : 1;           // direction into domain
        for (let k = 0; k < NZ; k++) {
            for (let j = 0; j < NY; j++) {
                for (let d = 0; d < thickness; d++) {
                    const i = iInlet + d * iStep;
                    if (i < 0 || i >= NX) break;
                    const idx = grid.idx(i, j, k);
                    if (flags[idx] !== 0) continue;
                    u[idx] = wind[0];
                    v[idx] = wind[1];
                    w[idx] = wind[2];
                }
            }
        }
    }

    // ── Y-inlet ──────────────────────────────────────────────────
    if (wind[1] !== 0) {
        const jInlet  = wind[1] < 0 ? NY - 1 : 0;
        const jStep   = wind[1] < 0 ? -1     : 1;
        for (let k = 0; k < NZ; k++) {
            for (let i = 0; i < NX; i++) {
                for (let d = 0; d < thickness; d++) {
                    const j = jInlet + d * jStep;
                    if (j < 0 || j >= NY) break;
                    const idx = grid.idx(i, j, k);
                    if (flags[idx] !== 0) continue;
                    u[idx] = wind[0];
                    v[idx] = wind[1];
                    w[idx] = wind[2];
                }
            }
        }
    }

    // ── Z-inlet ──────────────────────────────────────────────────
    if (wind[2] !== 0) {
        const kInlet  = wind[2] < 0 ? NZ - 1 : 0;
        const kStep   = wind[2] < 0 ? -1     : 1;
        for (let j = 0; j < NY; j++) {
            for (let i = 0; i < NX; i++) {
                for (let d = 0; d < thickness; d++) {
                    const k = kInlet + d * kStep;
                    if (k < 0 || k >= NZ) break;
                    const idx = grid.idx(i, j, k);
                    if (flags[idx] !== 0) continue;
                    u[idx] = wind[0];
                    v[idx] = wind[1];
                    w[idx] = wind[2];
                }
            }
        }
    }
}

export function enforceNoPenetration(grid, u, v, w, flags) {
    const { NX, NY, NZ, NXNY } = grid;

    for (let k = 0; k < NZ; k++) {
        for (let j = 0; j < NY; j++) {
            for (let i = 0; i < NX; i++) {
                const idx = grid.idx(i, j, k);

                // skip solid cells — their velocity is forced to zero elsewhere
                if (flags[idx] !== 0) continue;

                // left neighbor solid ? zero negative x-velocity
                if (i > 0        && flags[idx - 1] !== 0    && u[idx] < 0) u[idx] = 0;
                // right neighbor solid ? zero positive x-velocity
                if (i < NX - 1   && flags[idx + 1] !== 0    && u[idx] > 0) u[idx] = 0;
                // down neighbor solid ? zero negative y-velocity
                if (j > 0        && flags[idx - NX] !== 0    && v[idx] < 0) v[idx] = 0;
                // up neighbor solid ? zero positive y-velocity
                if (j < NY - 1   && flags[idx + NX] !== 0    && v[idx] > 0) v[idx] = 0;
                // back neighbor solid ? zero negative z-velocity
                if (k > 0        && flags[idx - NXNY] !== 0  && w[idx] < 0) w[idx] = 0;
                // front neighbor solid ? zero positive z-velocity
                if (k < NZ - 1   && flags[idx + NXNY] !== 0  && w[idx] > 0) w[idx] = 0;
            }
        }
    }
}
