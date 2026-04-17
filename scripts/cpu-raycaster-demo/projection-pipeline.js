import {Translation} from "/scripts/cpu-raycaster-demo/translation.js";

export class ProjectionPipeline {
    
    //Position the object in the world
    static localToWorld(object) {
        var M = Translation.TRS(object["T"], object["R"], object["S"])
        var worldVerts = []; 
        var verts = object["vertices"]
        for (var i = 0; i <= object["vertices"].length; i+=3) {
            var vert = [verts[i],verts[i+1],verts[i+2]]; 
            var vert2 = Translation.mulMat4Vec3(M, vert);
            worldVerts.push(vert2[0]);
            worldVerts.push(vert2[1]);
            worldVerts.push(vert2[2]);
            // worldVerts.push(vert2[3]);
         }

        object["world_vertices"] = worldVerts
    }

    //After adding camera movement
    //convert wolrd space into view space based on camera position
    static worldToView(object, camera) {
        object["view_vertices"] = object["world_vertices"]
    }
    //convert view space (camera) coordinates into 2d screen space
    //Camera doesn't move right now so just divide by z (the bigger z is the farther away in this raycast style projection
    //skipping clip and NDC as separate steps for now (although NDC is within)
    static viewToScreen(object, camera, canvas) { 
        var screenSpace = [] 
        var vertices = object["view_vertices"]
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        var aspect = w/ h;

        for (var i = 0; i <= vertices.length; i+=3) {
            var vert = [vertices[i],vertices[i+1],vertices[i+2]]; 
            //psuedo clipping
            if (vert[2] > -0.1) continue 
            var ndc = [vert[0]/-vert[2]/ aspect, vert[1]/-vert[2]]
            var screen = [(ndc[0]+1)*0.5*w, (1 - ndc[1])*0.5*h];
            screenSpace = screenSpace.concat(screen); 
        }

        object["screen_vertices"] = screenSpace
    }




}
