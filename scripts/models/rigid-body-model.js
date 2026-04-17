// rigid body state layout, gravity, reigid body equations, 
class RigidBodyModel {
  computeDerivative(state, params, out) {
    // dx/dt = v
    copyVec3(out.position, state.linearVelocity);

    // dv/dt = gravity + force/m
    setVec3(out.linearVelocity, 0, params.gravity, 0);

    // dq/dt = 0.5 * omegaQuat * q
    computeQuatDerivative(out.orientation, state.orientation, state.angularVelocity);

    // dω/dt = maybe simplified for now
    setVec3(out.angularVelocity, 0, 0, 0);
  }

  postStep(state, params, dt) {
    resolveGroundCollision(state, params);
  }

}
