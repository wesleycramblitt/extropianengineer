//grid with current state in each cell pressure, velocity, solid, etc
//semi implicit euler integration
//

export class CFDSimulator {
    constructor(meshes) {
        this.NX = 100
        this.NY = 100
        this.NZ = 100

        this.rho = 1.225; //air density (kg/m^3)
        this.nu = 1.5e-5; // kinematicviscosity (m^2/s) 

        this.WIND_SPEED = (-1,0,0);
        
        //velocity vectors
        this.u = new Float32Array(NX * NY * NZ);
        this.v = new Float32Array(NX * NY * NZ);
        this.w = new Float32Array(NX * NY * NZ);

        //pressure
        this.p = new Float32Array(NX * NY * NZ);

        //solids/boundaries within grid
        // SOLID, FLUID, BOUNDARY
        this.flags = new Float32Array(NX * NY * NZ);
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
        
        //pressur Poisson equation
        //solve ∇²p = ρ/dt ∇·u*
        //correct/subtract pressure gradient
        //u = u* - dt/ρ ∇p
        
    }

    //TODO visualization
    //streamlines
    //particles carried by velocity
    //velocity magnitude heatmap
    //vorticity
    //pressure color on object surface
        
}
