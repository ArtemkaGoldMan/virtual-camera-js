class Renderer {
    constructor(canvas, camera, scene) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = camera;
        this.scene = scene;

        this.wireframeMode = false;

        this.screenWidth = canvas.width;
        this.screenHeight = canvas.height;
        this.screenCenterX = this.screenWidth / 2;
        this.screenCenterY = this.screenHeight / 2;

        this.subdivisionLevel = 2;

        this.resize();
        window.addEventListener('resize', () => this.resize());
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
        const formatted = intValue.toString().padStart(5, '0');
        return value < 0 ? `-${formatted}` : formatted;
    }

    projectVertex(vertex) {
        if (vertex.z <= 0.1) return null;
        const scale = Math.tan(this.camera.fov / 2);
        const aspect = this.canvas.width / this.canvas.height;

        const x = (vertex.x / (vertex.z * scale * aspect)) * this.screenCenterX + this.screenCenterX;
        const y = (-vertex.y / (vertex.z * scale)) * this.screenCenterY + this.screenCenterY;

        return { x, y, z: vertex.z };
    }

    isFaceVisible(transformedVertices, face) {
        const v0 = transformedVertices[face.vertices[0]];
        const v1 = transformedVertices[face.vertices[1]];
        const v2 = transformedVertices[face.vertices[2]];

        const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
        const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

        const normal = {
            x: edge1.y * edge2.z - edge1.z * edge2.y,
            y: edge1.z * edge2.x - edge1.x * edge2.z,
            z: edge1.x * edge2.y - edge1.y * edge2.x
        };

        const normalLength = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
        if (normalLength > 0) {
            normal.x /= normalLength;
            normal.y /= normalLength;
            normal.z /= normalLength;
        }

        const viewVector = { x: -v0.x, y: -v0.y, z: -v0.z };
        const dot = normal.x * viewVector.x + normal.y * viewVector.y + normal.z * viewVector.z;
        return dot > 0;
    }

    interpolateVertex(v1, v2, t) {
        return {
            x: v1.x + (v2.x - v1.x) * t,
            y: v1.y + (v2.y - v1.y) * t,
            z: v1.z + (v2.z - v1.z) * t
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

    subdivideFace(vertices, subdivisionLevel) {
        if (subdivisionLevel <= 1) {
            return [{
                vertices: vertices,
                depth: vertices.reduce((sum, v) => sum + v.z, 0) / vertices.length
            }];
        }

        const subFaces = [];
        const step = 1.0 / subdivisionLevel;

        for (let i = 0; i < subdivisionLevel; i++) {
            for (let j = 0; j < subdivisionLevel; j++) {
                const u1 = i * step;
                const u2 = (i + 1) * step;
                const v1 = j * step;
                const v2 = (j + 1) * step;

                const topLeft = this.bilinearInterpolate(vertices, u1, v1);
                const topRight = this.bilinearInterpolate(vertices, u2, v1);
                const bottomLeft = this.bilinearInterpolate(vertices, u1, v2);
                const bottomRight = this.bilinearInterpolate(vertices, u2, v2);

                const subFaceVertices = [topLeft, topRight, bottomRight, bottomLeft];
                const depth = subFaceVertices.reduce((sum, v) => sum + v.z, 0) / subFaceVertices.length;

                subFaces.push({ vertices: subFaceVertices, depth });
            }
        }

        return subFaces;
    }

    improvedPainterAlgorithm(faceInfos) {
        const visibleFaces = [];

        for (const faceInfo of faceInfos) {
            if (!faceInfo.isVisible) continue;

            const subFaces = this.subdivideFace(faceInfo.vertices, this.subdivisionLevel);
            const avgDepth = subFaces.reduce((sum, sub) => sum + sub.depth, 0) / subFaces.length;

            const screenVertices = faceInfo.vertices.map(v => this.projectVertex(v));
            if (screenVertices.includes(null)) continue;

            visibleFaces.push({
                face: faceInfo.face,
                vertices: faceInfo.vertices,
                screenVertices,
                depth: avgDepth,
                isVisible: true
            });
        }

        visibleFaces.sort((a, b) => b.depth - a.depth);
        return visibleFaces;
    }

    renderFace(faceInfo) {
        const screenVertices = faceInfo.screenVertices;
        const face = faceInfo.face;

        this.ctx.beginPath();
        this.ctx.moveTo(screenVertices[0].x, screenVertices[0].y);
        for (let i = 1; i < screenVertices.length; i++) {
            this.ctx.lineTo(screenVertices[i].x, screenVertices[i].y);
        }
        this.ctx.closePath();

        if (this.wireframeMode) {
            this.ctx.strokeStyle = face.color;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        } else {
            this.ctx.fillStyle = face.color;
            this.ctx.fill();
        }
    }

    renderAxis() {
        const axisLength = 1.0;
        const origin = { x: 0, y: 0, z: 0 };

        const axes = [
            { end: this.camera.right.multiply(axisLength), color: '#FF0000' },
            { end: this.camera.up.multiply(axisLength), color: '#00FF00' },
            { end: this.camera.forward.multiply(axisLength), color: '#0000FF' }
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

        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('X', axisOriginX + 45, axisOriginY);
        this.ctx.fillText('Y', axisOriginX, axisOriginY - 45);
        this.ctx.fillText('Z', axisOriginX + 20, axisOriginY - 20);
    }

    renderCoordinates() {
        const pos = this.camera.position;

        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 100);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`Позиція камери:`, 20, 30);
        this.ctx.fillText(`X: ${this.formatCoordinate(pos.x)}`, 20, 50);
        this.ctx.fillText(`Y: ${this.formatCoordinate(pos.y)}`, 20, 70);
        this.ctx.fillText(`Z: ${this.formatCoordinate(pos.z)}`, 20, 90);

        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillStyle = '#00FF00';
        const textX = this.screenWidth - 150;
        const textY = 30;
        this.ctx.fillText(`x:${this.formatCoordinate(pos.x)}`, textX, textY);
        this.ctx.fillText(`y:${this.formatCoordinate(pos.y)}`, textX, textY + 25);
        this.ctx.fillText(`z:${this.formatCoordinate(pos.z)}`, textX, textY + 50);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const allFaces = [];

        for (const cube of this.scene.cubes) {
            const transformedVertices = cube.transform(this.camera);
            for (const face of cube.faces) {
                const isVisible = this.wireframeMode || this.isFaceVisible(transformedVertices, face);
                const faceVertices = face.vertices.map(idx => transformedVertices[idx]);
                allFaces.push({ face, vertices: faceVertices, isVisible });
            }
        }

        const visibleFaces = this.improvedPainterAlgorithm(allFaces);
        for (const faceInfo of visibleFaces) {
            this.renderFace(faceInfo);
        }

        this.renderAxis();
        this.renderCoordinates();
    }
}