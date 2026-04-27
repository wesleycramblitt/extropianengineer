//General purpose in the future for coupling
class Simulator {
  constructor() {
    this.bodies = [];
    this.gravity = vec3(0, -9.81, 0);

  }

  step(dt) {
      // Model => comput derivative (state, params, deriv)
      // Integrator.step(state, deriv, dt, stateOps)
      // StateOps.normalize(state)
      // Model.postStep(state,params,dt)
      }
}
