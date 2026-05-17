import { Renderer }          from "/scripts/cpu-raycaster-demo/renderer.js";
import { ProjectionPipeline } from "/scripts/cpu-raycaster-demo/projection-pipeline.js";
import { Mesh }               from "/scripts/cpu-raycaster-demo/mesh.js";
import { Translation }        from "/scripts/cpu-raycaster-demo/translation.js";
import { getCube }            from "/scripts/cpu-raycaster-demo/geometry.js";
import { CanvasController }   from "/scripts/graphics/canvas-controller.js";

document.addEventListener("DOMContentLoaded", async () => {
    const renderer = new Renderer("raycaster");
    const catMesh  = await Mesh.fromJson("assets/mesh/cat.json");
    const cubeMesh = getCube();
    const b2Mesh   = await Mesh.fromOBJ("/assets/mesh/b2.obj");

    renderer.loadBackground("/assets/textures/space.png");

    const camera = [0, 0, 0];
    const chosenMesh = b2Mesh;

    const scene = {
        camera:  camera,
        objects: [chosenMesh],
    };

    // ── visibility / pause / fullscreen controller ─────────────────
    const canvas = document.getElementById("raycaster");
    const controller = new CanvasController(canvas);

    let rotationDeg = 0;
    const fps = 240;

    function frame() {
        // Always schedule the next tick so we can resume.
        setTimeout(frame, 1000 / fps);

        if (controller.isPlaying) {
            // Running – animate the rotation.
            rotationDeg += 60 / fps % 360;
            Translation.rotate([0, 1, 1], rotationDeg, scene.objects[0]);
        }
        // Always render so the canvas is never blank.
        renderer.draw(scene);
    }

    frame();
});
