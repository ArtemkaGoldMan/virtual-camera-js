class Quaternion {
    constructor(w = 1, x = 0, y = 0, z = 0) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    // Normalizacja kwaternionu
    normalize() {
        const length = Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
        if (length > 0) {
            this.w /= length;
            this.x /= length;
            this.y /= length;
            this.z /= length;
        }
        return this;
    }
    
    // Mnożenie kwaternionów
    multiply(q) {
        const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
        const x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y;
        const y = this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x;
        const z = this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w;
        
        return new Quaternion(w, x, y, z);
    }
    
    // Sprzężenie kwaternionu
    conjugate() {
        return new Quaternion(this.w, -this.x, -this.y, -this.z);
    }
    
    // Kwaternion z osi i kąta
    static fromAxisAngle(axis, angle) {
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        
        return new Quaternion(
            Math.cos(halfAngle),
            axis.x * s,
            axis.y * s,
            axis.z * s
        ).normalize();
    }
    
    // Obrót punktu przez kwaternion
    rotatePoint(point) {
        // Przekształć punkt na kwaternion
        const p = new Quaternion(0, point.x, point.y, point.z);
        
        // Wykonaj rotację: q * p * q^-1
        const rotated = this.multiply(p).multiply(this.conjugate());
        
        return { x: rotated.x, y: rotated.y, z: rotated.z };
    }
    
    // SLERP interpolacja między dwoma kwaternionami
    static slerp(q1, q2, t) {
        let w1 = q1.w, x1 = q1.x, y1 = q1.y, z1 = q1.z;
        let w2 = q2.w, x2 = q2.x, y2 = q2.y, z2 = q2.z;
        
        // Oblicz kosinus kąta między kwaternionami
        let cosHalfTheta = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;
        
        // Jeśli q1 i q2 są zbyt blisko, wykonaj liniową interpolację
        if (Math.abs(cosHalfTheta) >= 1.0) {
            return new Quaternion(w1, x1, y1, z1);
        }
        
        // Upewnij się, że bierzemy najkrótszą drogę
        if (cosHalfTheta < 0) {
            w2 = -w2;
            x2 = -x2;
            y2 = -y2;
            z2 = -z2;
            cosHalfTheta = -cosHalfTheta;
        }
        
        // Oblicz parametry dla SLERP
        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
        
        // Jeśli kąt jest zbyt mały, również użyj liniowej interpolacji
        if (Math.abs(sinHalfTheta) < 0.001) {
            return new Quaternion(
                w1 + t * (w2 - w1),
                x1 + t * (x2 - x1),
                y1 + t * (y2 - y1),
                z1 + t * (z2 - z1)
            ).normalize();
        }
        
        // Wykonaj SLERP
        const a = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const b = Math.sin(t * halfTheta) / sinHalfTheta;
        
        return new Quaternion(
            w1 * a + w2 * b,
            x1 * a + x2 * b,
            y1 * a + y2 * b,
            z1 * a + z2 * b
        ).normalize();
    }
}