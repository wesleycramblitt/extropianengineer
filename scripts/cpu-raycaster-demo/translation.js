export class Translation {
   static matrixMultiply(a, b) {
        const out = new Float32Array(16);

        for (var col = 0; col < 4; col++) {
            for (var row=0; row < 4; row++) {
                out[col*4+row] =
                    a[0*4+row] * b[col*4+0] +
                    a[1*4+row] * b[col*4+1] +
                    a[2*4+row] * b[col*4+2] +
                    a[3*4+row] * b[col*4+3];
            }
        }
       return out 
    }

   static mulMat4Vec3(m, v) {
        const x= v[0], y = v[1], z= v[2], w = 1
        return new Float32Array([
            m[0]*x + m[4]*y + m[8]*z + m[12]*w,
            m[1]*x + m[5]*y + m[9]*z + m[13]*w,
            m[2]*x + m[6]*y + m[10]*z + m[14]*w,
            m[3]*x + m[7]*y + m[11]*z + m[15]*w,
        ])
    }

   static TRS(T,R,S) {
        return this.matrixMultiply(this.matrixMultiply(T,R),S)
    }

   static T(tx,ty,tz) {
        return new Float32Array([
         1, 0, 0, 0,
         0, 1, 0, 0,
         0, 0, 1, 0,
         tx, ty, tz, 1
        ])
    }

    static R(axis, degrees) {
        let [x, y, z] = axis;

        // Normalize axis
        const len = Math.hypot(x, y, z);
        if (len != 0) {
            x /= len; y /= len; z /= len;
        }

        const rad = degrees * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const t = 1 - c;

        const R = new Float32Array([
            t*x*x + c,     t*x*y + s*z,     t*x*z - s*y,     0,
            t*x*y - s*z,   t*y*y + c,       t*y*z + s*x,     0,
            t*x*z + s*y,   t*y*z - s*x,     t*z*z + c,       0,
            0,             0,               0,               1
        ]);       
        return R
    }
    
    static S(sx,sy,sz) {
        return new Float32Array([
        sx, 0, 0, 0,
        0, sy, 0, 0,
        0, 0, sz, 0, 
        0, 0, 0, 1
        ])
    }


    static updateCircularPosition(object) {
        const r = 1;          // radius
        const speed = 1.0;      // radians per second
        const theta =time * speed;

        const cx = 0;           // center of circle
        const cy = 0;
        const cz = 0;

        object.position[0] = cx + r * Math.cos(theta);
        object.position[1] = cy; // fixed Y
        object.position[2] = cz + r * Math.sin(theta);
    }


   static rotate(dirVec3, rotationDeg,object) {
       //var max = 0.01;
       //var min = 0;
       //
       // rx +=  Math.floor(Math.random()* (max - min + 1)) + min;
       // ry +=  Math.floor(Math.random()* (max - min + 1)) + min;
       // rz +=  Math.floor(Math.random()* (max - min + 1)) + min;
       //
       // rx = Math.max(0, Math.min(1,rx));
       // ry = Math.max(0, Math.min(1,ry));
       // rz = Math.max(0, Math.min(1,rz));
       //
       object.R =this.R(dirVec3, rotationDeg); 
     
    } 

}
