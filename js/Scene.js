class Scene {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = new Camera();
        this.objects = [];
        this.wireframe = false;
        this.keys = new Set();

        this.initializeScene();
        this.setupEventListeners();
        this.render();
    }

    initializeScene() {
        // Create four cubes as specified in the requirements
        this.objects = [
            new Cube(new Point3D(-4, 0, 8), 2, [0, 150, 255]),  // Blue cube
            new Cube(new Point3D(4, 0, 8), 2, [0, 255, 60]),    // Green cube
            new Cube(new Point3D(-4, 0, 4), 2, [255, 255, 80]), // Yellow cube
            new Cube(new Point3D(4, 0, 4), 2, [255, 50, 0])     // Red cube
        ];

        // Set canvas size and camera aspect ratio
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.camera.setAspect(this.canvas.width / this.canvas.height);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
            if (e.key.toLowerCase() === 'm') {
                this.wireframe = !this.wireframe;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
        });
    }

    update() {
        // Handle camera movement
        if (this.keys.has('w')) this.camera.moveForward(1);
        if (this.keys.has('s')) this.camera.moveForward(-1);
        if (this.keys.has('a')) this.camera.moveRight(-1);
        if (this.keys.has('d')) this.camera.moveRight(1);
        if (this.keys.has('q')) this.camera.moveUp(1);
        if (this.keys.has('e')) this.camera.moveUp(-1);

        // Handle camera rotation
        if (this.keys.has('arrowup')) this.camera.rotate(new Vector3(1, 0, 0), -1);
        if (this.keys.has('arrowdown')) this.camera.rotate(new Vector3(1, 0, 0), 1);
        if (this.keys.has('arrowleft')) this.camera.rotate(new Vector3(0, 1, 0), -1);
        if (this.keys.has('arrowright')) this.camera.rotate(new Vector3(0, 1, 0), 1);
        if (this.keys.has('z')) this.camera.rotate(new Vector3(0, 0, 1), -1);
        if (this.keys.has('c')) this.camera.rotate(new Vector3(0, 0, 1), 1);

        // Handle FOV (zoom)
        if (this.keys.has('+')) this.camera.adjustFOV(-0.02);
        if (this.keys.has('-')) this.camera.adjustFOV(0.02);

        // Update camera interpolation
        this.camera.update();
    }

    render() {
        this.update();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Get camera matrices
        const viewMatrix = this.camera.getViewMatrix();
        const projectionMatrix = this.camera.getProjectionMatrix();
        const viewProjectionMatrix = projectionMatrix.multiply(viewMatrix);

        // Sort objects by distance to camera (painter's algorithm)
        const sortedObjects = [...this.objects].sort((a, b) => {
            const distA = a.getCenter().toVector3().subtract(this.camera.position).length();
            const distB = b.getCenter().toVector3().subtract(this.camera.position).length();
            return distB - distA;
        });

        // Draw objects
        for (const object of sortedObjects) {
            object.draw(this.ctx, viewProjectionMatrix, this.canvas.width, this.canvas.height, this.wireframe);
        }

        // Continue rendering
        requestAnimationFrame(() => this.render());
    }
}