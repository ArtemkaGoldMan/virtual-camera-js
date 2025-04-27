class Camera {
    constructor() {
        // Pozycja kamery
        this.position = new Vector3(0, 0, -10);
        
        // Orientacja kamery (jako kwaternion)
        this.orientation = new Quaternion(1, 0, 0, 0);
        
        // Docelowa orientacja do interpolacji SLERP
        this.targetOrientation = this.orientation;
        
        // Parametry kamery
        this.fov = Math.PI / 4; // Kąt widzenia (45 stopni)
        this.aspect = canvas.width / canvas.height;
        this.near = 0.1;
        this.far = 1000;
        
        // Parametry animacji
        this.animating = false;
        this.animationProgress = 0;
        this.animationDuration = 2; // sekundy
        
        // Kierunki lokalne kamery
        this.forward = new Vector3(0, 0, 1);
        this.up = new Vector3(0, 1, 0);
        this.right = new Vector3(1, 0, 0);
        
        this.updateVectors();
    }
    
    // Aktualizacja wektorów kierunkowych kamery
    updateVectors() {
        // Wektor "do przodu" w układzie globalnym
        const forwardGlobal = this.orientation.rotatePoint({ x: 0, y: 0, z: 1 });
        this.forward = new Vector3(forwardGlobal.x, forwardGlobal.y, forwardGlobal.z);
        
        // Wektor "w górę" w układzie globalnym
        const upGlobal = this.orientation.rotatePoint({ x: 0, y: 1, z: 0 });
        this.up = new Vector3(upGlobal.x, upGlobal.y, upGlobal.z);
        
        // Wektor "w prawo" w układzie globalnym
        const rightGlobal = this.orientation.rotatePoint({ x: 1, y: 0, z: 0 });
        this.right = new Vector3(rightGlobal.x, rightGlobal.y, rightGlobal.z);
    }
    
    // Ruch kamery w kierunku lokalnym
    move(direction, amount) {
        switch (direction) {
            case 'forward':
                this.position = this.position.add(this.forward.multiply(amount));
                break;
            case 'right':
                this.position = this.position.add(this.right.multiply(amount));
                break;
            case 'up':
                this.position = this.position.add(this.up.multiply(amount));
                break;
        }
    }
    
    // Obrót kamery wokół osi lokalnej
    rotate(axis, angle) {
        let rotAxis;
        
        // Wybierz odpowiednią oś lokalną
        switch (axis) {
            case 'x': rotAxis = this.right; break;
            case 'y': rotAxis = this.up; break;
            case 'z': rotAxis = this.forward; break;
        }
        
        // Stwórz kwaternion rotacji
        const rotation = Quaternion.fromAxisAngle(rotAxis, angle);
        
        // Zastosuj rotację do orientacji kamery
        this.orientation = rotation.multiply(this.orientation).normalize();
        
        // Aktualizuj wektory kierunkowe kamery
        this.updateVectors();
    }
    
    // Płynna zmiana orientacji z wykorzystaniem SLERP
    setTargetOrientation(targetQuat) {
        this.targetOrientation = targetQuat;
        this.animating = true;
        this.animationProgress = 0;
    }
    
    // Losowa orientacja kamery
    setRandomOrientation() {
        // Utwórz losową orientację
        const randomQuat = new Quaternion(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize();
        
        // Ustaw jako cel animacji
        this.setTargetOrientation(randomQuat);
    }
    
    // Aktualizacja kamery (dla animacji SLERP)
    update(deltaTime) {
        if (this.animating) {
            this.animationProgress += deltaTime / this.animationDuration;
            
            if (this.animationProgress >= 1) {
                this.orientation = this.targetOrientation;
                this.animating = false;
            } else {
                // Interpolacja SLERP między aktualną a docelową orientacją
                this.orientation = Quaternion.slerp(
                    this.orientation,
                    this.targetOrientation,
                    this.animationProgress
                );
            }
            
            // Aktualizuj wektory kierunkowe
            this.updateVectors();
        }
    }
    
    // Zmiana FOV (zoom)
    zoom(delta) {
        this.fov = Math.max(Math.PI / 12, Math.min(Math.PI / 2, this.fov + delta));
    }
    
    // Reset kamery do pozycji początkowej
    reset() {
        this.position = new Vector3(0, 0, -10);
        this.targetOrientation = new Quaternion(1, 0, 0, 0);
        this.animating = true;
        this.animationProgress = 0;
        this.fov = Math.PI / 4;
    }
}