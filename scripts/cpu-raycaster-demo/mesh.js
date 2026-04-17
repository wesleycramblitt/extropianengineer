
import {Translation} from "/scripts/cpu-raycaster-demo/translation.js";
import {loadJson, saveJson } from "/scripts/files.js";
import {loadOBJ } from "/scripts/graphics/obj.js";

export class Mesh {
    static async fromOBJ(src) {

       var mesh = await loadOBJ(src);
       
       return {
       "vertices" : mesh.positions, 
           "indices": mesh.indices, 
           "T" : Translation.T(0,0,-5),
            "R" : Translation.R([1,1, 0], 20),
            "S" : Translation.S(1,1,1),
            "world_vertices": [],
            "screen_vertices": []
       }
    }

    //my json format has T,R,S,world_vertices,screen_vertices baked in
    static async fromJson(src) {
        return (await loadJson(src));
    }

}
