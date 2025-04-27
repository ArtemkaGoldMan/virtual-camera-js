class Cube {
    constructor(position, size, color) {
        this.position = position;
        this.size = size;
        this.color = color;
        
        // Extract RGB values for possible transparency use
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);
        this.rgbColor = `rgb(${r}, ${g}, ${b})`;
        
        // Definiowanie wierzchołków sześcianu
        const s = size / 2;
        this.vertices = [
            // Przód
            { x: -s, y: -s, z: s },
            { x: s, y: -s, z: s },
            { x: s, y: s, z: s },
            { x: -s, y: s, z: s },
            // Tył
            { x: -s, y: -s, z: -s },
            { x: s, y: -s, z: -s },
            { x: s, y: s, z: -s },
            { x: -s, y: s, z: -s }
        ];
        
        // Definiowanie ścian sześcianu (indeksy wierzchołków)
        this.faces = [
            // Ściana przód
            { vertices: [0, 1, 2, 3], color: this.rgbColor, normal: { x: 0, y: 0, z: 1 } },
            // Ściana tył
            { vertices: [5, 4, 7, 6], color: this.rgbColor, normal: { x: 0, y: 0, z: -1 } },
            // Ściana prawo
            { vertices: [1, 5, 6, 2], color: this.rgbColor, normal: { x: 1, y: 0, z: 0 } },
            // Ściana lewo
            { vertices: [4, 0, 3, 7], color: this.rgbColor, normal: { x: -1, y: 0, z: 0 } },
            // Ściana góra
            { vertices: [3, 2, 6, 7], color: this.rgbColor, normal: { x: 0, y: 1, z: 0 } },
            // Ściana dół
            { vertices: [4, 5, 1, 0], color: this.rgbColor, normal: { x: 0, y: -1, z: 0 } }
        ];
    }
    
    // Transformacja sześcianu względem kamery
    transform(camera) {
        const transformedVertices = [];
        
        // Przekształć wszystkie wierzchołki
        for (const v of this.vertices) {
            // Przesunięcie wierzchołka o pozycję sześcianu
            const worldPos = {
                x: v.x + this.position.x,
                y: v.y + this.position.y,
                z: v.z + this.position.z
            };
            
            // Przesunięcie względem kamery
            const relativeToCam = {
                x: worldPos.x - camera.position.x,
                y: worldPos.y - camera.position.y,
                z: worldPos.z - camera.position.z
            };
            
            // Rotacja względem kamery (odwrotna do orientacji kamery)
            const conj = camera.orientation.conjugate();
            const rotated = conj.rotatePoint(relativeToCam);
            
            // Dodaj do listy przekształconych wierzchołków
            transformedVertices.push(rotated);
        }
        
        return transformedVertices;
    }
}

class Scene {
    constructor() {
        // Utwórz cztery sześciany na scenie
        this.cubes = [
            new Cube(new Vector3(0, 0, 0), 2, '#FF4444'),
            new Cube(new Vector3(-4, 1, -2), 1.5, '#44FF44'),
            new Cube(new Vector3(3, -1, 2), 1.2, '#4444FF'),
            new Cube(new Vector3(1, 3, -4), 1.8, '#FFFF44')
        ];
    }
}