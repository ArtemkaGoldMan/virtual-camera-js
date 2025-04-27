class Point3D {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.screenX = 0;
        this.screenY = 0;
    }

    toVector3() {
        return new Vector3(this.x, this.y, this.z);
    }

    static fromVector3(v) {
        return new Point3D(v.x, v.y, v.z);
    }

    clone() {
        return new Point3D(this.x, this.y, this.z);
    }

    project(matrix, width, height) {
        const projected = matrix.transformPoint(this);
        if (projected.z < -1 || projected.z > 1) return false;

        this.screenX = (projected.x + 1) * width * 0.5;
        this.screenY = (-projected.y + 1) * height * 0.5;
        return true;
    }
}