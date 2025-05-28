class Cube {
  constructor(position, size, color, divisions = 8) {
    this.position = position;
    this.size = size;
    this.color = color;
    this.divisions = divisions;

    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    this.rgbColor = `rgb(${r}, ${g}, ${b})`;

    const s = size / 2;
    this.vertices = [
      { x: -s, y: -s, z: s },
      { x: s, y: -s, z: s },
      { x: s, y: s, z: s },
      { x: -s, y: s, z: s },
      { x: -s, y: -s, z: -s },
      { x: s, y: -s, z: -s },
      { x: s, y: s, z: -s },
      { x: -s, y: s, z: -s },
    ];

    this.faces = [
      {
        vertices: [0, 1, 2, 3],
        color: this.rgbColor,
        normal: { x: 0, y: 0, z: 1 },
      },
      {
        vertices: [5, 4, 7, 6],
        color: this.rgbColor,
        normal: { x: 0, y: 0, z: -1 },
      },
      {
        vertices: [1, 5, 6, 2],
        color: this.rgbColor,
        normal: { x: 1, y: 0, z: 0 },
      },
      {
        vertices: [4, 0, 3, 7],
        color: this.rgbColor,
        normal: { x: -1, y: 0, z: 0 },
      },
      {
        vertices: [3, 2, 6, 7],
        color: this.rgbColor,
        normal: { x: 0, y: 1, z: 0 },
      },
      {
        vertices: [4, 5, 1, 0],
        color: this.rgbColor,
        normal: { x: 0, y: -1, z: 0 },
      },
    ];

    this.subdivisionData = this.createSubdivisions();
  }

  interpolateVertex(v1, v2, t) {
    return {
      x: v1.x + (v2.x - v1.x) * t,
      y: v1.y + (v2.y - v1.y) * t,
      z: v1.z + (v2.z - v1.z) * t,
    };
  }

  bilinearInterpolate(vertices, u, v) {
    const v00 = vertices[0];
    const v10 = vertices[1];
    const v11 = vertices[2];
    const v01 = vertices[3];

    const top = this.interpolateVertex(v00, v10, u);
    const bottom = this.interpolateVertex(v01, v11, u);
    return this.interpolateVertex(top, bottom, v);
  }

  createFaceFragments(face) {
    const fragments = [];
    const faceVertices = face.vertices.map((idx) => this.vertices[idx]);
    const step = 1.0 / this.divisions;

    const grid = [];
    for (let i = 0; i <= this.divisions; i++) {
      grid[i] = [];
      for (let j = 0; j <= this.divisions; j++) {
        const u = i * step;
        const v = j * step;
        grid[i][j] = this.bilinearInterpolate(faceVertices, u, v);
      }
    }

    for (let i = 0; i < this.divisions; i++) {
      for (let j = 0; j < this.divisions; j++) {
        const topLeft = grid[i][j];
        const topRight = grid[i + 1][j];
        const bottomRight = grid[i + 1][j + 1];
        const bottomLeft = grid[i][j + 1];

        fragments.push({
          vertices: [topLeft, topRight, bottomRight, bottomLeft],
          color: face.color,
          normal: { ...face.normal },
          originalFace: face,
        });
      }
    }

    return fragments;
  }

  createSubdivisions() {
    const subdivisionData = [];
    for (const face of this.faces) {
      const fragments = this.createFaceFragments(face);
      subdivisionData.push(...fragments);
    }
    return subdivisionData;
  }

  transformFragments(camera) {
    const transformedFragments = [];

    for (const fragment of this.subdivisionData) {
      const transformedVertices = [];

      for (const v of fragment.vertices) {
        const worldPos = {
          x: v.x + this.position.x,
          y: v.y + this.position.y,
          z: v.z + this.position.z,
        };

        const relativeToCam = {
          x: worldPos.x - camera.position.x,
          y: worldPos.y - camera.position.y,
          z: worldPos.z - camera.position.z,
        };

        const conj = camera.orientation.conjugate();
        const rotated = conj.rotatePoint(relativeToCam);
        transformedVertices.push(rotated);
      }

      const centerDepth =
        transformedVertices.reduce((sum, v) => sum + v.z, 0) /
        transformedVertices.length;

      transformedFragments.push({
        vertices: transformedVertices,
        color: fragment.color,
        normal: fragment.normal,
        centerDepth: centerDepth,
        originalFragment: fragment,
      });
    }

    return transformedFragments;
  }

  transform(camera) {
    const transformedVertices = [];

    for (const v of this.vertices) {
      const worldPos = {
        x: v.x + this.position.x,
        y: v.y + this.position.y,
        z: v.z + this.position.z,
      };

      const relativeToCam = {
        x: worldPos.x - camera.position.x,
        y: worldPos.y - camera.position.y,
        z: worldPos.z - camera.position.z,
      };

      const conj = camera.orientation.conjugate();
      const rotated = conj.rotatePoint(relativeToCam);

      transformedVertices.push(rotated);
    }

    return transformedVertices;
  }
}

class Scene {
  constructor() {
    this.cubes = [
      new Cube(new Vector3(-5, 0, 2), 2, "#FF4444", 10),
      new Cube(new Vector3(4, 2, -3), 1.8, "#44FF44", 10),
      new Cube(new Vector3(-2, 0, 0), 2, "#4444FF", 10),
      new Cube(new Vector3(2.5, 0.5, 0.5), 1.5, "#FFFF44", 10),

      new Cube(new Vector3(-1.2, 2.5, -7), 1.0, "#AA55FF", 10),
      new Cube(new Vector3(-0.4, 2.5, -7), 1.0, "#55AAFF", 10),
      new Cube(new Vector3(0.4, 2.5, -7), 1.0, "#55FFAA", 10),
      new Cube(new Vector3(1.2, 2.5, -7), 1.0, "#AAFF55", 10),
    ];

    for (let i = 4; i < this.cubes.length; i++) {
      const book = this.cubes[i];
      book.vertices.forEach((v) => {
        v.x *= 0.4;
        v.y *= 4.0;
        v.z *= 2.0;
      });
      book.subdivisionData = book.createSubdivisions();
    }
  }
}
