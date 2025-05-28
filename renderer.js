class Renderer {
  constructor(canvas, camera, scene) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.camera = camera;
    this.scene = scene;

    this.wireframeMode = false;

    this.screenWidth = canvas.width;
    this.screenHeight = canvas.height;
    this.screenCenterX = this.screenWidth / 2;
    this.screenCenterY = this.screenHeight / 2;

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.screenWidth = this.canvas.width;
    this.screenHeight = this.canvas.height;
    this.screenCenterX = this.screenWidth / 2;
    this.screenCenterY = this.screenHeight / 2;

    this.camera.aspect = this.canvas.width / this.canvas.height;
  }

  setWireframeMode(enabled) {
    this.wireframeMode = enabled;
  }

  formatCoordinate(value) {
    const intValue = Math.floor(Math.abs(value) * 100);
    const formatted = intValue.toString().padStart(5, "0");
    return value < 0 ? `-${formatted}` : formatted;
  }

  projectVertex(vertex) {
    if (vertex.z <= 0.1) return null;
    const scale = Math.tan(this.camera.fov / 2);
    const aspect = this.canvas.width / this.canvas.height;

    const x =
      (vertex.x / (vertex.z * scale * aspect)) * this.screenCenterX +
      this.screenCenterX;
    const y =
      (-vertex.y / (vertex.z * scale)) * this.screenCenterY +
      this.screenCenterY;

    return { x, y, z: vertex.z };
  }

  // Backface culling: Test widoczności fragmentu
  isFragmentVisible(transformedFragment) {
    const vertices = transformedFragment.vertices;

    // Używamy pierwszych trzech wierzchołków do obliczenia normalnej
    const v0 = vertices[0];
    const v1 = vertices[1];
    const v2 = vertices[2];

    // Obliczanie normalnej fragmentu na podstawie jego wierzchołków
    const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

    const normal = {
      x: edge1.y * edge2.z - edge1.z * edge2.y,
      y: edge1.z * edge2.x - edge1.x * edge2.z,
      z: edge1.x * edge2.y - edge1.y * edge2.x,
    };

    // Normalizacja normalnej
    const normalLength = Math.sqrt(
      normal.x ** 2 + normal.y ** 2 + normal.z ** 2
    );
    if (normalLength > 0) {
      normal.x /= normalLength;
      normal.y /= normalLength;
      normal.z /= normalLength;
    }

    // Obliczanie wektora widoku (od fragmentu do kamery)
    // W przestrzeni widoku kamera znajduje się w punkcie (0, 0, 0)
    const viewVector = { x: -v0.x, y: -v0.y, z: -v0.z };

    // Test widoczności: iloczyn skalarny normalnej i wektora widoku
    // Jeśli iloczyn skalarny jest dodatni, fragment jest zwrócony przodem do kamery
    const dot =
      normal.x * viewVector.x +
      normal.y * viewVector.y +
      normal.z * viewVector.z;
    return dot > 0;
  }

  renderFragment(transformedFragment) {
    const screenVertices = transformedFragment.vertices.map((v) =>
      this.projectVertex(v)
    );

    if (screenVertices.includes(null)) return;

    this.ctx.beginPath();
    this.ctx.moveTo(screenVertices[0].x, screenVertices[0].y);
    for (let i = 1; i < screenVertices.length; i++) {
      this.ctx.lineTo(screenVertices[i].x, screenVertices[i].y);
    }
    this.ctx.closePath();

    if (this.wireframeMode) {
      this.ctx.strokeStyle = transformedFragment.color;
      this.ctx.lineWidth = 0.5;
      this.ctx.stroke();
    } else {
      this.ctx.fillStyle = transformedFragment.color;
      this.ctx.fill();

      this.ctx.strokeStyle = transformedFragment.color;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }
  }

  renderAxis() {
    const axisLength = 1.0;
    const origin = { x: 0, y: 0, z: 0 };

    const axes = [
      { end: this.camera.right.multiply(axisLength), color: "#FF0000" },
      { end: this.camera.up.multiply(axisLength), color: "#00FF00" },
      { end: this.camera.forward.multiply(axisLength), color: "#0000FF" },
    ];

    const axisOriginX = 80;
    const axisOriginY = this.screenHeight - 80;

    for (const axis of axes) {
      this.ctx.beginPath();
      this.ctx.moveTo(axisOriginX, axisOriginY);
      const endX = axisOriginX + axis.end.x * 40;
      const endY = axisOriginY - axis.end.y * 40;
      this.ctx.lineTo(endX, endY);
      this.ctx.strokeStyle = axis.color;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    this.ctx.font = "12px Arial";
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillText("X", axisOriginX + 45, axisOriginY);
    this.ctx.fillText("Y", axisOriginX, axisOriginY - 45);
    this.ctx.fillText("Z", axisOriginX + 20, axisOriginY - 20);
  }

  renderCoordinates() {
    const pos = this.camera.position;

    this.ctx.font = "bold 16px monospace";
    this.ctx.fillStyle = "#00FF00";
    const textX = this.screenWidth - 150;
    const textY = 30;
    this.ctx.fillText(`x:${this.formatCoordinate(pos.x)}`, textX, textY);
    this.ctx.fillText(`y:${this.formatCoordinate(pos.y)}`, textX, textY + 25);
    this.ctx.fillText(`z:${this.formatCoordinate(pos.z)}`, textX, textY + 50);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const allFragments = [];

    // 1.każdego sześcianu w scenie:
    for (const cube of this.scene.cubes) {

      const transformedFragments = cube.transformFragments(this.camera);

      // 2. Przetwarzanie fragmentów każdej ściany
      for (const transformedFragment of transformedFragments) {
        // Sprawdzenie widoczności fragmentu (backface culling)
        const isVisible =
          this.wireframeMode || this.isFragmentVisible(transformedFragment);

        if (isVisible) {
          // Fragment jest traktowany jak osobna „mała ściana"
          allFragments.push(transformedFragment);
        }
      }
    }

    // 3. Algorytm malarza: sortowanie wszystkich fragmentów według odległości środka od kamery
    // (od najdalszego do najbliższego)

    allFragments.sort((a, b) => {
      const depthDiff = b.centerDepth - a.centerDepth;
      if (Math.abs(depthDiff) < 0.0001) {
        // fallback:
        return a.vertices[0].x - b.vertices[0].x;
      }
      return depthDiff;
    });


    for (const fragment of allFragments) {
      this.renderFragment(fragment);
    }

    

    this.renderAxis();
    this.renderCoordinates();
  }

  drawCubeEdges(cube) {
  const projectedVertices = [];

  for (const v of cube.vertices) {
    const worldPos = {
      x: v.x + cube.position.x,
      y: v.y + cube.position.y,
      z: v.z + cube.position.z,
    };

    const relative = {
      x: worldPos.x - this.camera.position.x,
      y: worldPos.y - this.camera.position.y,
      z: worldPos.z - this.camera.position.z,
    };

    const rotated = this.camera.orientation.conjugate().rotatePoint(relative);
    const projected = this.projectVertex(rotated);
    projectedVertices.push(projected);
  }

  // Пара ребер (по індексах вершин)
  const edges = [
    [0,1],[1,2],[2,3],[3,0], // front face
    [4,5],[5,6],[6,7],[7,4], // back face
    [0,4],[1,5],[2,6],[3,7], // sides
  ];

  this.ctx.strokeStyle = this.darkenColor(cube.rgbColor, 0.4);
  this.ctx.lineWidth = 1.5;

  for (const [i1, i2] of edges) {
    const p1 = projectedVertices[i1];
    const p2 = projectedVertices[i2];

    if (p1 && p2) {
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }
  }
}

}
