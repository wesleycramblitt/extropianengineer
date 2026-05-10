export class Grid {
    constructor(settings) {
        this.NX = settings.nx || 32;
        this.NY = settings.ny || 32;
        this.NZ = settings.nz || 32;
        this.NXNY = this.NX * this.NY;

        this.rho = settings.rho || 1.225; // air density (kg/m^3)
        this.nu = settings.nu || 1.5e-5; // kinematic viscosity (m^2/s)
        this.WIND_SPEED = settings.wind_speed || [-2, 0, 0];

        this.xMin = -1.5;
        this.xMax = 1.5;

        this.yMin = -0.8;
        this.yMax = 0.8;

        this.zMin = -0.8;
        this.zMax = 0.8;
        
        // -X, -Y, -Z origin
        this.originWorld = settings.origin_world || [this.xMin, this.yMin, this.zMin];

        this.cellSizeWorld = [
            (this.xMax - this.xMin) / (this.NX - 1),
            (this.yMax - this.yMin) / (this.NY - 1),
            (this.zMax - this.zMin) / (this.NZ - 1),
        ];

        this.N = this.NX * this.NY * this.NZ;
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

}
