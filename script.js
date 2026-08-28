document.addEventListener('DOMContentLoaded', () => {
    // --- Anti-Copy / Anti-Screenshot Measures ---
    // Disable Right-Click
    document.addEventListener('contextmenu', event => event.preventDefault());
    
    document.addEventListener('keydown', (e) => {
        // Obscure screen if PrintScreen is pressed
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('Screenshots are disabled.');
            document.body.style.filter = 'blur(30px)';
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.filter = 'none';
                document.body.style.opacity = '1';
            }, 3000);
        }
        
        // Block Win+Shift+S (Snipping Tool) and Win+Shift+T (Text Extractor)
        // Note: Browsers cannot reliably intercept the "Meta/Win" key combo if the OS claims it first,
        // but we can try to obscure the screen immediately if we detect Shift + S or T while Meta is pressed.
        if (e.metaKey && e.shiftKey && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 't')) {
            document.body.style.filter = 'blur(30px) grayscale(100%)';
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.filter = 'none';
                document.body.style.opacity = '1';
            }, 3000);
        }

        // Block Ctrl+C, Ctrl+S, Ctrl+P, Ctrl+U, F12
        if ((e.ctrlKey && ['s', 'p', 'c', 'u'].includes(e.key.toLowerCase())) || e.key === 'F12') {
            e.preventDefault();
        }
    });

    // Blur screen heavily when window loses focus (blocks Snipping Tool and background screen recorders)
    window.addEventListener('blur', () => {
        document.body.style.filter = 'blur(30px) grayscale(100%)';
        document.body.style.opacity = '0.05';
    });

    window.addEventListener('focus', () => {
        document.body.style.filter = 'none';
        document.body.style.opacity = '1';
    });
    // --------------------------------------------

    const readerContent = document.getElementById('reader-content');
    const tocList = document.getElementById('toc-list');
    const progressBar = document.getElementById('reading-progress');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    
    // --- Spotlight Feature (Multi-Shape) ---
    const spotlightToggleBtn = document.getElementById('spotlight-toggle');
    const spotlightModes = ['', 'spotlight-circle', 'spotlight-ellipse', 'spotlight-slit'];
    let currentModeIdx = 0;

    if (spotlightToggleBtn) {
        spotlightToggleBtn.addEventListener('click', () => {
            // Remove old mode
            if (spotlightModes[currentModeIdx]) {
                document.body.classList.remove(spotlightModes[currentModeIdx]);
            }
            
            // Next mode
            currentModeIdx = (currentModeIdx + 1) % spotlightModes.length;
            
            // Apply new mode
            if (spotlightModes[currentModeIdx]) {
                document.body.classList.add(spotlightModes[currentModeIdx]);
            }
            
            // Update button label
            switch(currentModeIdx) {
                case 0:
                    spotlightToggleBtn.innerHTML = '<span class="icon">👁️</span> Cursed Spotlight';
                    break;
                case 1:
                    spotlightToggleBtn.innerHTML = '<span class="icon">🔦</span> Shape: Torch';
                    break;
                case 2:
                    spotlightToggleBtn.innerHTML = '<span class="icon">🧿</span> Shape: The Eye';
                    break;
                case 3:
                    spotlightToggleBtn.innerHTML = '<span class="icon">🗡️</span> Shape: Blade Slit';
                    break;
            }
        });
    }

    function updateSpotlightPos(e) {
        if (currentModeIdx !== 0) {
            let clientX = e.clientX;
            let clientY = e.clientY;
            // Handle touch events
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            document.documentElement.style.setProperty('--cursor-x', `${clientX}px`);
            document.documentElement.style.setProperty('--cursor-y', `${clientY}px`);
        }
    }
    document.addEventListener('mousemove', updateSpotlightPos);
    document.addEventListener('touchmove', updateSpotlightPos, { passive: true });
    // -------------------------
    
    // --- Mobile Sidebar Toggle ---
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (mobileMenuBtn && sidebarOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
        });
        
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }
    // -------------------------
    
    // --- Premium Chapter Locking Logic ---
    let fullStoryText = "";
    
    function renderStory(text) {
        const isUnlocked = localStorage.getItem('premium_unlocked') === 'true';
        
        // Remove the first few lines if they are just the title (handled by hero section)
        const lines = text.split('\n');
        let contentStart = 0;
        for(let i=0; i<lines.length; i++) {
            if(lines[i].includes('## Adhyay 1')) {
                contentStart = i;
                break;
            }
        }
        
        let contentToParse = lines.slice(contentStart).join('\n');
        let lockedUIHtml = '';
        
        if (!isUnlocked) {
            // Split by chapters to find chapter 4
            const chapterSplit = contentToParse.split('\n## Adhyay ');
            if (chapterSplit.length > 3) {
                // Keep only Chapter 1, 2, 3 (index 0 is everything before Adhyay 2, index 1 is Adhyay 2, index 2 is Adhyay 3)
                // Wait, chapterSplit[0] will be '## Adhyay 1...' 
                // Let's refine the split.
                
                // Keep up to Adhyay 3
                let allowedContent = [chapterSplit[0]];
                if (chapterSplit[1]) allowedContent.push('## Adhyay ' + chapterSplit[1]);
                if (chapterSplit[2]) allowedContent.push('## Adhyay ' + chapterSplit[2]);
                
                contentToParse = allowedContent.join('\n');
                
                lockedUIHtml = `
                    <div class="lock-container" id="lock-ui">
                        <div class="lock-icon">🔒</div>
                        <h2>Premium Chapters Locked</h2>
                        <p>The dark tragedy of Dhriv continues in Chapters 4, 5, 6, and 7. Enter your single-use 4-digit code to permanently unlock the rest of the story on this device.</p>
                        <div class="unlock-form">
                            <input type="text" id="unlock-code" maxlength="4" placeholder="0000" pattern="\\d{4}">
                            <button id="unlock-btn" class="glass-btn" style="margin-left: 10px;">Unlock Story</button>
                        </div>
                        <p id="unlock-error" style="color: #ff3366; margin-top: 1rem; display: none;"></p>
                        
                        <div class="payment-section" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                            <h3>Don't have a code?</h3>
                            <p style="font-size: 0.95rem; margin-bottom: 1.5rem; color: var(--text-muted);">Support the author to get one. Minimum ₹2.</p>
                            
                            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 1.5rem;">
                                <input type="range" id="price-slider" min="2" max="1000" value="10" style="flex: 1; max-width: 250px; cursor: pointer;">
                                <div style="background: rgba(0,0,0,0.6); padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,51,102,0.3);">
                                    ₹<input type="number" id="price-input" value="10" min="2" style="background: transparent; border: none; color: white; width: 60px; font-family: 'Outfit'; font-size: 1.2rem; text-align: center; outline: none;">
                                </div>
                            </div>
                            
                            <div id="qr-container" style="display: flex; flex-direction: column; align-items: center;">
                                <img id="upi-qr" src="" alt="UPI QR" style="width: 180px; height: 180px; border-radius: 10px; border: 2px solid var(--accent-primary); margin-bottom: 1rem; background: white; padding: 5px;">
                                <a id="upi-link" href="#" class="glass-btn" style="text-decoration: none; font-size: 0.9rem; padding: 0.5rem 1rem;">Pay via UPI App</a>
                            </div>
                            <p style="font-size: 0.85rem; color: #888; margin-top: 1.5rem;">After payment, send a screenshot to the author to receive your unlock code.</p>
                        </div>
                    </div>
                `;
            }
        }
        
        // Parse Markdown
        readerContent.innerHTML = marked.parse(contentToParse) + lockedUIHtml;
        
        // Apply Story Text Effects MUST be called before attaching event listeners
        // because it overwrites innerHTML and destroys existing DOM nodes.
        applyStoryEffects();
        
        if (!isUnlocked && lockedUIHtml !== '') {
            const unlockBtn = document.getElementById('unlock-btn');
            const unlockInput = document.getElementById('unlock-code');
            const errorEl = document.getElementById('unlock-error');

            const processUnlock = async () => {
                const code = unlockInput.value;
                if (code.length !== 4) {
                    errorEl.innerText = "Please enter a 4-digit code.";
                    errorEl.style.display = 'block';
                    return;
                }
                
                unlockInput.disabled = true;
                unlockBtn.disabled = true;
                unlockBtn.innerText = "Unlocking...";
                
                try {
                    const res = await fetch('/api/unlock', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code })
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        localStorage.setItem('premium_unlocked', 'true');
                        localStorage.setItem('unlocked_code', code);
                        renderStory(fullStoryText);
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    } else {
                        errorEl.innerText = data.message;
                        errorEl.style.display = 'block';
                        unlockInput.disabled = false;
                        unlockBtn.disabled = false;
                        unlockBtn.innerText = "Unlock Story";
                        unlockInput.value = "";
                        unlockInput.focus();
                    }
                } catch (err) {
                    errorEl.innerText = "Failed to connect to server. Ensure the backend is running.";
                    errorEl.style.display = 'block';
                    unlockInput.disabled = false;
                    unlockBtn.disabled = false;
                    unlockBtn.innerText = "Unlock Story";
                }
            };

            unlockBtn.addEventListener('click', processUnlock);
            unlockInput.addEventListener('input', () => {
                if (unlockInput.value.length === 4) {
                    processUnlock();
                }
            });

            // Payment Logic
            const priceSlider = document.getElementById('price-slider');
            const priceInput = document.getElementById('price-input');
            const upiQr = document.getElementById('upi-qr');
            const upiLink = document.getElementById('upi-link');
            const upiId = 'aditya03singhrajput@ibl';
            
            const updatePayment = (amount) => {
                let parsedAmount = parseInt(amount);
                if (isNaN(parsedAmount) || parsedAmount < 2) {
                    parsedAmount = 2; // minimum
                }
                
                // Keep slider in sync (slider max is 1000)
                if (parsedAmount <= 1000) {
                    priceSlider.value = parsedAmount;
                } else {
                    priceSlider.value = 1000;
                }
                
                if (priceInput.value != parsedAmount) {
                    priceInput.value = parsedAmount;
                }
                
                const upiUrl = `upi://pay?pa=${upiId}&pn=Aditya&am=${parsedAmount}&cu=INR`;
                upiLink.href = upiUrl;
                // Generate QR using free api
                upiQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
            };
            
            if (priceSlider && priceInput) {
                priceSlider.addEventListener('input', (e) => updatePayment(e.target.value));
                priceInput.addEventListener('input', (e) => updatePayment(e.target.value));
                
                // Initial call to set up the default state
                updatePayment(10);
            }
        }
        
        // Build Table of Contents
        buildTOC();
        
        // Initialize Focus Mode
        initFocusMode();
        
        // Add subtle entrance animations to paragraphs
        const paragraphs = readerContent.querySelectorAll('p');
        paragraphs.forEach((p, index) => {
            p.style.opacity = '0';
            p.style.transform = 'translateY(20px)';
            p.style.transition = `all 0.5s ease ${index * 0.05}s`;
            
            // Trigger reflow
            void p.offsetWidth;
            
            p.style.opacity = '';
            p.style.transform = '';
        });
    }
    
    // Load Markdown Content
    fetch('dhriv.md')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(async text => {
            fullStoryText = text;
            
            const isUnlocked = localStorage.getItem('premium_unlocked') === 'true';
            const code = localStorage.getItem('unlocked_code');
            
            if (isUnlocked) {
                if (!code) {
                    // No code found, automatically lock them out again.
                    localStorage.removeItem('premium_unlocked');
                    localStorage.removeItem('unlocked_code');
                } else {
                    try {
                        const res = await fetch('/api/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code })
                        });
                        const data = await res.json();
                        
                        if (data.revoked) {
                            localStorage.removeItem('premium_unlocked');
                            localStorage.removeItem('unlocked_code');
                        }
                    } catch (e) {
                        // Ignore network errors, allow read offline if already unlocked
                    }
                }
            }
            
            renderStory(text);
        })
        .catch(error => {
            console.error('Error loading story:', error);
            readerContent.innerHTML = '<p style="color: red; text-align: center;">Failed to load the story. Please ensure server is running.</p>';
        });

    // Build Table of Contents
    function buildTOC() {
        const headings = readerContent.querySelectorAll('h2');
        
        headings.forEach((heading, index) => {
            // Assign ID to heading
            const id = `chapter-${index + 1}`;
            heading.id = id;
            
            // Create TOC item
            const li = document.createElement('li');
            const a = document.createElement('a');
            
            a.href = `#${id}`;
            // Extract the chapter name without the "Adhyay X — " part if desired, 
            // or keep it as is. We'll keep it as is.
            a.textContent = heading.textContent;
            
            // Smooth scroll click event
            a.addEventListener('click', (e) => {
                e.preventDefault();
                heading.scrollIntoView({ behavior: 'smooth' });
                
                // Close sidebar on mobile
                if(window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                }
            });
            
            li.appendChild(a);
            tocList.appendChild(li);
        });
        
        // Highlight active chapter on scroll
        window.addEventListener('scroll', highlightTOC);
    }
    
    // Highlight TOC based on scroll position
    function highlightTOC() {
        const headings = readerContent.querySelectorAll('h2');
        let currentActive = null;
        
        headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            // If heading is near the top
            if (rect.top <= 100) {
                currentActive = heading.id;
            }
        });
        
        const tocLinks = tocList.querySelectorAll('a');
        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (currentActive && link.getAttribute('href') === `#${currentActive}`) {
                link.classList.add('active');
            }
        });
    }

    // Apply Story Effects (Highlighting keywords)
    function applyStoryEffects() {
        let html = readerContent.innerHTML;
        
        const effects = [
            { regex: /\b(shraap|madira|sharab|nasha|nashe)\b/gi, className: 'word-curse' },
            { regex: /\b(khauff|darr|bhayanak)\b/gi, className: 'word-fear' },
            { regex: /\b(maut|mar gayi|dehant|mar dala|mritak|mrit)\b/gi, className: 'word-death' },
            { regex: /\b(kasam|vachan)\b/gi, className: 'word-heavy' }
        ];

        effects.forEach(effect => {
            html = html.replace(effect.regex, match => `<span class="${effect.className}">${match}</span>`);
        });

        readerContent.innerHTML = html;
    }

    // Focus Mode Observer
    function initFocusMode() {
        readerContent.classList.add('focus-mode-active');
        
        const paragraphs = readerContent.querySelectorAll('p');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-focus');
                } else {
                    entry.target.classList.remove('in-focus');
                }
            });
        }, {
            root: null,
            rootMargin: '-30% 0px -30% 0px',
            threshold: 0
        });

        paragraphs.forEach(p => observer.observe(p));
    }

    // Reading Progress Bar
    window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollTop = window.scrollY;
        const progress = (scrollTop / documentHeight) * 100;
        progressBar.style.width = `${progress}%`;
    });

    // Theme Toggle
    // Check local storage for theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector('.icon');
        if (theme === 'light') {
            icon.textContent = '☀️';
        } else {
            icon.textContent = '🌙';
        }
    }

    // Mobile Sidebar Toggle
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 && 
            !sidebar.contains(e.target) && 
            e.target !== mobileMenuBtn) {
            sidebar.classList.remove('open');
        }
    });

    // --- Map Modal Logic ---
    const mapBtn = document.getElementById('map-btn');
    const mapModal = document.getElementById('map-modal');
    const mapClose = document.getElementById('map-close');
    const nodes = document.querySelectorAll('.map-node');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');

    const mapLore = {
        'node-village': {
            title: 'The Unnamed Village',
            desc: 'Dhriv\'s home, where Kripaldev\'s legacy stood tall before the curse shattered it. A quiet place where mountains cast their shadows by dusk.'
        },
        'node-peepal': {
            title: 'Peepal Kalari',
            desc: 'A dark, cursed gambling den ruled by the myth of Kalahpriya (Raja Kali). This is where Dhriv tasted his first drop of poison.'
        },
        'node-kripal-ghati': {
            title: 'Kripal Ghati',
            desc: 'A freezing, towering mountain valley named by Raadhna in devotion to Kripaldev. It is a place of deep spiritual silence and ultimate tragedy.'
        },
        'node-sarvya': {
            title: 'Sarvya Ghati',
            desc: 'A distant trade valley where Kripaldev first met Raadhna, setting into motion a chain of events that would doom his bloodline.'
        }
    };

    mapBtn.addEventListener('click', () => {
        mapModal.classList.add('open');
    });

    mapClose.addEventListener('click', () => {
        mapModal.classList.remove('open');
    });

    nodes.forEach(node => {
        node.addEventListener('click', () => {
            const id = node.id;
            if (mapLore[id]) {
                infoTitle.style.opacity = '0';
                infoDesc.style.opacity = '0';
                
                setTimeout(() => {
                    infoTitle.textContent = mapLore[id].title;
                    infoDesc.textContent = mapLore[id].desc;
                    infoTitle.style.opacity = '1';
                    infoDesc.style.opacity = '1';
                }, 200);
            }
        });
    });

    // --- 3D Rotating Stone (Three.js) ---
    function initThreeJSStone() {
        const container = document.getElementById('stone-canvas-container');
        if (!container || typeof THREE === 'undefined') return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        function updateCanvasSize() {
            const width = container.clientWidth;
            const height = container.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
        updateCanvasSize();
        
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        window.addEventListener('resize', updateCanvasSize);

        // Stone Geometry (Icosahedron with detail 1 creates a nice jagged rock)
        let geometry = new THREE.IcosahedronGeometry(1.5, 1);
        if (geometry.index) {
            geometry = geometry.toNonIndexed(); // Convert to non-indexed for shattering
        }
        
        // Randomize vertices slightly to make it look like a natural, cursed stone
        const positionAttribute = geometry.attributes.position;
        const originalPositions = new Float32Array(positionAttribute.count * 3);
        const explosionDirections = new Float32Array(positionAttribute.count * 3);

        for (let i = 0; i < positionAttribute.count; i += 3) {
            const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
            const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 1);
            const v3 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 2);
            
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            v1.add(offset); v2.add(offset); v3.add(offset);
            
            positionAttribute.setXYZ(i, v1.x, v1.y, v1.z);
            positionAttribute.setXYZ(i+1, v2.x, v2.y, v2.z);
            positionAttribute.setXYZ(i+2, v3.x, v3.y, v3.z);

            originalPositions[i*3] = v1.x; originalPositions[i*3+1] = v1.y; originalPositions[i*3+2] = v1.z;
            originalPositions[(i+1)*3] = v2.x; originalPositions[(i+1)*3+1] = v2.y; originalPositions[(i+1)*3+2] = v2.z;
            originalPositions[(i+2)*3] = v3.x; originalPositions[(i+2)*3+1] = v3.y; originalPositions[(i+2)*3+2] = v3.z;

            // Calculate explosion direction (centroid + randomness)
            const centroid = new THREE.Vector3().addVectors(v1, v2).add(v3).divideScalar(3);
            const dir = centroid.normalize().multiplyScalar(Math.random() * 2 + 1.5);
            // Add scatter
            dir.x += (Math.random() - 0.5) * 1.5;
            dir.y += (Math.random() - 0.5) * 1.5;
            dir.z += (Math.random() - 0.5) * 1.5;

            explosionDirections[i*3] = dir.x; explosionDirections[i*3+1] = dir.y; explosionDirections[i*3+2] = dir.z;
            explosionDirections[(i+1)*3] = dir.x; explosionDirections[(i+1)*3+1] = dir.y; explosionDirections[(i+1)*3+2] = dir.z;
            explosionDirections[(i+2)*3] = dir.x; explosionDirections[(i+2)*3+1] = dir.y; explosionDirections[(i+2)*3+2] = dir.z;
        }
        geometry.computeVertexNormals();

        // Stone Material
        const material = new THREE.MeshStandardMaterial({
            color: 0x232528,       // Dark slate
            roughness: 0.9,
            metalness: 0.2,
            flatShading: true,
            side: THREE.DoubleSide // Ensure shards are visible from both sides when exploded
        });

        // Inner Ember Wireframe (for the cursed look)
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5722,       // Cave fire orange
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        const stone = new THREE.Mesh(geometry, material);
        const emberLines = new THREE.Mesh(geometry, wireframeMaterial);
        
        emberLines.scale.set(1.02, 1.02, 1.02);
        
        const stoneGroup = new THREE.Group();
        stoneGroup.add(stone);
        stoneGroup.add(emberLines);
        scene.add(stoneGroup);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0xff9800, 2, 10);
        pointLight1.position.set(3, 2, 2);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff5722, 1.5, 10);
        pointLight2.position.set(-2, -3, 3);
        scene.add(pointLight2);

        // Interaction (Hover & Mouse tracking)
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        let isHovered = false;
        let hoverProgress = 0;

        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX) * 0.001;
            mouseY = (event.clientY - windowHalfY) * 0.001;
        });

        renderer.domElement.addEventListener('mouseenter', () => { isHovered = true; });
        renderer.domElement.addEventListener('mouseleave', () => { isHovered = false; });

        // Animation Loop
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Hover shatter logic
            const targetHover = isHovered ? 1 : 0;
            hoverProgress += (targetHover - hoverProgress) * 0.08; // Smooth lerp

            if (hoverProgress > 0.001 || isHovered) {
                const positions = geometry.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                    const ox = originalPositions[i*3];
                    const oy = originalPositions[i*3+1];
                    const oz = originalPositions[i*3+2];
                    
                    const dx = explosionDirections[i*3];
                    const dy = explosionDirections[i*3+1];
                    const dz = explosionDirections[i*3+2];
                    
                    // Add some magical swirling noise to the explosion based on time
                    const noise = Math.sin(time * 3 + i) * 0.1 * hoverProgress;
                    
                    positions.setXYZ(i, 
                        ox + (dx + noise) * hoverProgress, 
                        oy + (dy + noise) * hoverProgress, 
                        oz + (dz + noise) * hoverProgress
                    );
                }
                positions.needsUpdate = true;
            }

            // Self-rotation
            stoneGroup.rotation.y += 0.003;
            stoneGroup.rotation.x += 0.001;

            // Float up and down slightly
            stoneGroup.position.y = Math.sin(time * 1.5) * 0.1;

            // Interactive rotation target based on mouse
            targetX = mouseX * 0.5;
            targetY = mouseY * 0.5;
            
            stoneGroup.rotation.y += 0.05 * (targetX - stoneGroup.rotation.y);
            stoneGroup.rotation.x += 0.05 * (targetY - stoneGroup.rotation.x);

            renderer.render(scene, camera);
        }
        animate();
    }

    // Call initialization after everything is loaded
    initThreeJSStone();
});
