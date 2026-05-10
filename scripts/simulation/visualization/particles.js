
class Particles {
    constructor() {

    }

    update() {
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

    removeOutOfBoundsParticles() {

    }


    spawnParticles(base) {
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

}
