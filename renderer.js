class Renderer {
    constructor(canvas, camera, scene) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = camera;
        this.scene = scene;
        
        // Rendering mode
        this.wireframeMode = false;
        
        // Parametry projekcji
        this.screenWidth = canvas.width;
        this.screenHeight = canvas.height;
        this.screenCenterX = this.screenWidth / 2;
        this.screenCenterY = this.screenHeight / 2;
        
        // Ensure canvas fills the window
        this.resize();
        
        // Listen for window resizing
        window.addEventListener('resize', () => this.resize());
    }
    
    // Resize the canvas and update projection parameters
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.screenWidth = this.canvas.width;
        this.screenHeight = this.canvas.height;
        this.screenCenterX = this.screenWidth / 2;
        this.screenCenterY = this.screenHeight / 2;
        
        // Update camera aspect ratio
        this.camera.aspect = this.canvas.width / this.canvas.height;
    }
    
    // Set wireframe mode
    setWireframeMode(enabled) {
        this.wireframeMode = enabled;
    }
    
    // Rzutowanie punktu 3D na ekran 2D
    projectVertex(vertex) {
        // Sprawdź, czy punkt jest za kamerą
        if (vertex.z <= 0) {
            return null; // Punkt za kamerą
        }
        
        // Oblicz współczynnik projekcji (perspektywa)
        const scale = Math.tan(this.camera.fov / 2);
        const aspect = this.canvas.width / this.canvas.height;
        
        // Projekcja perspektywiczna
        const x = (vertex.x / (vertex.z * scale * aspect)) * this.screenCenterX + this.screenCenterX;
        const y = (-vertex.y / (vertex.z * scale)) * this.screenCenterY + this.screenCenterY;
        
        return { x, y, z: vertex.z }; // Zwróć współrzędne ekranowe i głębokość
    }
    
    // Rysowanie pojedynczej ściany
    renderFace(transformedVertices, face) {
        const screenVertices = [];
        
        // Rzutuj wszystkie wierzchołki ściany
        for (const vertexIdx of face.vertices) {
            const vertex = transformedVertices[vertexIdx];
            const projected = this.projectVertex(vertex);
            
            // Jeśli którykolwiek wierzchołek jest za kamerą, pomijamy całą ścianę
            if (!projected) return;
            
            screenVertices.push(projected);
        }
        
        // Oblicz średnią głębokość ściany (do algorytmu malarskiego)
        const avgDepth = screenVertices.reduce((sum, v) => sum + v.z, 0) / screenVertices.length;
        
        // Rysuj wielokąt
        this.ctx.beginPath();
        this.ctx.moveTo(screenVertices[0].x, screenVertices[0].y);
        
        for (let i = 1; i < screenVertices.length; i++) {
            this.ctx.lineTo(screenVertices[i].x, screenVertices[i].y);
        }
        
        this.ctx.closePath();
        
        if (this.wireframeMode) {
            // Tryb wireframe - tylko linie
            this.ctx.strokeStyle = face.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else {
            // Tryb wypełniany - ściany i obramowanie
            this.ctx.fillStyle = face.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        return avgDepth;
    }
    
    // Główna metoda renderująca
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const allFaces = [];
    
        // Збір всіх граней
        for (const cube of this.scene.cubes) {
            const transformedVertices = cube.transform(this.camera);
            for (const face of cube.faces) {
                const normal = face.normal;
                const v0 = transformedVertices[face.vertices[0]];
                const viewVector = { x: v0.x, y: v0.y, z: v0.z };
                const dot = normal.x * viewVector.x + normal.y * viewVector.y + normal.z * viewVector.z;
    
                if (this.wireframeMode || dot < 0) {
                    allFaces.push({
                        transformedVertices,
                        face,
                        depth: 0,
                        isVisible: dot < 0
                    });
                }
            }
        }
    
        // Сортування за глибиною
        for (const faceInfo of allFaces) {
            const avgDepth = faceInfo.transformedVertices.reduce((sum, v) => sum + v.z, 0) / 
                            faceInfo.transformedVertices.length;
            faceInfo.depth = avgDepth;
        }
        allFaces.sort((a, b) => b.depth - a.depth);
    
        // Рендеринг
        for (const faceInfo of allFaces) {
            if (this.wireframeMode) {
                // Wireframe: всі грані відображаються без прозорості
                this.renderFace(faceInfo.transformedVertices, faceInfo.face);
            } else {
                // Звичайний режим: тільки видимі грані
                this.renderFace(faceInfo.transformedVertices, faceInfo.face);
            }
        }
    }
}