/**
 * Grid – geometric discretization of the simulation domain.
 *
 * Stores grid dimensions, cell sizes, domain bounds, and physical constants.
 * Provides index computation, coordinate transforms, bounds checks, and
 * neighbor utilities used by solvers, boundary conditions, and particle tracers.
 */
export class Grid {
    constructor(settings = {}) {
        // ── resolution ────────────────────────────────────────────────
        this.NX = settings.nx || 32;
        this.NY = settings.ny || 32;
        this.NZ = settings.nz || 32;
        this.NXNY = this.NX * this.NY;
        this.N = this.NX * this.NY * this.NZ;

        // ── physical constants ────────────────────────────────────────
        this.rho = settings.rho || 1.225;           // air density   (kg/m³)
        this.nu  = settings.nu  || 1.5e-5;          // kinematic viscosity (m²/s)
        this.WIND_SPEED = settings.wind_speed || [-2, 0, 0];

        // ── domain bounds (world coords) ──────────────────────────────
        this.xMin = settings.xMin ?? -1.5;
        this.xMax = settings.xMax ??  1.5;
        this.yMin = settings.yMin ?? -0.8;
        this.yMax = settings.yMax ??  0.8;
        this.zMin = settings.zMin ?? -0.8;
        this.zMax = settings.zMax ??  0.8;

        // origin of the grid in world space (corner -X, -Y, -Z)
        this.originWorld = settings.origin_world || [this.xMin, this.yMin, this.zMin];

        // ── cell size in each direction ───────────────────────────────
        this.cellSizeWorld = [
            (this.xMax - this.xMin) / (this.NX > 1 ? this.NX - 1 : 1),
            (this.yMax - this.yMin) / (this.NY > 1 ? this.NY - 1 : 1),
            (this.zMax - this.zMin) / (this.NZ > 1 ? this.NZ - 1 : 1),
        ];
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Index computation
    // ═══════════════════════════════════════════════════════════════════

    /** Flat array index for cell (i, j, k).  No bounds check. */
    idx(i, j, k) {
        return i + j * this.NX + k * this.NXNY;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Coordinate transforms
    // ═══════════════════════════════════════════════════════════════════

    /** Convert grid indices → world-space position (cell center). */
    gridToWorld(gridPos) {
        const [i, j, k] = gridPos;
        return [
            this.originWorld[0] + i * this.cellSizeWorld[0],
            this.originWorld[1] + j * this.cellSizeWorld[1],
            this.originWorld[2] + k * this.cellSizeWorld[2],
        ];
    }

    /** Convert world-space position → continuous grid coordinates. */
    worldToGrid(worldPos) {
        return [
            (worldPos[0] - this.originWorld[0]) / this.cellSizeWorld[0],
            (worldPos[1] - this.originWorld[1]) / this.cellSizeWorld[1],
            (worldPos[2] - this.originWorld[2]) / this.cellSizeWorld[2],
        ];
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Bounds checks
    // ═══════════════════════════════════════════════════════════════════

    /** Integer grid index inside the domain? */
    isInsideGrid(i, j, k) {
        return i >= 0 && i < this.NX &&
               j >= 0 && j < this.NY &&
               k >= 0 && k < this.NZ;
    }

    /** World position inside the axis-aligned domain box? */
    isInsideWorld(worldPos) {
        return worldPos[0] >= this.xMin && worldPos[0] <= this.xMax &&
               worldPos[1] >= this.yMin && worldPos[1] <= this.yMax &&
               worldPos[2] >= this.zMin && worldPos[2] <= this.zMax;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Solid / neighbor utilities
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Return neighbor index if fluid, else self-index.
     * Used by solvers to "bounce" stencil lookups off solid boundaries.
     *
     * @param {Float32Array} flags  – solid flag array (0 = fluid, ≠0 = solid)
     * @param {number}       idx    – current cell flat index
     * @param {number}       nidx   – neighbor flat index
     * @returns {number} fluid neighbor index, or idx if neighbor is solid/OOB
     */
    neighborFluid(flags, idx, nidx) {
        if (nidx < 0 || nidx >= flags.length) return idx;
        return flags[nidx] === 0 ? nidx : idx;
    }
}
