class Camera {
    constructor() {
        this.position = new Vector3(0, 0, -5);
        this.rotation = new Quaternion();
        this.targetRotation = new Quaternion();
        this.fov = 70 * Math.PI / 180;
        this.aspect = 1;
        this.near = 0.1;
        this.far = 1000;
        this.moveSpeed = 0.1;
        this.rotateSpeed = 0.02;
        this.lerpFactor = 0.1;
    }

    getViewMatrix() {
        const viewMatrix = new Matrix();
        
        // Apply rotation
        const forward = this.rotation.rotateVector(new Vector3(0, 0, 1));
        const up = this.rotation.rotateVector(new Vector3(0, 1, 0));
        const right = forward.cross(up).normalize();
        
        viewMatrix.data[0] = [right.x, up.x, forward.x, 0];
        viewMatrix.data[1] = [right.y, up.y, forward.y, 0];
        viewMatrix.data[2] = [right.z, up.z, forward.z, 0];
        
        // Apply translation
        viewMatrix.data[0][3] = -this.position.x;
        viewMatrix.data[1][3] = -this.position.y;
        viewMatrix.data[2][3] = -this.position.z;
        
        return viewMatrix;
    }

    getProjectionMatrix() {
        return Matrix.perspective(this.fov, this.aspect, this.near, this.far);
    }

    moveForward(amount) {
        const forward = this.rotation.rotateVector(new Vector3(0, 0, 1));
        this.position = this.position.add(forward.multiply(amount * this.moveSpeed));
    }

    moveRight(amount) {
        const forward = this.rotation.rotateVector(new Vector3(0, 0, 1));
        const up = this.rotation.rotateVector(new Vector3(0, 1, 0));
        const right = forward.cross(up).normalize();
        this.position = this.position.add(right.multiply(amount * this.moveSpeed));
    }

    moveUp(amount) {
        const up = this.rotation.rotateVector(new Vector3(0, 1, 0));
        this.position = this.position.add(up.multiply(amount * this.moveSpeed));
    }

    rotate(axis, angle) {
        const rotationQuat = Quaternion.fromAxisAngle(axis, angle * this.rotateSpeed);
        this.targetRotation = rotationQuat.multiply(this.targetRotation);
    }

    update() {
        // Smoothly interpolate rotation using SLERP
        this.rotation = Quaternion.slerp(this.rotation, this.targetRotation, this.lerpFactor);
    }

    setAspect(aspect) {
        this.aspect = aspect;
    }

    adjustFOV(amount) {
        this.fov = Math.max(0.1, Math.min(Math.PI - 0.1, this.fov + amount));
    }
}