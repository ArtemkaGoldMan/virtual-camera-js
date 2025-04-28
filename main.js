// Główna funkcja inicjalizująca
function init() {
    const canvas = document.getElementById('canvas');
    
    // Inicjalizacja kamery, sceny i renderera
    const camera = new Camera();
    const scene = new Scene();
    const renderer = new Renderer(canvas, camera, scene);
    
    // Zarządzanie klawiaturą
    const keys = {};
    
    // Obsługa naciśnięcia klawisza
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
    });
    
    // Obsługa zwolnienia klawisza
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    // Toggle wireframe mode with 'T' key
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 't') {
            renderer.setWireframeMode(!renderer.wireframeMode);
        }
    });
    
    // Zmienne czasu
    let lastTime = 0;
    
    // Główna pętla animacji
    function animate(currentTime) {
        // Oblicz deltę czasu
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        // Aktualizuj kamerę
        camera.update(deltaTime);
        
        // Obsługa wejścia użytkownika
        handleInput(deltaTime);
        
        // Renderuj scenę
        renderer.render();
        
        // Kontynuuj animację
        requestAnimationFrame(animate);
    }
    
    // Obsługa klawiszy
    function handleInput(deltaTime) {
        const moveSpeed = 3 * deltaTime;
        const rotateSpeed = 1.5 * deltaTime;
        
        // Ruch przód/tył (W/S)
        if (keys['w']) camera.move('forward', moveSpeed);
        if (keys['s']) camera.move('forward', -moveSpeed);
        
        // Ruch lewo/prawo (A/D)
        if (keys['a']) camera.move('right', -moveSpeed);
        if (keys['d']) camera.move('right', moveSpeed);
        
        // Ruch góra/dół (Q/E)
        if (keys['q']) camera.move('up', moveSpeed);
        if (keys['e']) camera.move('up', -moveSpeed);
        
        // Obrót kamery (strzałki)
        if (keys['arrowup']) camera.rotate('x', -rotateSpeed);
        if (keys['arrowdown']) camera.rotate('x', rotateSpeed);
        if (keys['arrowleft']) camera.rotate('y', -rotateSpeed);
        if (keys['arrowright']) camera.rotate('y', rotateSpeed);
        
        // Obrót kamery wokół osi Z (C/V)
        if (keys['c']) camera.rotate('z', -rotateSpeed);
        if (keys['v']) camera.rotate('z', rotateSpeed);
        
        // Zoom (Z/X)
        if (keys['z']) camera.zoom(-0.02);
        if (keys['x']) camera.zoom(0.02);
        
        // Reset kamery (R)
        if (keys['r']) camera.reset();
        
        // Losowa animacja (G)
        if (keys['g'] && !camera.animating) camera.setRandomOrientation();
    }
    
    // Rozpocznij animację
    requestAnimationFrame(animate);
}

// Uruchom po załadowaniu strony
window.addEventListener('load', init);