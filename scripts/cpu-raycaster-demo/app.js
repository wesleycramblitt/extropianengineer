import {Renderer} from "/scripts/cpu-raycaster-demo/renderer.js";
import {ProjectionPipeline} from "/scripts/cpu-raycaster-demo/projection-pipeline.js"
import {Mesh} from "/scripts/cpu-raycaster-demo/mesh.js"
import {Translation} from "/scripts/cpu-raycaster-demo/translation.js"
import {getCube } from "/scripts/cpu-raycaster-demo/geometry.js"

document.addEventListener("DOMContentLoaded",async () => {
    // Select the canvas
    const renderer = new Renderer("raycaster");
    const catMesh = await Mesh.fromJson("assets/mesh/cat.json");

    const cubeMesh = getCube();
    const b2Mesh = await Mesh.fromOBJ("/assets/mesh/b2.obj");

    renderer.loadBackground("/assets/textures/space.png");

    var camera = [0,0,0]

    var chosenMesh = b2Mesh;


    var scene = {
        "camera": camera,
        "objects" : [chosenMesh]
    }

    var rotationDeg = 0;

    // x2 + y2 = z
    // x = sqrt(z - y2)
    // y = sqrt(z - x2)
    function frame() { 
        var fps = 240;
        rotationDeg += 60/fps%360;
        Translation.rotate([0,1,1],rotationDeg, scene.objects[0]);

        renderer.draw(scene);
        setTimeout(frame, 1000/fps);
    }

    frame();
})


