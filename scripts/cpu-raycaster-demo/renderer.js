import {ProjectionPipeline} from "/scripts/cpu-raycaster-demo/projection-pipeline.js"

export class Renderer {

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        window.addEventListener("resize", this.resizeCanvas.bind(this));
        this.resizeCanvas();
        
    };
    clear() {      
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawWireFrame(object) {
        var verts = object["screen_vertices"]
        var indices = object["indices"]
        this.ctx.strokeStyle = "#55f";
        this.ctx.fillStyle = "";

        if (indices.length == 0) return;

        for (var i = 0; i < indices.length - 3; i+=3) {
            var i1 = indices[i]*2; 
            var i2 = indices[i+1]*2; 
            var i3 = indices[i+2]*2;

            this.ctx.beginPath();
            this.ctx.moveTo(verts[i1], verts[i1+1]);
            this.ctx.lineTo(verts[i2], verts[i2+1]); 
            this.ctx.lineTo(verts[i3], verts[i3+1]); 
            this.ctx.lineWidth = 1;
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.fill();
        }

    }

    loadBackground(src) {
        this.bg = new Image();
        this.bg.src =   src;
        this.bg.onload = () => { this.clear();}
    }

    drawBackground() {
        if (this.bg) {
            this.ctx.drawImage(this.bg, 0,0, this.canvas.width, this.canvas.height);
        }
        else {
            this.ctx.fillStyle="#333";
        }
    }
    
    // Draw a simple 2D square
    draw(scene) {
      this.clear(); 
      this.drawBackground();

      for (var obj of scene["objects"]) {
          ProjectionPipeline.localToWorld(obj);
          ProjectionPipeline.worldToView(obj, scene["camera"]);
          ProjectionPipeline.viewToScreen(obj, scene["camera"],this.canvas);
          this.drawWireFrame(obj); 
      }
    }

    // Optional: handle DPI scaling for sharp rendering
    resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;

      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }


}
