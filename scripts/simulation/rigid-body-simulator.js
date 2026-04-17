
import { vec3, scale } from "/scripts/math/vec3.js";
import { quat, multiply } from "/scripts/math/quat.js";
import { mat4 } from "/scripts/math/mat4.js";


export class RigidBodySimulator {
    constructor(rigidBodyTranslation) {
        this.mass = 1;
        this.inertiaTensor = [ 1/6,0,0,0,1/6,0,0,0,1/6];
        this.rigidBodyState = {
            p:   rigidBodyTranslation.position,
            v:   vec3(0,0,0),
            w:   vec3(0,0,1),
            q:   rigidBodyTranslation.rotation
        };
        this.gravity = -1; //-9.81;
    }
    step(dt) {
       // dv = 1/m(F)*dt   (F = m*g + other_forces) 
       var dv = vec3(0,this.gravity*dt,0);
       
       this.rigidBodyState.v[0] += dv[0];
       this.rigidBodyState.v[1] += dv[1];
       this.rigidBodyState.v[2] += dv[2];

       //dp = v*dt
       var dp = vec3(0,0,0);
       scale(dp, this.rigidBodyState.v , dt); 

       this.rigidBodyState.p[0] += dp[0];
       this.rigidBodyState.p[1] += dp[1];
       this.rigidBodyState.p[2] += dp[2];

       if (this.rigidBodyState.p[1] <= 0) {
           this.rigidBodyState.p[1] = 0;
           return;
        }
       // dw = I^-1(torque -  w x (Iw))*dt (skipping until collisions added)
        
      
       // dq = 1/2q((x))wq*dt (fixed w for now)
       var dq = quat(0,0,0,0);
       var w = this.rigidBodyState.w;
       var wq = quat(w[0], w[1],w[2],0)
       var q = quat(
           this.rigidBodyState.q[0]*1/2, 
           this.rigidBodyState.q[1]*1/2, 
           this.rigidBodyState.q[2]*1/2, 
           this.rigidBodyState.q[3]*1/2); 

       multiply(dq, q, wq);

       dq[0] *= dt;
       dq[1] *= dt;
       dq[2] *= dt;
       dq[3] *= dt;

       this.rigidBodyState.q[0] += dq[0];
       this.rigidBodyState.q[1] += dq[1];
       this.rigidBodyState.q[2] += dq[2];
       this.rigidBodyState.q[3] += dq[3];



       return this.rigidBodyState; 
    }
}
