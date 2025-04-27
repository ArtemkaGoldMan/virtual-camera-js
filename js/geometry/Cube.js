class Cube {
    constructor(center, size, color) {
        this.center = center;
        this.size = size;
        this.color = color;
        this.vertices = this.generateVertices();
        this.faces = this.generateFaces();
    }

    generateVertices() {
        const s = this.size / 2;
        const c = this.center;
        return [
            new Point3D(c.x - s, c.y - s, c.z - s), // 0
            new Point3D(c.x + s, c.y - s, c.z - s), // 1
            new Point3D(c.x + s, c.y + s, c.z - s), // 2
            new Point3D(c.x - s, c.y + s, c.z - s), // 3
            new Point3D(c.x - s, c.y - s, c.z + s), // 4
            new Point3D(c.x + s, c.y - s, c.z + s), // 5
            new Point3D(c.x + s, c.y + s, c.z + s), // 6
            new Point3D(c.x - s, c.y + s, c.z + s)  // 7
        ];
    }

    generateFaces() {
        return [
            [0, 1, 2, 3], // front
            [1, 5, 6, 2], // right
            [5, 4, 7, 6], // back
            [4, 0, 3, 7], // left
            [3, 2, 6, 7], // top
            [1, 0, 4, 5]  // bottom
        ];
    }

    getCenter() {
        return this.center;
    }

    project(matrix, width, height) {
        const projectedVertices = this.vertices.map(v => {
            const p = v.clone();
            p.project(matrix, width, height);
            return p;
        });

        const faces = this.faces.map(face => ({
            vertices: face.map(i => projectedVertices[i]),
            zIndex: face.reduce((sum, i) => sum + this.vertices[i].z, 0) / 4
        }));

        return faces.sort((a, b) => b.zIndex - a.zIndex);
    }

    draw(ctx, matrix, width, height, wireframe = false) {
        const projectedFaces = this.project(matrix, width, height);

        for (const face of projectedFaces) {
            const vertices = face.vertices;
            
            ctx.beginPath();
            ctx.moveTo(vertices[0].screenX, vertices[0].screenY);
            
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].screenX, vertices[i].screenY);
            }
            
            ctx.closePath();

            if (wireframe) {
                ctx.strokeStyle = `rgb(${this.color.join(',')})`;
                ctx.stroke();
            } else {
                ctx.fillStyle = `rgb(${this.color.join(',')})`;
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.stroke();
            }
        }
    }
}