document.addEventListener('DOMContentLoaded', function() {
    // Set random background image
    const bgLayer = document.getElementById('bgLayer');
    if (bgLayer) {
        const imageIndex = Math.floor(Math.random() * 24); // 0-23
        bgLayer.style.backgroundImage = `url('/medias/featureimages/${imageIndex}.jpg')`;
    }

    // Elements
    const inputText = document.getElementById('inputText');
    const resultText = document.getElementById('resultText');
    const conversionMode = document.getElementById('conversionMode');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const clearInputBtn = document.getElementById('clearInputBtn');
    const clearResultBtn = document.getElementById('clearResultBtn');
    const toast = document.getElementById('toast');

    // Base64 Encode (supports UTF-8)
    function base64Encode(str) {
        try {
            // Convert to UTF-8 bytes first, then to Base64
            const encoder = new TextEncoder();
            const bytes = encoder.encode(str);
            let binary = '';
            bytes.forEach(byte => {
                binary += String.fromCharCode(byte);
            });
            return btoa(binary);
        } catch (e) {
            throw new Error('编码失败: ' + e.message);
        }
    }

    // Base64 Decode (supports UTF-8)
    function base64Decode(str) {
        try {
            // Decode from Base64 to binary string, then to UTF-8
            const binary = atob(str);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const decoder = new TextDecoder();
            return decoder.decode(bytes);
        } catch (e) {
            throw new Error('解码失败: 输入的内容不是有效的 Base64 编码');
        }
    }

    // Handle Encode Button
    encodeBtn.addEventListener('click', function() {
        const input = inputText.value;
        if (!input.trim()) {
            showToast('请输入要编码的内容', 'error');
            inputText.focus();
            return;
        }

        try {
            const encoded = base64Encode(input);
            resultText.value = encoded;
            showToast('编码成功!', 'success');
            highlightResult();
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    // Handle Decode Button
    decodeBtn.addEventListener('click', function() {
        const input = inputText.value;
        if (!input.trim()) {
            showToast('请输入要解码的内容', 'error');
            inputText.focus();
            return;
        }

        try {
            const decoded = base64Decode(input.trim());
            resultText.value = decoded;
            showToast('解码成功!', 'success');
            highlightResult();
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    // Handle Copy Button
    copyResultBtn.addEventListener('click', function() {
        const result = resultText.value;
        if (!result) {
            showToast('没有可复制的内容', 'error');
            return;
        }

        copyToClipboard(result).then(() => {
            showToast('已复制到剪贴板!', 'success');
            // Visual feedback
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i>';
            this.style.color = 'var(--monokai-green)';
            setTimeout(() => {
                this.innerHTML = originalHTML;
                this.style.color = '';
            }, 1000);
        });
    });

    // Handle Clear Input Button
    clearInputBtn.addEventListener('click', function() {
        inputText.value = '';
        inputText.focus();
    });

    // Handle Clear Result Button
    clearResultBtn.addEventListener('click', function() {
        resultText.value = '';
    });

    // Highlight result textarea briefly
    function highlightResult() {
        resultText.style.borderColor = 'var(--monokai-green)';
        setTimeout(() => {
            resultText.style.borderColor = '';
        }, 500);
    }

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
        toast.className = 'toast';
        if (type) {
            toast.classList.add(type);
        }
        toast.classList.add('show');
        
        if (toastTimeout) clearTimeout(toastTimeout);
        
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Keyboard shortcuts
    inputText.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to convert based on selected mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const mode = conversionMode.value;
            if (mode === 'encode') {
                encodeBtn.click();
            } else {
                decodeBtn.click();
            }
        }
    });
});
