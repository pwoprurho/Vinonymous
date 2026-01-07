// 3D Mailbox Background Animation
(function() {
    const container = document.getElementById('mailbox3d');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Materials - Red color scheme matching company logo
    const mailboxBodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xdc2626,
        shininess: 80
    });
    
    const mailboxDarkMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xb91c1c,
        shininess: 60
    });

    const flagMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a1a1a,
        shininess: 100
    });

    const envelopeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        shininess: 50
    });

    const postMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        shininess: 30
    });

    // Create Mailbox Group
    const mailboxGroup = new THREE.Group();

    // Post
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.18, 3, 16);
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = -1.5;
    post.castShadow = true;
    mailboxGroup.add(post);

    // Mailbox body (rounded box shape)
    const bodyGeometry = new THREE.BoxGeometry(2.5, 1.5, 1.8);
    const mailboxBody = new THREE.Mesh(bodyGeometry, mailboxBodyMaterial);
    mailboxBody.position.y = 0.5;
    mailboxBody.castShadow = true;
    mailboxBody.receiveShadow = true;
    mailboxGroup.add(mailboxBody);

    // Mailbox curved top
    const topGeometry = new THREE.CylinderGeometry(0.9, 0.9, 2.5, 32, 1, false, 0, Math.PI);
    const mailboxTop = new THREE.Mesh(topGeometry, mailboxBodyMaterial);
    mailboxTop.rotation.z = Math.PI / 2;
    mailboxTop.rotation.y = Math.PI / 2;
    mailboxTop.position.y = 1.25;
    mailboxTop.castShadow = true;
    mailboxGroup.add(mailboxTop);

    // Mail slot
    const slotGeometry = new THREE.BoxGeometry(1.2, 0.08, 0.1);
    const slot = new THREE.Mesh(slotGeometry, mailboxDarkMaterial);
    slot.position.set(0, 0.8, 0.91);
    mailboxGroup.add(slot);

    // Door/Lid (animated part)
    const lidGroup = new THREE.Group();
    const lidGeometry = new THREE.CylinderGeometry(0.85, 0.85, 0.15, 32, 1, false, 0, Math.PI);
    const lid = new THREE.Mesh(lidGeometry, mailboxDarkMaterial);
    lid.rotation.z = Math.PI / 2;
    lid.rotation.y = Math.PI / 2;
    lidGroup.add(lid);
    
    // Lid front face
    const lidFrontGeometry = new THREE.BoxGeometry(0.15, 1.7, 1.7);
    const lidFront = new THREE.Mesh(lidFrontGeometry, mailboxDarkMaterial);
    lidFront.position.x = 1.25;
    lidGroup.add(lidFront);
    
    lidGroup.position.set(-1.25, 1.25, 0);
    mailboxGroup.add(lidGroup);

    // Flag
    const flagGroup = new THREE.Group();
    const flagPoleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const flagPole = new THREE.Mesh(flagPoleGeometry, flagMaterial);
    flagPole.position.y = 0.4;
    flagGroup.add(flagPole);
    
    const flagGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.05);
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(0.2, 0.7, 0);
    flagGroup.add(flag);
    
    flagGroup.position.set(1.4, 0.5, 0);
    flagGroup.rotation.z = -Math.PI / 4; // Down position
    mailboxGroup.add(flagGroup);

    // Position mailbox
    mailboxGroup.position.set(0, -1, -2);
    mailboxGroup.rotation.y = 0;
    mailboxGroup.scale.set(1.5, 1.5, 1.5);
    scene.add(mailboxGroup);

    // Envelope (for animation)
    const envelopeGroup = new THREE.Group();
    const envelopeGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.05);
    const envelope = new THREE.Mesh(envelopeGeometry, envelopeMaterial);
    envelopeGroup.add(envelope);
    
    // Envelope flap
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-0.4, 0);
    flapShape.lineTo(0, 0.3);
    flapShape.lineTo(0.4, 0);
    flapShape.lineTo(-0.4, 0);
    
    const flapGeometry = new THREE.ShapeGeometry(flapShape);
    const flap = new THREE.Mesh(flapGeometry, new THREE.MeshPhongMaterial({ 
        color: 0xf0f0f0,
        side: THREE.DoubleSide 
    }));
    flap.position.set(0, 0.25, 0.03);
    envelopeGroup.add(flap);
    
    envelopeGroup.visible = false;
    envelopeGroup.position.set(0, 2, 5);
    scene.add(envelopeGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x6366f1, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xe63946, 0.4);
    rimLight.position.set(5, 3, 0);
    scene.add(rimLight);

    // Floating particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 20;
        positions[i + 1] = (Math.random() - 0.5) * 10;
        positions[i + 2] = (Math.random() - 0.5) * 10 - 5;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0x6366f1,
        size: 0.05,
        transparent: true,
        opacity: 0.6
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Animation state
    let time = 0;
    let isAnimating = false;
    let animationPhase = 0;
    let animationProgress = 0;

    // Expose send animation function
    window.triggerMailAnimation = function() {
        if (isAnimating) return;
        isAnimating = true;
        animationPhase = 1;
        animationProgress = 0;
        envelopeGroup.visible = true;
        envelopeGroup.position.set(0, 1, 5);
        envelopeGroup.rotation.set(0, 0, 0);
        envelopeGroup.scale.set(1, 1, 1);
    };

    // Easing functions
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        // Gentle mailbox hover
        mailboxGroup.position.y = -1 + Math.sin(time * 0.5) * 0.1;
        mailboxGroup.rotation.y = -0.4 + Math.sin(time * 0.3) * 0.05;

        // Particle animation
        const posArray = particlesGeometry.attributes.position.array;
        for (let i = 0; i < particleCount * 3; i += 3) {
            posArray[i + 1] += 0.01;
            if (posArray[i + 1] > 5) posArray[i + 1] = -5;
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        // Mail send animation
        if (isAnimating) {
            animationProgress += 0.02;

            if (animationPhase === 1) {
                // Phase 1: Envelope flies toward mailbox
                const t = easeInOutCubic(Math.min(animationProgress, 1));
                
                envelopeGroup.position.x = THREE.MathUtils.lerp(0, 0, t);
                envelopeGroup.position.y = THREE.MathUtils.lerp(1, 0.3, t);
                envelopeGroup.position.z = THREE.MathUtils.lerp(5, -1.1, t);
                envelopeGroup.rotation.y = t * Math.PI * 0.5;
                envelopeGroup.rotation.z = Math.sin(t * Math.PI * 2) * 0.2;
                
                // Open lid as envelope approaches
                lidGroup.rotation.z = THREE.MathUtils.lerp(0, -Math.PI * 0.6, easeOutCubic(t));
                
                if (animationProgress >= 1) {
                    animationPhase = 2;
                    animationProgress = 0;
                }
            } else if (animationPhase === 2) {
                // Phase 2: Envelope goes into mailbox
                const t = easeInOutCubic(Math.min(animationProgress * 2, 1));
                
                envelopeGroup.position.x = THREE.MathUtils.lerp(0, -1, t);
                envelopeGroup.scale.setScalar(1 - t * 0.8);
                envelopeGroup.position.y = THREE.MathUtils.lerp(0.3, 0.5, t);
                
                if (animationProgress >= 0.5) {
                    animationPhase = 3;
                    animationProgress = 0;
                    envelopeGroup.visible = false;
                }
            } else if (animationPhase === 3) {
                // Phase 3: Close lid and raise flag
                const t = easeOutCubic(Math.min(animationProgress * 1.5, 1));
                
                lidGroup.rotation.z = THREE.MathUtils.lerp(-Math.PI * 0.6, 0, t);
                flagGroup.rotation.z = THREE.MathUtils.lerp(-Math.PI / 4, Math.PI / 6, t);
                
                // Mailbox celebrates with a little bounce
                mailboxGroup.position.y = -1 + Math.sin(animationProgress * Math.PI * 4) * 0.15 * (1 - t);
                
                if (animationProgress >= 1) {
                    animationPhase = 4;
                    animationProgress = 0;
                }
            } else if (animationPhase === 4) {
                // Phase 4: Reset flag after delay
                if (animationProgress > 1.5) {
                    const t = easeOutCubic(Math.min((animationProgress - 1.5) * 2, 1));
                    flagGroup.rotation.z = THREE.MathUtils.lerp(Math.PI / 6, -Math.PI / 4, t);
                    
                    if (animationProgress >= 2.5) {
                        isAnimating = false;
                        animationPhase = 0;
                    }
                }
            }
        }

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
