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
        this.camera.aspect = this.canvas.width / this.camera.height;
    }
    
    // Set wireframe mode
    setWireframeMode(enabled) {
        this.wireframeMode = enabled;
    }
    
    // Format coordinate number with leading zeros (5 digits)
    formatCoordinate(value) {
        // Convert to integer (remove decimal part)
        const intValue = Math.floor(Math.abs(value) * 100);
        // Format with leading zeros to 5 digits
        const formatted = intValue.toString().padStart(5, '0');
        // Add minus sign if negative
        return value < 0 ? `-${formatted}` : formatted;
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
    
    // Rysowanie osi współrzędnych
    renderAxis() {
        const axisLength = 1.0; // Długość osi
        const origin = { x: 0, y: 0, z: 0 };
        
        // Osie lokalne kamery
        const axes = [
            { end: this.camera.right.multiply(axisLength), color: '#FF0000' }, // X - czerwony
            { end: this.camera.up.multiply(axisLength), color: '#00FF00' }, // Y - zielony
            { end: this.camera.forward.multiply(axisLength), color: '#0000FF' } // Z - niebieski
        ];
        
        // Pozycja wyświetlania na ekranie
        const axisOriginX = 80;
        const axisOriginY = this.screenHeight - 80;
        
        // Rysuj osie
        for (const axis of axes) {
            this.ctx.beginPath();
            this.ctx.moveTo(axisOriginX, axisOriginY);
            
            // Oblicz końcową pozycję osi
            const endX = axisOriginX + axis.end.x * 40;
            const endY = axisOriginY - axis.end.y * 40; // Odwróć Y (ekranowa oś Y rośnie w dół)
            
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = axis.color;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        // Etykiety osi
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('X', axisOriginX + 45, axisOriginY);
        this.ctx.fillText('Y', axisOriginX, axisOriginY - 45);
        this.ctx.fillText('Z', axisOriginX + 20, axisOriginY - 20);
    }
    
    // Wyświetlanie współrzędnych kamery
    renderCoordinates() {
        const pos = this.camera.position;
        
        // Wyświetl współrzędne
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        
        // Tło dla tekstu
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        // Wyświetl współrzędne z formatowaniem
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`Pozycja kamery:`, 20, 30);
        
        // Formated display with leading zeros
        this.ctx.fillText(`X: ${this.formatCoordinate(pos.x)}`, 20, 50);
        this.ctx.fillText(`Y: ${this.formatCoordinate(pos.y)}`, 20, 70);
        this.ctx.fillText(`Z: ${this.formatCoordinate(pos.z)}`, 20, 90);
        
        // Dodatkowy wyświetlacz współrzędnych w stylu "komputerowym" 
        // (jak z przykładu: x: 00031 y: 031203 z: 13001)
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillStyle = '#00FF00'; // Zielony kolor dla "komputerowego" wyglądu
        
        // Pozycja w prawym górnym rogu
        const textX = this.screenWidth - 150;
        const textY = 30;
        
        this.ctx.fillText(`x:${this.formatCoordinate(pos.x)}`, textX, textY);
        this.ctx.fillText(`y:${this.formatCoordinate(pos.y)}`, textX, textY + 25);
        this.ctx.fillText(`z:${this.formatCoordinate(pos.z)}`, textX, textY + 50);
    }
    
    // Główna metoda renderująca
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const allFaces = [];
    
        // Zbieranie wszystkich ścian
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
    
        // Sortowanie według głębokości
        for (const faceInfo of allFaces) {
            const avgDepth = faceInfo.transformedVertices.reduce((sum, v) => sum + v.z, 0) / 
                            faceInfo.transformedVertices.length;
            faceInfo.depth = avgDepth;
        }
        allFaces.sort((a, b) => b.depth - a.depth);
    
        // Renderowanie
        for (const faceInfo of allFaces) {
            if (this.wireframeMode) {
                // Wireframe: wszystkie ściany są widoczne
                this.renderFace(faceInfo.transformedVertices, faceInfo.face);
            } else {
                // Zwykły tryb: tylko widoczne ściany
                this.renderFace(faceInfo.transformedVertices, faceInfo.face);
            }
        }
        
        // Wyświetl osie i współrzędne kamery
        this.renderAxis();
        this.renderCoordinates();
    }
}