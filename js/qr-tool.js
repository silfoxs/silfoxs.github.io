document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const qrContent = document.getElementById('qr-content');
    const colorPicker = document.getElementById('qr-color');
    const colorValue = colorPicker.nextElementSibling;
    const bgColorPicker = document.getElementById('bg-color');
    const bgColorValue = bgColorPicker.nextElementSibling;
    const correctionRadios = document.getElementsByName('qr-correction');
    const logoUpload = document.getElementById('logo-upload');
    const removeLogoBtn = document.getElementById('remove-logo');
    const downloadBtn = document.getElementById('download-btn');
    const generateBtn = document.getElementById('generate-btn');

    let qrCode;
    let logoUrl = '';

    /**
     * Process an image URL into a rounded square.
     * Returns a Promise that resolves with the new data URL.
     */
    function createRoundedLogo(imageUrl, size = 100, radius = 20) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // Draw rounded rectangle path
                ctx.beginPath();
                ctx.moveTo(radius, 0);
                ctx.lineTo(size - radius, 0);
                ctx.quadraticCurveTo(size, 0, size, radius);
                ctx.lineTo(size, size - radius);
                ctx.quadraticCurveTo(size, size, size - radius, size);
                ctx.lineTo(radius, size);
                ctx.quadraticCurveTo(0, size, 0, size - radius);
                ctx.lineTo(0, radius);
                ctx.quadraticCurveTo(0, 0, radius, 0);
                ctx.closePath();
                ctx.clip();

                // Draw image scaled to fit
                ctx.drawImage(img, 0, 0, size, size);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(''); // Fallback to no logo on error
            img.src = imageUrl;
        });
    }

    // Get selected correction level
    function getSelectedCorrection() {
        for (const radio of correctionRadios) {
            if (radio.checked) return radio.value;
        }
        return 'M'; // Default
    }

    // Initialize QR Code
    function initQRCode() {
        qrCode = new QRCodeStyling({
            width: 400,
            height: 400,
            type: "svg",
            data: qrContent.value,
            margin: 10, // Add white padding around QR code
            image: logoUrl,
            dotsOptions: {
                color: colorPicker.value,
                type: "dots" // Individual dots with gaps between them
            },
            backgroundOptions: {
                color: bgColorPicker.value,
            },
            cornersSquareOptions: {
                type: "extra-rounded" // Rounded corners style
            },
            cornersDotOptions: {
                type: "dot" // Rounded corner dots
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 10,
                imageSize: 0.5, // Larger logo
                hideBackgroundDots: true // Ensure logo doesn't cover QR code dots
            },
            qrOptions: {
                errorCorrectionLevel: getSelectedCorrection()
            }
        });

        qrCode.append(document.getElementById("qr-canvas"));
    }

    // Update Function
    function updateQRCode() {
        qrCode.update({
            data: qrContent.value,
            image: logoUrl,
            dotsOptions: {
                color: colorPicker.value
            },
            backgroundOptions: {
                color: bgColorPicker.value
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 10,
                imageSize: 0.5, // Fixed logo size regardless of error correction
                hideBackgroundDots: true // Ensure logo doesn't cover QR code dots
            },
            qrOptions: {
                errorCorrectionLevel: getSelectedCorrection()
            }
        });
    }

    // Event Listeners
    generateBtn.addEventListener('click', () => {
        // Add a small animation effect
        const btn = generateBtn;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
        
        setTimeout(() => {
            updateQRCode();
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> 生成';
        }, 300);
    });

    // Real-time updates for inputs
    qrContent.addEventListener('input', () => {
        // Debounce slightly to avoid too many redraws
        clearTimeout(window.qrDebounce);
        window.qrDebounce = setTimeout(updateQRCode, 300);
    });

    // Color Pickers
    colorPicker.addEventListener('input', (e) => {
        colorValue.textContent = e.target.value;
        updateQRCode();
    });

    bgColorPicker.addEventListener('input', (e) => {
        bgColorValue.textContent = e.target.value;
        updateQRCode();
    });

    // Error Correction Radio buttons
    correctionRadios.forEach(radio => {
        radio.addEventListener('change', updateQRCode);
    });

    // Logo Upload - process into rounded square
    logoUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                // Process the logo into a rounded square (100px with 20px radius)
                logoUrl = await createRoundedLogo(event.target.result, 100, 20);
                removeLogoBtn.style.display = 'flex';
                updateQRCode();
            };
            reader.readAsDataURL(file);
        }
    });

    // Remove Logo
    removeLogoBtn.addEventListener('click', () => {
        logoUrl = '';
        logoUpload.value = ''; // Reset input
        removeLogoBtn.style.display = 'none';
        updateQRCode();
    });

    // Download
    downloadBtn.addEventListener('click', () => {
        qrCode.download({ name: "qr-code", extension: "png" });
    });

    // Initial Render
    initQRCode();
});
