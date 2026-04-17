// Euler, SimiImplicitEuler, RK2, RK4
class Integrator
{
    constructor() { }
    integrateBody(body, dt) {

      // 1. Linear acceleration
      const acc = this.gravity;

      // 2. Update velocity
      body.linearVelocity += acc * dt;

      // 3. Update position
      body.position += body.linearVelocity * dt;

      // 4. Angular dynamics (simplified first)
      // skip torque for now
      // ω stays constant initially

      // 5. Update orientation
      updateQuaternion(body.orientation, body.angularVelocity, dt);
    }
}
