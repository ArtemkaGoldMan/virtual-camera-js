class Renderer {
    constructor(canvas, camera, scene) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = camera;
        this.scene = scene;
        
        // Rendering mode
        this.wireframeMode = false;
        
        // Параметри проекції
        this.screenWidth = canvas.width;
        this.screenHeight = canvas.height;
        this.screenCenterX = this.screenWidth / 2;
        this.screenCenterY = this.screenHeight / 2;
        
        // Переконайтеся, що canvas заповнює вікно
        this.resize();
        
        // Слухайте зміни розміру вікна
        window.addEventListener('resize', () => this.resize());
    }
    
    // Змінити розмір canvas і оновити параметри проекції
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.screenWidth = this.canvas.width;
        this.screenHeight = this.canvas.height;
        this.screenCenterX = this.screenWidth / 2;
        this.screenCenterY = this.screenHeight / 2;
        
        // Оновити співвідношення сторін камери
        this.camera.aspect = this.canvas.width / this.canvas.height;
    }
    
    // Встановити режим wireframe
    setWireframeMode(enabled) {
        this.wireframeMode = enabled;
    }
    
    // Форматувати координату з провідними нулями (5 цифр)
    formatCoordinate(value) {
        // Перетворити на ціле число (видалити десяткову частину)
        const intValue = Math.floor(Math.abs(value) * 100);
        // Форматувати з провідними нулями до 5 цифр
        const formatted = intValue.toString().padStart(5, '0');
        // Додати мінус, якщо від'ємне
        return value < 0 ? `-${formatted}` : formatted;
    }
    
    // Проектування вершини 3D на екран 2D
    projectVertex(vertex) {
        // Перевірка, чи вершина знаходиться за камерою
        if (vertex.z <= 0.1) { // Невелике зміщення для запобігання точок на нульовій площині
            return null; // Вершина за камерою
        }
        
        // Обчислити коефіцієнт проекції (перспектива)
        const scale = Math.tan(this.camera.fov / 2);
        const aspect = this.canvas.width / this.canvas.height;
        
        // Перспективна проекція
        const x = (vertex.x / (vertex.z * scale * aspect)) * this.screenCenterX + this.screenCenterX;
        const y = (-vertex.y / (vertex.z * scale)) * this.screenCenterY + this.screenCenterY;
        
        return { x, y, z: vertex.z }; // Повернути екранні координати та глибину
    }
    
    // Правильно обчислити видимість грані
    isFaceVisible(transformedVertices, face) {
        // Отримати три вершини для обчислення нормалі
        const v0 = transformedVertices[face.vertices[0]];
        const v1 = transformedVertices[face.vertices[1]];
        const v2 = transformedVertices[face.vertices[2]];
        
        // Обчислити вектори сторін
        const edge1 = {
            x: v1.x - v0.x,
            y: v1.y - v0.y,
            z: v1.z - v0.z
        };
        
        const edge2 = {
            x: v2.x - v0.x,
            y: v2.y - v0.y,
            z: v2.z - v0.z
        };
        
        // Обчислити нормаль грані через векторний добуток
        const normal = {
            x: edge1.y * edge2.z - edge1.z * edge2.y,
            y: edge1.z * edge2.x - edge1.x * edge2.z,
            z: edge1.x * edge2.y - edge1.y * edge2.x
        };
        
        // Нормалізувати нормаль
        const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
        if (normalLength > 0) {
            normal.x /= normalLength;
            normal.y /= normalLength;
            normal.z /= normalLength;
        }
        
        // Вектор огляду - від вершини до камери
        // (камера знаходиться в точці (0, 0, 0) після трансформації)
        const viewVector = {
            x: -v0.x,
            y: -v0.y,
            z: -v0.z
        };
        
        // Скалярний добуток нормалі та вектора огляду
        const dot = normal.x * viewVector.x + normal.y * viewVector.y + normal.z * viewVector.z;
        
        // Грань видима, якщо скалярний добуток > 0
        return dot > 0;
    }
    
    // Відсікання граней, що перетинаються
    clipPolygons(faceInfos) {
        // Сортування за глибиною (найдальший спочатку)
        faceInfos.sort((a, b) => b.depth - a.depth);
        
        // Масив для зберігання видимих граней
        const visibleFaces = [];
        
        for (const faceInfo of faceInfos) {
            // Перевірити, чи грань видима
            if (!faceInfo.isVisible) continue;
            
            // Проекція вершин грані на екран
            const screenVertices = faceInfo.vertices.map(v => this.projectVertex(v));
            
            // Пропустити, якщо хоча б одна вершина за камерою
            if (screenVertices.includes(null)) continue;
            
            // Додати грань до видимих
            visibleFaces.push({
                ...faceInfo,
                screenVertices
            });
        }
        
        return visibleFaces;
    }
    
    // Рендер грані на екрані
    renderFace(faceInfo) {
        const screenVertices = faceInfo.screenVertices;
        const face = faceInfo.face;
        
        // Рисуємо полігон
        this.ctx.beginPath();
        this.ctx.moveTo(screenVertices[0].x, screenVertices[0].y);
        
        for (let i = 1; i < screenVertices.length; i++) {
            this.ctx.lineTo(screenVertices[i].x, screenVertices[i].y);
        }
        
        this.ctx.closePath();
        
        if (this.wireframeMode) {
            // Режим wireframe - тільки лінії
            this.ctx.strokeStyle = face.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else {
            // Режим заповнення - грані та обведення
            this.ctx.fillStyle = face.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
    
    // Візуалізація осей координат
    renderAxis() {
        const axisLength = 1.0; // Довжина осі
        const origin = { x: 0, y: 0, z: 0 };
        
        // Локальні осі камери
        const axes = [
            { end: this.camera.right.multiply(axisLength), color: '#FF0000' }, // X - червоний
            { end: this.camera.up.multiply(axisLength), color: '#00FF00' }, // Y - зелений
            { end: this.camera.forward.multiply(axisLength), color: '#0000FF' } // Z - синій
        ];
        
        // Позиція для відображення на екрані
        const axisOriginX = 80;
        const axisOriginY = this.screenHeight - 80;
        
        // Рисуємо осі
        for (const axis of axes) {
            this.ctx.beginPath();
            this.ctx.moveTo(axisOriginX, axisOriginY);
            
            // Обчислити кінцеву позицію осі
            const endX = axisOriginX + axis.end.x * 40;
            const endY = axisOriginY - axis.end.y * 40; // Інвертуємо Y (екранна вісь Y росте вниз)
            
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = axis.color;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        // Позначки осей
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('X', axisOriginX + 45, axisOriginY);
        this.ctx.fillText('Y', axisOriginX, axisOriginY - 45);
        this.ctx.fillText('Z', axisOriginX + 20, axisOriginY - 20);
    }
    
    // Відображення координат камери
    renderCoordinates() {
        const pos = this.camera.position;
        
        // Відображення координат
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        
        // Фон для тексту
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        // Відображення координат з форматуванням
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`Позиція камери:`, 20, 30);
        
        // Форматоване відображення з провідними нулями
        this.ctx.fillText(`X: ${this.formatCoordinate(pos.x)}`, 20, 50);
        this.ctx.fillText(`Y: ${this.formatCoordinate(pos.y)}`, 20, 70);
        this.ctx.fillText(`Z: ${this.formatCoordinate(pos.z)}`, 20, 90);
        
        // Додатковий дисплей координат в "комп'ютерному" стилі
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillStyle = '#00FF00'; // Зелений колір для "комп'ютерного" вигляду
        
        // Позиція в правому верхньому куті
        const textX = this.screenWidth - 150;
        const textY = 30;
        
        this.ctx.fillText(`x:${this.formatCoordinate(pos.x)}`, textX, textY);
        this.ctx.fillText(`y:${this.formatCoordinate(pos.y)}`, textX, textY + 25);
        this.ctx.fillText(`z:${this.formatCoordinate(pos.z)}`, textX, textY + 50);
    }
    
    // Головний метод рендерингу
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const allFaces = [];
        
        // Збір усіх граней
        for (const cube of this.scene.cubes) {
            const transformedVertices = cube.transform(this.camera);
            
            for (const face of cube.faces) {
                // Перевірка видимості грані
                const isVisible = this.wireframeMode || this.isFaceVisible(transformedVertices, face);
                
                // Отримати вершини грані
                const faceVertices = face.vertices.map(idx => transformedVertices[idx]);
                
                // Обчислити середню глибину грані
                const avgDepth = faceVertices.reduce((sum, v) => sum + v.z, 0) / faceVertices.length;
                
                // Додати інформацію про грань
                allFaces.push({
                    face,
                    vertices: faceVertices,
                    depth: avgDepth,
                    isVisible
                });
            }
        }
        
        // Відсіювання і обробка граней, що перетинаються
        const visibleFaces = this.clipPolygons(allFaces);
        
        // Рендер усіх видимих граней
        for (const faceInfo of visibleFaces) {
            this.renderFace(faceInfo);
        }
        
        // Відображення осей та координат камери
        this.renderAxis();
        this.renderCoordinates();
    }
}