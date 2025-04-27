class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    // Dodawanie wektorów
    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    
    // Odejmowanie wektorów
    subtract(v) {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    
    // Mnożenie przez skalar
    multiply(scalar) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    
    // Długość wektora
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    // Normalizacja wektora
    normalize() {
        const len = this.length();
        if (len > 0) {
            return new Vector3(this.x / len, this.y / len, this.z / len);
        }
        return new Vector3();
    }
    
    // Iloczyn skalarny
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    
    // Iloczyn wektorowy
    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
    
    // Klonowanie wektora
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
}