
import { quat } from "/scripts/math/quat.js";
//grid with current state in each cell pressure, velocity, solid, etc
//
//semi implicit euler integration
//

export class CFDSimulator {
    constructor(entities, settings) {

        this.originWorld = settings.origin_world || (0,0,0);
        this.cellSizeWorld = settings.cell_size_world || (0.1,0.1,0.1);
        this.orientation = quat();

        this.NX = settings.nx || 100
        this.NY = settings.ny || 100
        this.NZ = settings.nz || 100

        this.rho = settings.rho || 1.225; //air density (kg/m^3)
        this.nu = settings.nu || 1.5e-5; // kinematicviscosity (m^2/s) 

        this.WIND_SPEED = settings.wind_speed || (-1,0,0);
        
        //velocity vectors
        this.u = new Float32Array(this.NX * this.NY * this.NZ);
        this.v = new Float32Array(this.NX * this.NY * this.NZ);
        this.w = new Float32Array(this.NX * this.NY * this.NZ);

        //pressure
        this.p = new Float32Array(this.NX * this.NY * this.NZ);

        //solids/boundaries within grid
        // SOLID, FLUID, BOUNDARY
        this.flags = new Float32Array(this.NX * this.NY * this.NZ);
        this.entities = entities;

        //particles in world coordinates
        this.positions = [];
        this.velocities = [];
    }

    gridToWorld(gridPos) {
        return this.originWorld + orientation* ((gridPos) * this.cellSizeWorld);
    }

    worldToGrid(worldPos) {
        return (worldPos)/this.cellSizeWorld;
    }

    step(dt) {
        //∇ · u = 0
        //∂u/∂t + (u · ∇)u = -1/rho ∇p + nu∇²u

        //apply boundary conditions

        //u* = advect(u) u*(x) = uⁿ(x - dt * uⁿ(x))
        
        //u* = diffuse(u*) 
        //    Implicit: (I - ν dt ∇²) u** = u*
        //    or
        //    Explicit: u** = u* + dt ν ∇²u*
        
        //∇ · u = 0
        
        //pressure Poisson equation
        //solve ∇²p = ρ/dt ∇·u*
        //correct/subtract pressure gradient
        //u = u* - dt/ρ ∇p
        
    }
        
}
