import { Renderer }          from "/scripts/cpu-raycaster-demo/renderer.js";
import { ProjectionPipeline } from "/scripts/cpu-raycaster-demo/projection-pipeline.js";
import { Mesh }               from "/scripts/cpu-raycaster-demo/mesh.js";
import { Translation }        from "/scripts/cpu-raycaster-demo/translation.js";
import { getCube }            from "/scripts/cpu-raycaster-demo/geometry.js";
import { CanvasController }   from "/scripts/graphics/canvas-controller.js";

document.addEventListener("DOMContentLoaded", async () => {
    const renderer = new Renderer("raycaster");

    // Load all meshes in parallel.
    const [catMesh, cubeMesh, b2Mesh, bowlMesh, coffeeMesh, diceMesh] = await Promise.all([
        Mesh.fromJson("assets/mesh/cat.json"),
        Promise.resolve(getCube()),
        Mesh.fromOBJ("/assets/mesh/b2.obj"),
        Mesh.fromOBJ("/assets/mesh/bowl.obj"),
        Mesh.fromOBJ("/assets/mesh/coffee.obj"),
        Mesh.fromOBJ("/assets/mesh/dice.obj"),
    ]);

    renderer.loadBackground("/assets/textures/space.png");

    const meshes = {
        'B2 Bomber': b2Mesh,
        // 'Bowl':      bowlMesh,
        'Cat':       catMesh,
        // 'Coffee':    coffeeMesh,
        'Cube':      cubeMesh,
        // 'Dice':      diceMesh,
    };

    const camera = [0, 0, ];

    const scene = {
        camera:  camera,
        objects: [b2Mesh],
    };

    // ── visibility / pause / fullscreen controller ─────────────────
    const canvas = document.getElementById("raycaster");
    const controller = new CanvasController(canvas);

    // ── mesh selector dropdown ────────────────────────────────────
    const select = document.createElement('select');
    select.setAttribute('data-no-drag', '');
    Object.assign(select.style, {
        position: 'absolute',
        bottom: '0.5rem',
        left: '0.5rem',
        zIndex: '999',
        padding: '0.3rem 0.5rem',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '4px',
        background: 'rgba(0,0,0,0.7)',
        color: '#eee',
        fontSize: '0.85rem',
        cursor: 'pointer',
        pointerEvents: 'auto',
    });

    Object.keys(meshes).forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === 'B2 Bomber') opt.selected = true;
        select.appendChild(opt);
    });

    select.addEventListener('change', function () {
        var name = select.value;
        scene.objects[0] = meshes[name];
    });
    select.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    var shell = canvas.closest('.canvas-shell');
    if (shell) shell.appendChild(select);

    let rotationDeg = 0;
    const fps = 240;

    function frame() {
        setTimeout(frame, 1000 / fps);

        if (controller.isPlaying) {
            rotationDeg += 60 / fps % 360;
            Translation.rotate([0, 1, 0], rotationDeg, scene.objects[0]);
        }
        renderer.draw(scene);
    }

    frame();
});
