import {Translation} from "/scripts/cpu-raycaster-demo/translation.js";

export function getCube() {
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
        "T" : Translation.T(0,0,-2.5),
        "R" : Translation.R([0,0, 0], 0),
        "S" : Translation.S(1,1,1),
        "world_vertices": [],
        "screen_vertices": []
    };
    return cube;
}
