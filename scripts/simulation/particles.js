/**
 * Particles – tracer-particle advection through a velocity field.
 *
 * Owns position / velocity arrays that are written by update() and
 * read directly by the GPU-side `ParticleSet` (via Float32Array reference).
 *
 * The velocity field is accessed through a callback injected by the
 * simulator, keeping this class decoupled from the solver internals.
 */

export class Particles {
    /**
     * @param {object}  opts
     * @param {Grid}    opts.grid           – simulation grid (for bounds)
     * @param {number}  opts.particleCount  – number of tracer particles
     * @param {function} opts.getVelocityAt – (worldX, worldY, worldZ) → [ux, uy, uz]
     */
    constructor({ grid, particleCount, getVelocityAt }) {
        this.grid = grid;
        this.getVelocityAt = getVelocityAt;

        const N3 = particleCount * 3;
        this.positions  = new Float32Array(N3);
        this.velocities = new Float32Array(N3);

        this.particleCount = particleCount;

        // Pre-compute spawn region margins
        this.spawnMargin = {
            x: grid.cellSizeWorld[0] * 2.0,
            y: grid.cellSizeWorld[1] * 2.0,
            z: grid.cellSizeWorld[2] * 2.0,
        };

        // Initialise all particles
        for (let p = 0; p < particleCount; p++) {
            this.respawnParticle(p);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Per-frame update
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Advect each particle via explicit Euler through the velocity field.
     * Particles that leave the domain or enter a solid cell are respawned.
     *
     * @param {number} dt
     */
    update(dt) {
        const { positions, velocities, grid, getVelocityAt, particleCount } = this;
        const { xMin, xMax, yMin, yMax, zMin, zMax } = grid;
        const { x: mx, y: my, z: mz } = this.spawnMargin;

        for (let p = 0; p < particleCount; p++) {
            const base = p * 3;
            const px = positions[base + 0];
            const py = positions[base + 1];
            const pz = positions[base + 2];

            // Look up velocity at current particle position
            const [vx, vy, vz] = getVelocityAt(px, py, pz);

            velocities[base + 0] = vx;
            velocities[base + 1] = vy;
            velocities[base + 2] = vz;

            // Forward-Euler advection
            const nx = px + dt * vx;
            const ny = py + dt * vy;
            const nz = pz + dt * vz;

            // Out of bounds? Respawn
            if (nx <= xMin + mx || nx >= xMax ||
                ny <= yMin      || ny >= yMax ||
                nz <= zMin      || nz >= zMax) {
                this.respawnParticle(p);
            } else {
                positions[base + 0] = nx;
                positions[base + 1] = ny;
                positions[base + 2] = nz;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Spawning
    // ═══════════════════════════════════════════════════════════════════

    /**
     * (Re)spawn a single particle at a random position on the inlet face
     * with the ambient wind velocity.
     *
     * @param {number} p – particle index
     */
    respawnParticle(p) {
        const base = p * 3;
        const { positions, velocities, grid } = this;
        const { xMin, xMax, yMin, yMax, zMin, zMax, cellSizeWorld } = grid;
        const wind = grid.WIND_SPEED;

        const mx = cellSizeWorld[0] * 2.0;
        const my = cellSizeWorld[1] * 2.0;
        const mz = cellSizeWorld[2] * 2.0;

        // Spawn at inlet face (near xMax) with random y, z offset
        positions[base + 0] = xMax - mx;
        positions[base + 1] = yMin + my + Math.random() * (yMax - yMin - 2 * my);
        positions[base + 2] = zMin + mz + Math.random() * (zMax - zMin - 2 * mz);

        velocities[base + 0] = wind[0];
        velocities[base + 1] = wind[1];
        velocities[base + 2] = wind[2];
    }

    /** Respawn every particle at a random inlet position. */
    resetAll() {
        for (let p = 0; p < this.particleCount; p++) {
            this.respawnParticle(p);
        }
    }
}
