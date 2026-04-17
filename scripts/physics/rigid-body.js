class RigidBody {
  constructor() {
    this.position = vec3(0, 3, 0);
    this.orientation = quat(0, 0, 0, 1);

    this.linearVelocity = vec3(0, 0, 0);
    this.angularVelocity = vec3(0, 0, 0);

    this.mass = 1.0;
    this.invMass = 1.0;

    this.halfExtents = vec3(0.5, 0.5, 0.5);

    this.restitution = 0.35;
    this.friction = 0.6;
  }

  resetForThrow() {}
  integrate(dt) {}
}
