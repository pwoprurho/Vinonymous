// 3D Logo using Three.js - VINICIUS V Logo
// Supports multiple containers by exposing initLogo3D function

function initLogo3D(containerId) {
    const container = document.getElementById(containerId || 'logo3d');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(150, 150);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Materials - exact colors from Vinicius logo
    const redMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xdc2626,
        shininess: 100,
        specular: 0x444444
    });
    
    const blackMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a1a1a,
        shininess: 100,
        specular: 0x444444
    });

    // Create V-shaped logo group
    const logoGroup = new THREE.Group();

    // Helper function to create a diagonal bar
    function createBar(xOffset, material, angle) {
        const barWidth = 0.22;
        const barHeight = 2.8;
        const barDepth = 0.25;
        
        const geometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
        const bar = new THREE.Mesh(geometry, material);
        
        bar.rotation.z = angle;
        bar.position.x = xOffset;
        bar.position.y = 0;
        
        return bar;
    }

    const leftAngle = Math.PI / 5.5;  // ~33 degrees for left bars
    const rightAngle = -Math.PI / 5.5; // ~-33 degrees for right bars

    // LEFT SIDE (from outside to inside): 1 black (outer), 1 red (inner)
    // Black bar (outermost left)
    const leftBlackOuter = createBar(-1.0, blackMaterial, leftAngle);
    logoGroup.add(leftBlackOuter);

    // Red bar (inside, next to outer black)
    const redBar = createBar(-0.65, redMaterial, leftAngle);
    logoGroup.add(redBar);

    // RIGHT SIDE (from inside to outside): 3 black bars
    const rightBlack1 = createBar(0.65, blackMaterial, rightAngle);
    logoGroup.add(rightBlack1);

    const rightBlack2 = createBar(1.0, blackMaterial, rightAngle);
    logoGroup.add(rightBlack2);

    const rightBlack3 = createBar(1.35, blackMaterial, rightAngle);
    logoGroup.add(rightBlack3);

    // Position logo
    logoGroup.position.y = 0;
    scene.add(logoGroup);

    // Lighting - bright for white background
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 5, 5);
    scene.add(fillLight);

    // Animation
    let mouseX = 0;
    let mouseY = 0;

    // Mouse interaction
    document.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX = (e.clientX - centerX) / window.innerWidth;
        mouseY = (e.clientY - centerY) / window.innerHeight;
    });

    function animate() {
        requestAnimationFrame(animate);

        // Subtle rotation based on mouse position only
        logoGroup.rotation.y = mouseX * 0.4;
        logoGroup.rotation.x = mouseY * 0.2;

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        renderer.setSize(150, 150);
    });
}

// Auto-initialize for main logo3d container
document.addEventListener('DOMContentLoaded', () => {
    initLogo3D('logo3d');
});
