class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    static fromAxisAngle(axis, angle) {
        const halfAngle = angle * 0.5;
        const s = Math.sin(halfAngle);
        return new Quaternion(
            axis.x * s,
            axis.y * s,
            axis.z * s,
            Math.cos(halfAngle)
        );
    }

    multiply(q) {
        return new Quaternion(
            this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
            this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
            this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w,
            this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
        );
    }

    conjugate() {
        return new Quaternion(-this.x, -this.y, -this.z, this.w);
    }

    normalize() {
        const length = Math.sqrt(
            this.x * this.x + 
            this.y * this.y + 
            this.z * this.z + 
            this.w * this.w
        );
        if (length === 0) return new Quaternion();
        return new Quaternion(
            this.x / length,
            this.y / length,
            this.z / length,
            this.w / length
        );
    }

    rotateVector(v) {
        const vq = new Quaternion(v.x, v.y, v.z, 0);
        const result = this.multiply(vq).multiply(this.conjugate());
        return new Vector3(result.x, result.y, result.z);
    }

    static slerp(q1, q2, t) {
        let dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
        
        if (dot < 0) {
            q2 = new Quaternion(-q2.x, -q2.y, -q2.z, -q2.w);
            dot = -dot;
        }

        if (dot > 0.9995) {
            return new Quaternion(
                q1.x + t * (q2.x - q1.x),
                q1.y + t * (q2.y - q1.y),
                q1.z + t * (q2.z - q1.z),
                q1.w + t * (q2.w - q1.w)
            ).normalize();
        }

        const theta = Math.acos(dot);
        const sinTheta = Math.sin(theta);
        const w1 = Math.sin((1 - t) * theta) / sinTheta;
        const w2 = Math.sin(t * theta) / sinTheta;

        return new Quaternion(
            w1 * q1.x + w2 * q2.x,
            w1 * q1.y + w2 * q2.y,
            w1 * q1.z + w2 * q2.z,
            w1 * q1.w + w2 * q2.w
        );
    }
}