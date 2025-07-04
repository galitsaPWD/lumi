// Lumi Photobooth JavaScript
class Lumi {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.photos = [];
        this.isCapturing = false;
        this.isAutoMode = false;
        this.autoInterval = null;
        this.currentPhotoIndex = 0;
        this.maxPhotos = 4;
        this.currentLayout = '4pics'; // '4pics', '3pics', '2up2down', 'polaroid'
        this.currentFilter = 'none';
        this.filters = {
            none: { name: 'None', icon: 'fas fa-times' },
            warm: { name: 'Warm', icon: 'fas fa-sun' },
            vivid: { name: 'Vivid', icon: 'fas fa-star' },
            pastel: { name: 'Pastel', icon: 'fas fa-palette' },
            invert: { name: 'Negative', icon: 'fas fa-adjust' },
            bw: { name: 'Black & White', icon: 'fas fa-circle' }
        };
        
        this.backgroundColors = [
            { name: 'Default', color: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
            { name: 'Sunset', color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)' },
            { name: 'Ocean', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { name: 'Forest', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { name: 'Rose', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { name: 'Lavender', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
            { name: 'Blue', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            { name: 'Green', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
            { name: 'Orange', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
            { name: 'Pink', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }
        ];
        
        this.currentBgIndex = 0;
        this.flashEnabled = false;
        this.soundEnabled = true;
        
        this.elements = {
            video: document.getElementById('video'),
            canvas: document.createElement('canvas'),
            captureBtn: document.getElementById('captureBtn'),
            autoBtn: document.getElementById('autoBtn'),
            filterBtn: document.getElementById('filterBtn'),
            countdown: document.getElementById('countdown'),
            statusIndicator: document.getElementById('statusIndicator'),
            progressFill: document.getElementById('progressFill'),
            photoStrip: document.getElementById('photoStrip'),
            particlesBg: document.getElementById('particlesBg'),
            bgColorBtn: document.getElementById('bgColorBtn'),
            flashBtn: document.getElementById('flashBtn'),
            flashEffect: document.getElementById('flashEffect'),
            shutterSound: document.getElementById('shutterSound'),
            successSound: document.getElementById('successSound'),
            soundBtn: document.getElementById('soundBtn')
        };
        
        this.thumbnailsContainer = document.querySelector('.thumbnails');
        
        this.init();
    }

    init() {
        this.createParticles();
        this.renderThumbnails();
        this.bindEvents();
        this.updateStatus('Ready to capture memories ✨');
        this.updateProgress(0);
    }
    
    createParticles() {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 4 + 2;
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const delay = Math.random() * 6;
            
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                animation-delay: ${delay}s;
                animation-duration: ${6 + Math.random() * 4}s;
            `;
            
            this.elements.particlesBg.appendChild(particle);
        }
    }
    
    renderThumbnails() {
        if (!this.thumbnailsContainer) return;
        this.thumbnailsContainer.innerHTML = '';
        for (let i = 0; i < this.maxPhotos; i++) {
            const thumb = document.createElement('div');
            thumb.className = 'thumbnail';
            thumb.dataset.index = i;
            thumb.innerHTML = `<span class="thumb-number">${i + 1}</span>`;
            this.thumbnailsContainer.appendChild(thumb);
        }
    }
    
    bindEvents() {
        this.elements.captureBtn.addEventListener('click', () => this.capturePhoto());
        
        // Add auto button functionality
        const autoBtn = document.getElementById('autoBtn');
        if (autoBtn) {
            autoBtn.addEventListener('click', () => this.toggleAutoMode());
        }
        
        // Add background color button functionality
        const bgColorBtn = document.getElementById('bgColorBtn');
        if (bgColorBtn) {
            console.log('Background color button found:', bgColorBtn);
            bgColorBtn.addEventListener('click', () => {
                console.log('Background color button clicked!');
                this.changeBackgroundColor();
            });
        } else {
            console.error('Background color button not found!');
        }
        
        // Add filter button functionality with debugging
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            console.log('Filter button found:', filterBtn);
            filterBtn.addEventListener('click', (e) => {
                console.log('Filter button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.toggleFilters();
            });
            
            // Also add mousedown and touchstart for better compatibility
            filterBtn.addEventListener('mousedown', (e) => {
                console.log('Filter button mousedown!');
                e.preventDefault();
                e.stopPropagation();
            });
            
            filterBtn.addEventListener('touchstart', (e) => {
                console.log('Filter button touchstart!');
                e.preventDefault();
                e.stopPropagation();
                this.toggleFilters();
            });
        } else {
            console.error('Filter button not found!');
        }
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.elements.captureBtn.disabled) {
                e.preventDefault();
                this.capturePhoto();
            }
        });
        
        // Add camera frame click to start
        document.querySelector('.camera-frame').addEventListener('click', () => {
            if (!this.stream) {
                this.startCamera();
            } else if (this.currentPhotoIndex >= this.maxPhotos) {
                this.createPhotoStrip();
            }
        });
        
        // Background color button
        this.elements.bgColorBtn.addEventListener('click', () => {
            this.changeBackgroundColor();
        });
        
        // Flash button
        this.elements.flashBtn.addEventListener('click', () => {
            this.toggleFlash();
        });
        
        // Sound button
        this.elements.soundBtn.addEventListener('click', () => {
            this.toggleSound();
            this.updateSoundButtonIcon();
        });
        
        // Immersive layout modal logic
        const openLayoutModalBtn = document.getElementById('openLayoutModalBtn');
        const layoutModal = document.getElementById('layoutModal');
        const layoutModalBackdrop = layoutModal ? layoutModal.querySelector('.layout-modal-backdrop') : null;
        const layoutModalClose = layoutModal ? layoutModal.querySelector('.layout-modal-close') : null;
        const layoutOptions = layoutModal ? layoutModal.querySelectorAll('.layout-option') : [];

        // Helper to highlight selected layout
        const highlightSelectedLayout = () => {
            layoutOptions.forEach(opt => {
                if (opt.dataset.layout === this.currentLayout) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        };

        if (openLayoutModalBtn && layoutModal) {
            openLayoutModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                layoutModal.style.display = 'flex';
                highlightSelectedLayout();
            });
        }
        if (layoutModalBackdrop) {
            layoutModalBackdrop.addEventListener('click', () => {
                layoutModal.style.display = 'none';
            });
        }
        if (layoutModalClose) {
            layoutModalClose.addEventListener('click', () => {
                layoutModal.style.display = 'none';
            });
        }
        layoutOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const selected = opt.dataset.layout;
                if (selected && selected !== this.currentLayout) {
                    this.currentLayout = selected;
                    if (selected === '4pics') this.maxPhotos = 4;
                    else if (selected === '3pics') this.maxPhotos = 3;
                    else if (selected === '2up2down') this.maxPhotos = 4;
                    else if (selected === 'polaroid') this.maxPhotos = 1;
                    layoutModal.style.display = 'none';
                    this.resetPhotobooth();
                    if (this.isAutoMode && this.stream) {
                        this.startAutoCapture();
                    }
                } else {
                    layoutModal.style.display = 'none';
                }
            });
        });
    }
    
    async startCamera() {
        try {
            this.updateStatus('Connecting to camera...');
            
            // Check if camera status element exists
            const cameraStatus = document.getElementById('cameraStatus');
            if (cameraStatus) {
                cameraStatus.style.display = 'flex';
            }
            
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }
            
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            };
            
            console.log('Requesting camera permissions...');
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera permission granted!');
            
            this.video.srcObject = this.stream;
            
            this.video.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded');
                this.video.play();
                this.video.style.display = 'block';
                
                if (cameraStatus) {
                    cameraStatus.style.display = 'none';
                }
                
                // Hide the camera placeholder after successful connection
                const cameraPlaceholder = document.querySelector('.camera-placeholder');
                if (cameraPlaceholder) {
                    cameraPlaceholder.style.display = 'none';
                }
                
                this.elements.captureBtn.disabled = false;
                
                // Enable auto button when camera is ready
                const autoBtn = document.getElementById('autoBtn');
                if (autoBtn) {
                    autoBtn.disabled = false;
                }
                
                // Check if auto mode is enabled and start auto capture
                if (this.isAutoMode) {
                    this.updateStatus('Camera ready! Auto mode active - Photos will be taken automatically!');
                    this.startAutoCapture();
                } else {
                    this.updateStatus('Camera ready! Press space or click to capture 📸');
                }
                
                // Add camera focus effect
                this.addCameraFocusEffect();
                
                // Apply video filter if one is selected
                if (this.currentFilter !== 'none') {
                    this.applyVideoFilter();
                }
            });
            
        } catch (error) {
            console.error('Camera error:', error);
            this.handleCameraError(error);
        }
    }
    
    handleCameraError(error) {
        console.error('Camera error details:', error.name, error.message);
        
        const cameraStatus = document.getElementById('cameraStatus');
        if (cameraStatus) {
            cameraStatus.style.display = 'none';
        }
        
        // Disable both capture and auto buttons on camera error
        this.elements.captureBtn.disabled = true;
        const autoBtn = document.getElementById('autoBtn');
        if (autoBtn) {
            autoBtn.disabled = true;
        }
        
        let message = 'Camera error occurred';
        if (error.name === 'NotAllowedError') {
            message = 'Camera access denied. Please allow camera permissions and refresh the page.';
        } else if (error.name === 'NotFoundError') {
            message = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotSupportedError') {
            message = 'Camera not supported in this browser. Please try Chrome, Firefox, or Safari.';
        } else if (error.name === 'NotReadableError') {
            message = 'Camera is in use by another application. Please close other camera apps.';
        } else if (error.name === 'OverconstrainedError') {
            message = 'Camera constraints not met. Trying with default settings...';
            // Try again with simpler constraints
            this.retryWithSimpleConstraints();
            return;
        } else if (error.message.includes('Camera API not supported')) {
            message = 'Camera API not supported. Please use a modern browser.';
        }
        
        this.updateStatus('Camera error - ' + message);
        
        // Show camera placeholder again
        const cameraPlaceholder = document.querySelector('.camera-placeholder');
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'flex';
        }
    }
    
    async retryWithSimpleConstraints() {
        try {
            console.log('Retrying with simple camera constraints...');
            const simpleConstraints = {
                video: true
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
            this.video.srcObject = this.stream;
            
            this.video.addEventListener('loadedmetadata', () => {
                this.video.play();
                this.video.style.display = 'block';
                
                const cameraStatus = document.getElementById('cameraStatus');
                if (cameraStatus) {
                    cameraStatus.style.display = 'none';
                }
                
                const cameraPlaceholder = document.querySelector('.camera-placeholder');
                if (cameraPlaceholder) {
                    cameraPlaceholder.style.display = 'none';
                }
                
                this.elements.captureBtn.disabled = false;
                this.updateStatus('Camera ready! Press space or click to capture 📸');
            });
            
        } catch (retryError) {
            console.error('Retry failed:', retryError);
            this.handleCameraError(retryError);
        }
    }
    
    addCameraFocusEffect() {
        const focusFrame = document.querySelector('.focus-frame');
        focusFrame.style.animation = 'focus 2s ease-in-out infinite';
        
        // Add subtle camera movement effect
        let moveX = 0;
        let moveY = 0;
        
        setInterval(() => {
            moveX = (Math.random() - 0.5) * 4;
            moveY = (Math.random() - 0.5) * 4;
            focusFrame.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) scale(1.05)`;
        }, 2000);
    }
    
    async capturePhoto() {
        if (this.isCapturing || this.currentPhotoIndex >= this.maxPhotos) return;
        
        this.isCapturing = true;
        this.elements.captureBtn.disabled = true;
        
        // Start countdown
        await this.startCountdown();
        
        // Trigger flash if enabled
        if (this.flashEnabled) {
            this.triggerFlash();
        }
        
        // Play shutter sound
        this.playShutterSound();
        
        // Capture photo
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Flip the canvas horizontally to correct the mirror effect
        this.ctx.scale(-1, 1);
        this.ctx.translate(-this.canvas.width, 0);
        this.ctx.drawImage(this.video, 0, 0);
        
        // Reset the transform
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Apply selected filter to the captured photo
        let photoData;
        if (this.currentFilter !== 'none') {
            console.log('Applying filter:', this.currentFilter); // Debug log
            
            // Use the canvas filter method directly for better reliability
            photoData = this.captureWithCanvasFilter();
            console.log('Canvas filter applied successfully'); // Debug log
        } else {
            // For no filter, use the main canvas with mirror correction
            photoData = this.canvas.toDataURL('image/jpeg', 0.9);
            console.log('No filter applied'); // Debug log
        }
        
        // Add to photos array
        this.photos.push(photoData);
        
        // Update thumbnail
        this.updateThumbnail(this.currentPhotoIndex, photoData);
        
        // Flash effect
        this.triggerFlash();
        
        // Update status with current photo number (before incrementing)
        this.updateStatus(`Photo ${this.currentPhotoIndex + 1} of ${this.maxPhotos} captured!`);
        
        // Update progress
        this.currentPhotoIndex++;
        this.updateProgress((this.currentPhotoIndex / this.maxPhotos) * 100);
        
        // Check if strip is complete
        if (this.currentPhotoIndex >= this.maxPhotos) {
            this.updateStatus('Photo strip complete! Creating your memories...');
            
            // Play success sound
            this.playSuccessSound();
            
            // Auto-create photo strip after a short delay
            setTimeout(() => {
                this.createPhotoStrip();
            }, 1500);
        }
        
        this.isCapturing = false;
        this.elements.captureBtn.disabled = false;
    }
    
    async startCountdown() {
        const countdownElement = this.elements.countdown;
        countdownElement.style.display = 'block';
        
        for (let i = 3; i > 0; i--) {
            countdownElement.textContent = i;
            countdownElement.style.animation = 'none';
            countdownElement.offsetHeight; // Trigger reflow
            countdownElement.style.animation = 'countdownPop 0.5s ease-out';
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        countdownElement.textContent = 'SMILE!';
        countdownElement.style.animation = 'countdownPop 0.5s ease-out';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        countdownElement.style.display = 'none';
    }
    
    triggerFlash() {
        const flash = this.elements.flashEffect;
        console.log('Flash triggered! Flash element:', flash); // Debug log
        
        if (!flash) {
            console.error('Flash effect element not found!');
            return;
        }
        
        console.log('Flash opacity before:', flash.style.opacity); // Debug log
        flash.style.opacity = '1'; // Full brightness
        console.log('Flash opacity after:', flash.style.opacity); // Debug log
        
        setTimeout(() => {
            flash.style.opacity = '0';
            console.log('Flash opacity reset to 0'); // Debug log
        }, 300); // Increased duration for better visibility
    }
    
    updateThumbnail(index, photoData) {
        const thumbnail = document.querySelector(`[data-index="${index}"]`);
        
        // Create image element
        const img = document.createElement('img');
        img.src = photoData;
        img.alt = `Photo ${index + 1}`;
        
        // Create X button for retaking photo
        const xButton = document.createElement('button');
        xButton.className = 'thumb-x';
        xButton.title = 'Retake photo';
        xButton.innerHTML = '&times;';
        xButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.retakePhoto(index);
        });
        
        // Clear thumbnail content and add image and X button
        thumbnail.innerHTML = '';
        thumbnail.appendChild(img);
        thumbnail.appendChild(xButton);
        thumbnail.classList.add('filled');
        
        // Add click functionality to thumbnail
        thumbnail.addEventListener('click', () => {
            this.showPhotoModal(photoData, index + 1);
        });
        
        // Add hover effect
        img.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.15)';
        });
        
        img.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
        });
    }
    
    showPhotoModal(photoData, photoNumber) {
        const modal = document.getElementById('photoModal');
        const modalImg = document.getElementById('photoModalImg');
        
        modalImg.src = photoData;
        modalImg.alt = `Photo ${photoNumber}`;
        modal.style.display = 'flex';
        
        // Add close functionality
        const closeBtn = modal.querySelector('.photo-modal-close');
        const backdrop = modal.querySelector('.photo-modal-backdrop');
        
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        closeBtn.onclick = closeModal;
        backdrop.onclick = closeModal;
    }
    
    retakePhoto(index) {
        // Remove the photo from the array
        this.photos.splice(index, 1);
        
        // Reset the current photo index to the removed photo's position
        this.currentPhotoIndex = index;
        
        // Update progress
        this.updateProgress((this.currentPhotoIndex / this.maxPhotos) * 100);
        
        // Reset the thumbnail to empty state
        const thumbnail = document.querySelector(`[data-index="${index}"]`);
        thumbnail.innerHTML = `
            <span class="thumb-number">${index + 1}</span>
        `;
        thumbnail.classList.remove('filled');
        
        // Update status
        this.updateStatus(`Photo ${index + 1} removed. Ready to retake! 📸`);
        
        // Re-enable capture button if it was disabled
        this.elements.captureBtn.disabled = false;
    }
    
    createPhotoStrip() {
        if (this.photos.length === 0) return;
        this.updateStatus('Creating your film strip... 🎞️');
        const stripCanvas = document.createElement('canvas');
        const stripCtx = stripCanvas.getContext('2d');
        if (this.currentLayout === '4pics') {
            // 4 vertical photos (default classic)
            const stripWidth = 400;
            const stripHeight = 1000;
            stripCanvas.width = stripWidth;
            stripCanvas.height = stripHeight;
            this.createFilmBackground(stripCtx, stripWidth, stripHeight);
            this.addFilmPerforations(stripCtx, stripWidth, stripHeight);
            this.addFilmBranding(stripCtx, stripWidth, stripHeight);
            this.photos.forEach((photoData, index) => {
                const img = new Image();
                img.onload = () => {
                    const photoWidth = stripWidth - 80;
                    const photoHeight = (stripHeight - 200) / 4 - 40;
                    const x = 40;
                    const y = 120 + (index * ((stripHeight - 200) / 4)) + 20;
                    this.drawFilmFrame(stripCtx, x - 10, y - 10, photoWidth + 20, photoHeight + 20);
                    this.drawRoundedImage(stripCtx, img, x, y, photoWidth, photoHeight, 8);
                    this.addFilmEdgeDetails(stripCtx, stripWidth, y + photoHeight + 55, index);
                    if (index === this.photos.length - 1) {
                        this.displayPhotoStrip(stripCanvas.toDataURL());
                    }
                };
                img.src = photoData;
            });
        } else if (this.currentLayout === '3pics') {
            // 3 vertical photos
            const stripWidth = 400;
            const stripHeight = 900;
            stripCanvas.width = stripWidth;
            stripCanvas.height = stripHeight;
            this.createFilmBackground(stripCtx, stripWidth, stripHeight);
            this.addFilmPerforations(stripCtx, stripWidth, stripHeight);
            this.addFilmBranding(stripCtx, stripWidth, stripHeight);
            this.photos.forEach((photoData, index) => {
                const img = new Image();
                img.onload = () => {
                    const photoWidth = stripWidth - 80;
                    const photoHeight = (stripHeight - 200) / 3 - 40;
                    const x = 40;
                    const y = 120 + (index * ((stripHeight - 200) / 3)) + 20;
                    this.drawFilmFrame(stripCtx, x - 10, y - 10, photoWidth + 20, photoHeight + 20);
                    this.drawRoundedImage(stripCtx, img, x, y, photoWidth, photoHeight, 8);
                    this.addFilmEdgeDetails(stripCtx, stripWidth, y + photoHeight + 55, index);
                    if (index === this.photos.length - 1) {
                        this.displayPhotoStrip(stripCanvas.toDataURL());
                    }
                };
                img.src = photoData;
            });
        } else if (this.currentLayout === '2up2down') {
            // 2x2 grid with thinner film border and larger photos
            const stripWidth = 520;
            const stripHeight = 720;
            stripCanvas.width = stripWidth;
            stripCanvas.height = stripHeight;
            // Film background and border
            stripCtx.save();
            stripCtx.fillStyle = '#222'; // lighter than before
            stripCtx.fillRect(0, 0, stripWidth, stripHeight);
            stripCtx.restore();
            // Film perforations (top, bottom, left, right)
            this.addFilmPerforations(stripCtx, stripWidth, stripHeight);
            // Left/right perforations
            stripCtx.save();
            stripCtx.fillStyle = '#000';
            for (let y = 0; y < stripHeight; y += 28) {
                stripCtx.beginPath();
                stripCtx.arc(15, y + 14, 3, 0, Math.PI * 2);
                stripCtx.fill();
                stripCtx.beginPath();
                stripCtx.arc(stripWidth - 15, y + 14, 3, 0, Math.PI * 2);
                stripCtx.fill();
            }
            stripCtx.restore();
            // Branding
            stripCtx.save();
            stripCtx.fillStyle = '#fff';
            stripCtx.font = 'bold 24px "Courier New", monospace';
            stripCtx.textAlign = 'center';
            stripCtx.fillText('lumi film', stripWidth / 2, 38);
            stripCtx.restore();
            // Grid settings for even larger, immersive photos
            const photoSize = 220;
            const gap = 16;
            const totalGridWidth = photoSize * 2 + gap;
            const totalGridHeight = photoSize * 2 + gap;
            const startX = (stripWidth - totalGridWidth) / 2;
            const startY = (stripHeight - totalGridHeight) / 2 + 10;
            const grid = [
                { x: startX, y: startY },
                { x: startX + photoSize + gap, y: startY },
                { x: startX, y: startY + photoSize + gap },
                { x: startX + photoSize + gap, y: startY + photoSize + gap }
            ];
            this.photos.forEach((photoData, index) => {
                const img = new Image();
                img.onload = () => {
                    const { x, y } = grid[index];
                    this.drawFilmFrame(stripCtx, x - 8, y - 8, photoSize + 16, photoSize + 16);
                    this.drawRoundedImage(stripCtx, img, x, y, photoSize, photoSize, 14);
                    if (index === this.photos.length - 1) {
                        this.displayPhotoStrip(stripCanvas.toDataURL());
                    }
                };
                img.src = photoData;
            });
        } else if (this.currentLayout === 'polaroid') {
            // Classic polaroid with less squished photo
            const stripWidth = 500;
            const stripHeight = 600;
            stripCanvas.width = stripWidth;
            stripCanvas.height = stripHeight;
            // Polaroid white background
            stripCtx.save();
            stripCtx.shadowColor = 'rgba(0,0,0,0.18)';
            stripCtx.shadowBlur = 32;
            stripCtx.shadowOffsetY = 18;
            stripCtx.fillStyle = '#fff';
            stripCtx.fillRect(0, 0, stripWidth, stripHeight);
            stripCtx.restore();
            // Photo area
            const border = 32;
            const bottomBorder = 70; // less than before
            const photoWidth = stripWidth - border * 2;
            const photoHeight = stripHeight - border - bottomBorder;
            const x = border;
            const y = border;
            const img = new Image();
            img.onload = () => {
                // Draw photo with rounded corners
                stripCtx.save();
                stripCtx.beginPath();
                stripCtx.moveTo(x + 18, y);
                stripCtx.lineTo(x + photoWidth - 18, y);
                stripCtx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + 18);
                stripCtx.lineTo(x + photoWidth, y + photoHeight - 18);
                stripCtx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - 18, y + photoHeight);
                stripCtx.lineTo(x + 18, y + photoHeight);
                stripCtx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - 18);
                stripCtx.lineTo(x, y + 18);
                stripCtx.quadraticCurveTo(x, y, x + 18, y);
                stripCtx.closePath();
                stripCtx.clip();
                stripCtx.drawImage(img, x, y, photoWidth, photoHeight);
                stripCtx.restore();
                // Polaroid label (date)
                stripCtx.fillStyle = '#222';
                stripCtx.font = 'bold 28px Poppins, Arial, sans-serif';
                stripCtx.textAlign = 'center';
                const date = new Date().toLocaleDateString();
                stripCtx.fillText('lumi', stripWidth / 2, stripHeight - 38);
                stripCtx.font = '16px Poppins, Arial, sans-serif';
                stripCtx.fillStyle = '#64748b';
                stripCtx.fillText(date, stripWidth / 2, stripHeight - 16);
                this.displayPhotoStrip(stripCanvas.toDataURL());
            };
            img.src = this.photos[0];
        }
    }
    
    createFilmBackground(ctx, width, height) {
        // Create film base color (dark gray/black)
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(0.5, '#2a2a2a');
        gradient.addColorStop(1, '#1a1a1a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add film texture
        this.addFilmTexture(ctx, width, height);
    }
    
    addFilmTexture(ctx, width, height) {
        // Add subtle film grain texture
        ctx.save();
        ctx.globalAlpha = 0.1;
        
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 1;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
            ctx.fillRect(x, y, size, size);
        }
        
        ctx.restore();
    }
    
    addFilmPerforations(ctx, width, height) {
        ctx.save();
        ctx.fillStyle = '#000000';
        
        // Top perforations
        for (let i = 0; i < width; i += 20) {
            ctx.beginPath();
            ctx.arc(i + 10, 15, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Bottom perforations
        for (let i = 0; i < width; i += 20) {
            ctx.beginPath();
            ctx.arc(i + 10, height - 15, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    addFilmBranding(ctx, width, height) {
        // Add film brand name
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('lumi film', width / 2, 40);
        
        // Add film type
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('35mm color negative', width / 2, 60);
        
        // Add date
        const date = new Date().toLocaleDateString();
        ctx.fillText(date, width / 2, 80);
        
        // Add film edge markings
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('lumi', 20, 100);
        ctx.textAlign = 'right';
        ctx.fillText('film', width - 20, 100);
        
        ctx.restore();
    }
    
    drawFilmFrame(ctx, x, y, width, height) {
        // Draw film frame border
        ctx.save();
        
        // Outer frame (black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, width, height);
        
        // Inner frame (white border)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
        
        // Inner frame (black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
        
        ctx.restore();
    }
    
    addFilmEdgeDetails(ctx, width, y, photoIndex) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Courier New", monospace';
        
        // Left edge markings
        ctx.textAlign = 'left';
        ctx.fillText(`${photoIndex + 1}`, 15, y);
        
        // Right edge markings
        ctx.textAlign = 'right';
        ctx.fillText(`${photoIndex + 1}`, width - 15, y);
        
        // Add small film edge indicators
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(10 + (i * 5), y - 5, 2, 2);
            ctx.fillRect(width - 12 + (i * 5), y - 5, 2, 2);
        }
        
        ctx.restore();
    }
    
    drawRoundedImage(ctx, img, x, y, width, height, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();
    }
    
    displayPhotoStrip(stripData) {
        // Store the strip data for download/print
        this.currentStripData = stripData;
        
        // Show the enhanced photo strip display
        const photoStripDisplay = document.getElementById('photoStripDisplay');
        const photoStripImg = document.getElementById('photoStripImg');
        
        photoStripImg.src = stripData;
        photoStripDisplay.style.display = 'flex';
        
        // Create individual photos grid
        this.createIndividualPhotosGrid();
        
        // Bind action button events
        this.bindPhotoStripActions();
        
        // Add success celebration
        this.triggerSuccessCelebration();
        
        this.updateStatus('Photo strip ready! Download, print, or start a new session ✨');
    }
    
    createIndividualPhotosGrid() {
        const individualPhotosGrid = document.getElementById('individualPhotos');
        individualPhotosGrid.innerHTML = '';
        
        this.photos.forEach((photoData, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'individual-photo';
            photoDiv.innerHTML = `
                <img src="${photoData}" alt="Photo ${index + 1}" />
                <div class="individual-photo-overlay">
                    <i class="fas fa-download"></i>
                </div>
            `;
            
            photoDiv.addEventListener('click', () => {
                this.downloadIndividualPhoto(photoData, index + 1);
            });
            
            individualPhotosGrid.appendChild(photoDiv);
        });
    }
    
    bindPhotoStripActions() {
        // Download button
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadPhotoStrip();
        });
        
        // Print button
        document.getElementById('printBtn').addEventListener('click', () => {
            this.printPhotoStrip();
        });
        
        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.sharePhotoStrip();
        });
        
        // New session button
        document.getElementById('newSessionBtn').addEventListener('click', () => {
            this.hidePhotoStripDisplay();
            this.resetPhotobooth();
        });
        
        // Close on overlay click
        document.querySelector('.photo-strip-overlay').addEventListener('click', () => {
            this.hidePhotoStripDisplay();
        });
    }
    
    downloadPhotoStrip() {
        if (!this.currentStripData) return;
        
        const link = document.createElement('a');
        link.download = `lumi-photo-strip-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = this.currentStripData;
        link.click();
        
        this.updateStatus('Photo strip downloaded successfully! 📥');
    }
    
    downloadIndividualPhoto(photoData, photoNumber) {
        const link = document.createElement('a');
        link.download = `lumi-photo-${photoNumber}-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = photoData;
        link.click();
        
        this.updateStatus(`Photo ${photoNumber} downloaded successfully! 📥`);
    }
    
    printPhotoStrip() {
        if (!this.currentStripData) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Lumi Film Strip</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            text-align: center; 
                            font-family: 'Courier New', monospace;
                            background: #f5f5f5;
                        }
                        .film-container {
                            display: inline-block;
                            background: #000000;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                            margin: 20px auto;
                        }
                        img { 
                            max-width: 100%; 
                            height: auto; 
                            border-radius: 5px;
                            filter: contrast(1.1) brightness(1.05);
                        }
                        .film-info {
                            color: #666;
                            margin-top: 20px;
                            font-size: 14px;
                        }
                        @media print {
                            body { 
                                background: white; 
                                padding: 10px; 
                            }
                            .film-container {
                                background: white;
                                padding: 10px;
                                box-shadow: none;
                                border: 1px solid #ccc;
                            }
                            img { 
                                filter: none;
                                box-shadow: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="film-container">
                        <img src="${this.currentStripData}" alt="Lumi Film Strip" />
                    </div>
                    <div class="film-info">
                        <p>lumi film - 35mm color negative</p>
                        <p>Printed from Lumi - ${new Date().toLocaleDateString()}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        this.updateStatus('Film strip sent to printer! 🖨️');
    }
    
    sharePhotoStrip() {
        if (navigator.share && this.currentStripData) {
            // Convert data URL to blob for sharing
            fetch(this.currentStripData)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'lumi-photo-strip.png', { type: 'image/png' });
                    navigator.share({
                        title: 'My Lumi Photo Strip',
                        text: 'Check out my photo strip from Lumi!',
                        files: [file]
                    });
                });
        } else {
            // Fallback: copy to clipboard or show share options
            this.showShareOptions();
        }
        
        this.updateStatus('Sharing photo strip... 📤');
    }
    
    showShareOptions() {
        // Create a simple share options modal
        const shareModal = document.createElement('div');
        shareModal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 2000;
            text-align: center;
        `;
        
        shareModal.innerHTML = `
            <h3>Share Options</h3>
            <p>Right-click on the photo strip and select "Save image as..." to download and share manually.</p>
            <button onclick="this.parentElement.remove()" style="
                background: #10b981;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 15px;
            ">OK</button>
        `;
        
        document.body.appendChild(shareModal);
    }
    
    hidePhotoStripDisplay() {
        const photoStripDisplay = document.getElementById('photoStripDisplay');
        photoStripDisplay.style.display = 'none';
    }
    
    triggerSuccessCelebration() {
        // Add confetti effect
        this.createConfetti();
        
        // Add success sound effect (visual feedback)
        const successIndicator = document.createElement('div');
        successIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            z-index: 2000;
            animation: successPop 1s ease-out forwards;
        `;
        successIndicator.innerHTML = '🎉';
        document.body.appendChild(successIndicator);
        
        setTimeout(() => {
            successIndicator.remove();
        }, 1000);
    }
    
    createConfetti() {
        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f472b6', '#f59e0b'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}vw;
                z-index: 1500;
                animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }
    
    resetPhotobooth() {
        this.photos = [];
        this.currentPhotoIndex = 0;
        this.updateProgress(0);
        
        // Hide enhanced photo strip display
        this.hidePhotoStripDisplay();
        
        // Reset thumbnails
        this.renderThumbnails();
        
        // Hide photo strip
        this.elements.photoStrip.style.display = 'none';
        
        // Reset buttons
        this.elements.captureBtn.disabled = false;
        
        // Check if auto mode is still enabled and restart auto capture
        if (this.isAutoMode && this.stream) {
            this.updateStatus('Auto mode active - Starting new session automatically!');
            this.startAutoCapture();
        } else {
            this.updateStatus('Ready for another session! 📸');
        }
    }
    
    updateStatus(message) {
        const statusText = this.elements.statusIndicator.querySelector('.status-text');
        statusText.textContent = message;
        
        // Add typing effect
        statusText.style.animation = 'none';
        statusText.offsetHeight;
        statusText.style.animation = 'fadeInUp 0.5s ease-out';
    }
    
    updateProgress(percentage) {
        this.elements.progressFill.style.width = `${percentage}%`;
    }
    
    toggleAutoMode() {
        const autoBtn = document.getElementById('autoBtn');
        this.isAutoMode = !this.isAutoMode;
        
        if (this.isAutoMode) {
            autoBtn.classList.add('active');
            this.elements.statusIndicator.classList.add('auto-active');
            this.updateStatus('Auto mode enabled - Photos will be taken automatically!');
            
            // Start auto capture if camera is ready
            if (this.stream && !this.elements.captureBtn.disabled) {
                this.startAutoCapture();
            }
        } else {
            autoBtn.classList.remove('active');
            this.elements.statusIndicator.classList.remove('auto-active');
            this.updateStatus('Auto mode disabled - Manual capture mode 📸');
            
            // Stop auto capture
            this.stopAutoCapture();
        }
    }
    
    startAutoCapture() {
        if (!this.isAutoMode || this.currentPhotoIndex >= this.maxPhotos) return;
        
        this.autoInterval = setInterval(() => {
            if (this.currentPhotoIndex < this.maxPhotos && !this.isCapturing) {
                this.capturePhoto();
            } else if (this.currentPhotoIndex >= this.maxPhotos) {
                this.stopAutoCapture();
            }
        }, 3000); // Take photo every 3 seconds
    }
    
    stopAutoCapture() {
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
    }
    
    toggleFilters() {
        const filterBtn = document.getElementById('filterBtn');
        
        if (filterBtn.classList.contains('active')) {
            filterBtn.classList.remove('active');
        } else {
            filterBtn.classList.add('active');
            this.showFilterModal();
        }
    }
    
    showFilterModal() {
        const filterModal = document.createElement('div');
        filterModal.id = 'filterModal';
        filterModal.className = 'filter-modal';
        
        let filterOptions = '';
        Object.entries(this.filters).forEach(([key, filter]) => {
            const isActive = this.currentFilter === key;
            filterOptions += `
                <div class="filter-option ${isActive ? 'active' : ''}" data-filter="${key}">
                    <i class="${filter.icon}"></i>
                    <span>${filter.name}</span>
                </div>
            `;
        });
        
        filterModal.innerHTML = `
            <div class="filter-modal-content">
                <div class="filter-modal-header">
                    <h3>Choose Filter</h3>
                    <button class="filter-modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="filter-options">
                    ${filterOptions}
                </div>
            </div>
        `;
        
        document.body.appendChild(filterModal);
        
        // Add event listeners to filter options
        filterModal.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', () => {
                const filterKey = option.dataset.filter;
                this.applyFilter(filterKey);
                filterModal.remove();
                document.getElementById('filterBtn').classList.remove('active');
            });
        });
        
        // Close modal when clicking outside
        filterModal.addEventListener('click', (e) => {
            if (e.target === filterModal) {
                filterModal.remove();
                document.getElementById('filterBtn').classList.remove('active');
            }
        });
    }
    
    applyFilter(filterKey) {
        console.log('Applying filter:', filterKey); // Debug log
        this.currentFilter = filterKey;
        const filterBtn = document.getElementById('filterBtn');
        const filter = this.filters[filterKey];
        
        // Update filter button icon
        filterBtn.innerHTML = `<i class="${filter.icon}"></i>`;
        
        // Apply filter to video if camera is active
        if (this.stream && this.video.style.display !== 'none') {
            this.applyVideoFilter();
            console.log('Video filter applied:', this.video.style.filter); // Debug log
        }
        
        this.updateStatus(`Filter applied: ${filter.name} ✨`);
    }
    
    applyVideoFilter() {
        if (!this.video || !this.stream) return;
        
        // Remove any existing canvas overlay
        const existingOverlay = document.getElementById('videoFilterOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Apply CSS filters for better performance
        const videoElement = this.video;
        
        // Reset any existing filters
        videoElement.style.filter = '';
        
        // Apply CSS filter based on selected filter
        switch (this.currentFilter) {
            case 'warm':
                videoElement.style.filter = 'sepia(0.3) hue-rotate(15deg) saturate(1.2) brightness(1.05)';
                break;
            case 'vivid':
                videoElement.style.filter = 'saturate(1.8) brightness(1.1) contrast(1.2)';
                break;
            case 'pastel':
                videoElement.style.filter = 'saturate(0.65) brightness(1.2) contrast(0.8)';
                break;
            case 'invert':
                videoElement.style.filter = 'invert(1)';
                break;
            case 'bw':
                videoElement.style.filter = 'grayscale(1)';
                break;
            case 'none':
            default:
                videoElement.style.filter = '';
                break;
        }
    }
    
    applyCanvasFilter(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        console.log('Applying canvas filter:', this.currentFilter); // Debug log
        
        switch (this.currentFilter) {
            case 'warm':
                this.applyWarmFilter(data);
                break;
            case 'vivid':
                this.applyVividFilter(data);
                break;
            case 'pastel':
                this.applyPastelFilter(data);
                break;
            case 'invert':
                this.applyInvertFilter(data);
                break;
            case 'bw':
                this.applyBlackWhiteFilter(data);
                break;
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('Canvas filter applied successfully'); // Debug log
    }
    
    applyWarmFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            // Match CSS: sepia(0.3) hue-rotate(15deg) saturate(1.2) brightness(1.05) contrast(1.05)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Apply sepia (0.3) - simplified
            let newR = r * 0.9 + g * 0.1;
            let newG = g * 0.95 + r * 0.05;
            let newB = b * 0.8;
            
            // Apply warm tint (hue-rotate 15deg simplified)
            newR = Math.min(255, newR + 8);
            newG = Math.min(255, newG + 4);
            newB = Math.max(0, newB - 5);
            
            // Apply saturation (1.2) - simplified
            const avg = (newR + newG + newB) / 3;
            newR = avg + (newR - avg) * 1.1;
            newG = avg + (newG - avg) * 1.1;
            newB = avg + (newB - avg) * 1.1;
            
            // Apply brightness (1.05)
            newR = Math.min(255, newR * 1.05);
            newG = Math.min(255, newG * 1.05);
            newB = Math.min(255, newB * 1.05);
            
            data[i] = Math.min(255, Math.max(0, newR));
            data[i + 1] = Math.min(255, Math.max(0, newG));
            data[i + 2] = Math.min(255, Math.max(0, newB));
        }
    }
    
    applyVividFilter(data) {
        // saturate(1.8) brightness(1.1) contrast(1.2)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Saturation 1.8 (enhance colors)
            const avg = (r + g + b) / 3;
            let newR = avg + (r - avg) * 1.8;
            let newG = avg + (g - avg) * 1.8;
            let newB = avg + (b - avg) * 1.8;
            
            // Brightness 1.1
            newR *= 1.1;
            newG *= 1.1;
            newB *= 1.1;
            
            // Contrast 1.2 (enhance contrast)
            newR = (newR - 128) * 1.2 + 128;
            newG = (newG - 128) * 1.2 + 128;
            newB = (newB - 128) * 1.2 + 128;
            
            data[i] = Math.min(255, Math.max(0, newR));
            data[i + 1] = Math.min(255, Math.max(0, newG));
            data[i + 2] = Math.min(255, Math.max(0, newB));
        }
    }
    
    applyPastelFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            // Match CSS: saturate(0.65) brightness(1.2) contrast(0.8)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Apply saturation (0.65)
            const avg = (r + g + b) / 3;
            let newR = avg + (r - avg) * 0.65;
            let newG = avg + (g - avg) * 0.65;
            let newB = avg + (b - avg) * 0.65;
            
            // Apply brightness (1.2)
            newR *= 1.2;
            newG *= 1.2;
            newB *= 1.2;
            
            // Apply contrast (0.8)
            const contrast = 0.8;
            const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
            newR = factor * (newR - 128) + 128;
            newG = factor * (newG - 128) + 128;
            newB = factor * (newB - 128) + 128;
            
            data[i] = Math.min(255, Math.max(0, newR));
            data[i + 1] = Math.min(255, Math.max(0, newG));
            data[i + 2] = Math.min(255, Math.max(0, newB));
        }
    }
    
    applyInvertFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    }
    
    applyBlackWhiteFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
        }
    }
    
    captureWithCanvasFilter() {
        // Simple method - capture raw video and apply filter directly
        console.log('Capturing with filter:', this.currentFilter); // Debug log
        
        const captureCanvas = document.createElement('canvas');
        const captureCtx = captureCanvas.getContext('2d');
        captureCanvas.width = this.video.videoWidth;
        captureCanvas.height = this.video.videoHeight;
        
        // Temporarily remove CSS filter from video
        const originalFilter = this.video.style.filter;
        this.video.style.filter = '';
        
        // Draw raw video to canvas
        captureCtx.drawImage(this.video, 0, 0, captureCanvas.width, captureCanvas.height);
        
        // Restore CSS filter for video preview
        this.video.style.filter = originalFilter;
        
        // Apply mirror transform
        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d');
        finalCanvas.width = captureCanvas.width;
        finalCanvas.height = captureCanvas.height;
        
        finalCtx.scale(-1, 1);
        finalCtx.translate(-finalCanvas.width, 0);
        finalCtx.drawImage(captureCanvas, 0, 0);
        
        // Apply the exact same filter logic as CSS
        if (this.currentFilter !== 'none') {
            this.applyExactFilter(finalCtx, finalCanvas.width, finalCanvas.height);
        }
        
        return finalCanvas.toDataURL('image/jpeg', 0.9);
    }
    
    applyExactFilter(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        console.log('Applying exact filter:', this.currentFilter); // Debug log
        
        switch (this.currentFilter) {
            case 'warm':
                // sepia(0.3) hue-rotate(15deg) saturate(1.2) brightness(1.05)
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Sepia effect (0.3)
                    let newR = r * 0.8 + g * 0.15 + b * 0.05;
                    let newG = r * 0.1 + g * 0.85 + b * 0.05;
                    let newB = r * 0.05 + g * 0.1 + b * 0.85;
                    
                    // Warm tint (hue-rotate 15deg)
                    newR = Math.min(255, newR + 8);
                    newG = Math.min(255, newG + 4);
                    newB = Math.max(0, newB - 5);
                    
                    // Saturation 1.2
                    const avg = (newR + newG + newB) / 3;
                    newR = avg + (newR - avg) * 1.2;
                    newG = avg + (newG - avg) * 1.2;
                    newB = avg + (newB - avg) * 1.2;
                    
                    // Brightness 1.05
                    newR *= 1.05;
                    newG *= 1.05;
                    newB *= 1.05;
                    
                    data[i] = Math.min(255, Math.max(0, newR));
                    data[i + 1] = Math.min(255, Math.max(0, newG));
                    data[i + 2] = Math.min(255, Math.max(0, newB));
                }
                break;
                
            case 'vivid':
                // saturate(1.8) brightness(1.1) contrast(1.2)
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Saturation 1.8 (enhance colors)
                    const avg = (r + g + b) / 3;
                    let newR = avg + (r - avg) * 1.8;
                    let newG = avg + (g - avg) * 1.8;
                    let newB = avg + (b - avg) * 1.8;
                    
                    // Brightness 1.1
                    newR *= 1.1;
                    newG *= 1.1;
                    newB *= 1.1;
                    
                    // Contrast 1.2 (enhance contrast)
                    newR = (newR - 128) * 1.2 + 128;
                    newG = (newG - 128) * 1.2 + 128;
                    newB = (newB - 128) * 1.2 + 128;
                    
                    data[i] = Math.min(255, Math.max(0, newR));
                    data[i + 1] = Math.min(255, Math.max(0, newG));
                    data[i + 2] = Math.min(255, Math.max(0, newB));
                }
                break;
                
            case 'pastel':
                // saturate(0.65) brightness(1.2) contrast(0.8)
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Saturation 0.65 (reduce color intensity)
                    const avg = (r + g + b) / 3;
                    let newR = avg + (r - avg) * 0.65;
                    let newG = avg + (g - avg) * 0.65;
                    let newB = avg + (b - avg) * 0.65;
                    
                    // Brightness 1.2
                    newR *= 1.2;
                    newG *= 1.2;
                    newB *= 1.2;
                    
                    // Contrast 0.8 (reduce contrast)
                    newR = (newR - 128) * 0.8 + 128;
                    newG = (newG - 128) * 0.8 + 128;
                    newB = (newB - 128) * 0.8 + 128;
                    
                    data[i] = Math.min(255, Math.max(0, newR));
                    data[i + 1] = Math.min(255, Math.max(0, newG));
                    data[i + 2] = Math.min(255, Math.max(0, newB));
                }
                break;
                
            case 'invert':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                break;
                
            case 'bw':
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = data[i + 1] = data[i + 2] = avg;
                }
                break;
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('Filter applied successfully:', this.currentFilter); // Debug log
    }
    
    changeBackgroundColor() {
        try {
            console.log('Changing background color...'); // Debug log
            
            // Cycle to next background color
            this.currentBgIndex = (this.currentBgIndex + 1) % this.backgroundColors.length;
            const newBg = this.backgroundColors[this.currentBgIndex];
            
            console.log('New background:', newBg); // Debug log
            
            // Apply new background to body
            document.body.style.background = newBg.color;
            
            // Update status
            this.updateStatus(`Background changed to ${newBg.name} ✨`);
            
            console.log('Background changed successfully to:', newBg.name);
        } catch (error) {
            console.error('Error changing background color:', error);
            this.updateStatus('Error changing background color');
        }
    }
    
    toggleFlash() {
        this.flashEnabled = !this.flashEnabled;
        const flashBtn = document.getElementById('flashBtn');
        
        console.log('Flash toggled. Enabled:', this.flashEnabled); // Debug log
        
        if (this.flashEnabled) {
            flashBtn.classList.add('active');
            this.updateStatus('Flash enabled ⚡');
            console.log('Flash enabled');
        } else {
            flashBtn.classList.remove('active');
            this.updateStatus('Flash disabled');
            console.log('Flash disabled');
        }
    }
    
    // Sound management methods
    playShutterSound() {
        if (this.soundEnabled && this.elements.shutterSound) {
            this.elements.shutterSound.currentTime = 0;
            this.elements.shutterSound.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    playSuccessSound() {
        if (this.soundEnabled && this.elements.successSound) {
            this.elements.successSound.currentTime = 0;
            this.elements.successSound.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateStatus(`Sound ${this.soundEnabled ? 'enabled' : 'disabled'} 🔊`);
    }
    
    updateSoundButtonIcon() {
        const soundBtn = this.elements.soundBtn;
        const icon = soundBtn.querySelector('i');
        
        if (this.soundEnabled) {
            icon.className = 'fas fa-volume-up';
            soundBtn.classList.remove('muted');
        } else {
            icon.className = 'fas fa-volume-mute';
            soundBtn.classList.add('muted');
        }
    }
}

// Initialize the photobooth when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Lumi();
});

// Add some extra immersive effects
document.addEventListener('mousemove', (e) => {
    const particles = document.querySelectorAll('.particle');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    particles.forEach((particle, index) => {
        const speed = (index % 3 + 1) * 0.5;
        const x = (mouseX - 0.5) * speed * 20;
        const y = (mouseY - 0.5) * speed * 20;
        
        particle.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// Add window resize handling
window.addEventListener('resize', () => {
    // Recreate particles for better responsiveness
    const particlesBg = document.getElementById('particlesBg');
    particlesBg.innerHTML = '';
    
    setTimeout(() => {
        const lumisnap = new Lumi();
        lumisnap.createParticles();
    }, 100);
});