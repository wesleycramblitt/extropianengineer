import { saveJson, loadJson } from './files.js';

document.addEventListener("DOMContentLoaded",async () => {
    // Select the canvas
    const canvas = document.getElementById("raycaster");
    const ctx = canvas.getContext("2d");

    // Optional: handle DPI scaling for sharp rendering
    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function clear() {

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawWireFrame(object) {
        var verts = object["screen_vertices"]
        var indices = object["indices"]
        ctx.strokeStyle = "#55f";

        if (indices.length == 0) return;

        for (var i = 0; i < indices.length - 3; i+=3) {
            var i1 = indices[i]*2; 
            var i2 = indices[i+1]*2; 
            var i3 = indices[i+2]*2;

            ctx.beginPath();
            ctx.moveTo(verts[i1], verts[i1+1]);
            ctx.lineTo(verts[i2], verts[i2+1]); 
            ctx.lineTo(verts[i3], verts[i3+1]); 
            ctx.lineWidth = 1;
            ctx.closePath();
            ctx.stroke();
        }

    }
    
    // Draw a simple 2D square
    function draw(scene) {
      clear(); 

      for (var obj of scene["objects"]) {
          localToWorld(obj);
          worldToView(obj, scene["camera"]);
          viewToScreen(obj, scene["camera"]);
          drawWireFrame(obj); 
      }
    }

    function matrixMultiply(a, b) {
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

    function mulMat4Vec3(m, v) {
        const x= v[0], y = v[1], z= v[2], w = 1
        return new Float32Array([
            m[0]*x + m[4]*y + m[8]*z + m[12]*w,
            m[1]*x + m[5]*y + m[9]*z + m[13]*w,
            m[2]*x + m[6]*y + m[10]*z + m[14]*w,
            //m[3]*x + m[7]*y + m[11]*z + m[15]*w,
        ])
    }

    function TRS(T,R,S) {
        return matrixMultiply(matrixMultiply(T,R),S)
    }

    function T(tx,ty,tz) {
        return new Float32Array([
         1, 0, 0, 0,
         0, 1, 0, 0,
         0, 0, 1, 0,
         tx, ty, tz, 1
        ])
    }

    function R(axis, degrees) {
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
    
    function S(sx,sy,sz) {
        return new Float32Array([
        sx, 0, 0, 0,
        0, sy, 0, 0,
        0, 0, sz, 0, 
        0, 0, 0, 1
        ])
    }

    
    //Position the object in the world
    function localToWorld(object) {
        var M = TRS(object["T"], object["R"], object["S"])
        var worldVerts = []; 
        var verts = object["vertices"]
        for (var i = 0; i <= object["vertices"].length-3; i+=3) {
            var vert = [verts[i],verts[i+1],verts[i+2]]; 
            var vert2 = mulMat4Vec3(M, vert);
            worldVerts.push(vert2[0]);
            worldVerts.push(vert2[1]);
            worldVerts.push(vert2[2]);
         }

        object["world_vertices"] = worldVerts
    }

    //After adding camera movement
    //convert wolrd space into view space based on camera position
    function worldToView(object, camera) {
        object["view_vertices"] = object["world_vertices"]
    }
    //convert view space (camera) coordinates into 2d screen space
    //Camera doesn't move right now so just divide by z (the bigger z is the farther away in this raycast style projection
    //skipping clip and NDC as separate steps for now (although NDC is within)
    function viewToScreen(object, camera) { 
        var screenSpace = [] 
        var vertices = object["view_vertices"]
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        var aspect = w/ h;

        for (var i = 0; i <= vertices.length-3; i+=3) {
            var vert = [vertices[i],vertices[i+1],vertices[i+2]]; 
           var ndc = [vert[0]/-vert[2]/ aspect, vert[1]/-vert[2]]
           var screen = [(ndc[0]+1)*0.5*w, (1 - ndc[1])*0.5*h];
           screenSpace = screenSpace.concat(screen); 
        }

        object["screen_vertices"] = screenSpace
    }

    var camera = [0,0,0]
    var cube = {
        "vertices" : [
              //-x,-y           x, -y              x, y          -x,y
             -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,0.5,-0.5, -0.5,0.5,-0.5,  // -Z face
             -0.5,-0.5,0.5, 0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5,  // Z face
        ],
       "indices": [
          0,1,2, 0,2,3, // -Z
          4,5,6, 4,6,7, // +Z
          0,3,7, 0,7,4, // -X
          1,5,6, 1,6,2, // +X
          0,4,5, 0,5,1, // -Y
          3,2,6, 3,6,7  // +Y
        ],
        "T" : T(0,0,-2.5),
        "R" : R([0,0, 0], 0),
        "S" : S(1,1,1),
        "world_vertices": [],
        "screen_vertices": []
    }

   var mesh = await loadOBJ("/mesh/cat.obj");
   var cat = await loadJson("/mesh/cat.json"); 

    function updateCircularPosition(object) {
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

    var scene = {
        "camera": camera,
        "objects" : [cat]
    }

    var rotationDeg = 0;
    var scale = 1; 
    var scale_dir = 1;
    var translationTheta = 0
    var rx = 0.0;
    var ry = 0.0;
    var rz = 0.0;

    function scaleAnimation() {
        max = 1.5;
        scale+=0.01%max*scale_dir;
        if (scale_dir == 1 && scale >= max) scale = -1
        else if (scale_dir == -1 && scale <= 1) scale = 1

        scene.objects[0].S =S(scale, scale, scale);

    }

    function transformAnimation() {
        translationTheta += 0.01%360;
        var r = 1;

        const center = [0,0,-2.5];

        scene.objects[0].T = T(center[0] + r * Math.cos(translationTheta), center[1], center[2] + r* Math.sin(translationTheta)); 
    }

    function rotationAnimation() {
       rotationDeg+= 1%350;
       var max = 0.01;
       var min = 0;
       //
       // rx +=  Math.floor(Math.random()* (max - min + 1)) + min;
       // ry +=  Math.floor(Math.random()* (max - min + 1)) + min;
       // rz +=  Math.floor(Math.random()* (max - min + 1)) + min;
       //
       // rx = Math.max(0, Math.min(1,rx));
       // ry = Math.max(0, Math.min(1,ry));
       // rz = Math.max(0, Math.min(1,rz));
       //
       scene.objects[0].R =R([0,1,0], rotationDeg); 
     
    }

    // x2 + y2 = z
    // x = sqrt(z - y2)
    // y = sqrt(z - x2)
    function frame() { 
        var fps = 60;

        // transformAnimation();
        rotationAnimation();
        //scaleAnimation();
        draw(scene);
        setTimeout(frame, 1000/fps);
    }

    frame();
})
