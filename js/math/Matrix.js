class Matrix {
    constructor() {
        this.data = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    static translation(x, y, z) {
        const m = new Matrix();
        m.data[0][3] = x;
        m.data[1][3] = y;
        m.data[2][3] = z;
        return m;
    }

    static rotationX(angle) {
        const m = new Matrix();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m.data[1][1] = c;
        m.data[1][2] = -s;
        m.data[2][1] = s;
        m.data[2][2] = c;
        return m;
    }

    static rotationY(angle) {
        const m = new Matrix();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m.data[0][0] = c;
        m.data[0][2] = s;
        m.data[2][0] = -s;
        m.data[2][2] = c;
        return m;
    }

    static rotationZ(angle) {
        const m = new Matrix();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m.data[0][0] = c;
        m.data[0][1] = -s;
        m.data[1][0] = s;
        m.data[1][1] = c;
        return m;
    }

    static perspective(fov, aspect, near, far) {
        const m = new Matrix();
        const f = 1.0 / Math.tan(fov / 2);
        const rangeInv = 1 / (near - far);

        m.data[0][0] = f / aspect;
        m.data[1][1] = f;
        m.data[2][2] = (near + far) * rangeInv;
        m.data[2][3] = near * far * rangeInv * 2;
        m.data[3][2] = -1;
        m.data[3][3] = 0;

        return m;
    }

    multiply(other) {
        const result = new Matrix();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result.data[i][j] = 0;
                for (let k = 0; k < 4; k++) {
                    result.data[i][j] += this.data[i][k] * other.data[k][j];
                }
            }
        }
        return result;
    }

    transformPoint(point) {
        const x = point.x * this.data[0][0] + point.y * this.data[0][1] + point.z * this.data[0][2] + this.data[0][3];
        const y = point.x * this.data[1][0] + point.y * this.data[1][1] + point.z * this.data[1][2] + this.data[1][3];
        const z = point.x * this.data[2][0] + point.y * this.data[2][1] + point.z * this.data[2][2] + this.data[2][3];
        const w = point.x * this.data[3][0] + point.y * this.data[3][1] + point.z * this.data[3][2] + this.data[3][3];

        if (w === 0) return new Vector3(x, y, z);
        return new Vector3(x / w, y / w, z / w);
    }
}