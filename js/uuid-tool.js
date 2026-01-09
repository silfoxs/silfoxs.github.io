document.addEventListener('DOMContentLoaded', function() {
    // Set random background image
    const bgLayer = document.getElementById('bgLayer');
    if (bgLayer) {
        const imageIndex = Math.floor(Math.random() * 24); // 0-23
        bgLayer.style.backgroundImage = `url('/medias/featureimages/${imageIndex}.jpg')`;
    }

    // Elements
    const versionSelect = document.getElementById('uuidVersion');
    const paramsDiv = document.getElementById('v3v5Params');
    const namespaceInput = document.getElementById('namespaceInput');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');
    const toast = document.getElementById('toast');
    
    // Result fields
    const resStandard = document.getElementById('res-standard');
    const resNoHyphen = document.getElementById('res-no-hyphen');
    const resUpper = document.getElementById('res-upper');
    const resUpperNoHyphen = document.getElementById('res-upper-no-hyphen');

    // Toggle Params visibility based on version
    versionSelect.addEventListener('change', function() {
        const ver = this.value;
        if (ver === 'v5') {
            paramsDiv.classList.remove('hidden');
            // Auto-fill a random namespace if empty to be helpful
            if (!namespaceInput.value) {
                if (uuid && uuid.v4) {
                     namespaceInput.value = uuid.v4();
                }
            }
        } else {
            paramsDiv.classList.add('hidden');
        }
    });

    // Generate UUIDs
    generateBtn.addEventListener('click', generateOneUUID);

    function generateOneUUID() {
        const ver = versionSelect.value;
        let id;

        // Validation for v5
        let namespace, name;
        if (ver === 'v5') {
            namespace = namespaceInput.value.trim();
            name = nameInput.value.trim();

            if (!uuid.validate(namespace)) {
                showToast('Invalid Namespace UUID!', 'error');
                if(uuid && uuid.v4) {
                    namespace = uuid.v4();
                    namespaceInput.value = namespace;
                }
                return;
            }
            if (!name) {
                showToast('Please enter a Name for v5', 'error');
                nameInput.focus();
                return;
            }
        }

        try {
            switch (ver) {
                case 'v1':
                    id = uuid.v1();
                    break;
                case 'v4':
                    id = uuid.v4();
                    break;
                case 'v5':
                    id = uuid.v5(name, namespace);
                    break;
                case 'v7':
                    if (uuid.v7) {
                        id = uuid.v7();
                    } else {
                        showToast('UUID v7 not supported', 'error');
                        return;
                    }
                    break;
                default:
                    id = uuid.v4();
            }

            // Populate all formats
            if (id) {
                const standard = id.toLowerCase();
                const noHyphen = standard.replace(/-/g, '');
                const upper = standard.toUpperCase();
                const upperNoHyphen = upper.replace(/-/g, '');

                resStandard.value = standard;
                resNoHyphen.value = noHyphen;
                resUpper.value = upper;
                resUpperNoHyphen.value = upperNoHyphen;

                // Animation or Visual Feedback
                const inputs = [resStandard, resNoHyphen, resUpper, resUpperNoHyphen];
                inputs.forEach(input => {
                    input.style.borderColor = 'var(--monokai-green)';
                    setTimeout(() => {
                        input.style.borderColor = '';
                    }, 300);
                });
            }

        } catch (e) {
            console.error(e);
            showToast('Error: ' + e.message, 'error');
        }
    }

    // Handle Copy Buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (input && input.value) {
                copyToClipboard(input.value).then(() => {
                    showToast('Copied!', 'success');
                    // Visual feedback on button
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    this.style.color = 'var(--monokai-green)';
                    setTimeout(() => {
                        this.innerHTML = originalHTML;
                        this.style.color = '';
                    }, 1000);
                });
            } else {
                showToast('Nothing to copy!', 'error');
            }
        });
    });

    // Helper: Copy to clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }

    // Helper: Show Toast
    let toastTimeout;
    function showToast(msg, type = '') {
        toast.textContent = msg;
        toast.className = 'toast'; // Reset classes
        if (type) {
            toast.classList.add(type);
        }
        toast.classList.add('show');
        
        if (toastTimeout) clearTimeout(toastTimeout);
        
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // No auto-generation on load - wait for user to click generate button
});
