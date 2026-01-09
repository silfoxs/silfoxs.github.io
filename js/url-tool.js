document.addEventListener('DOMContentLoaded', function() {
    // Set random background image
    const bgLayer = document.getElementById('bgLayer');
    if (bgLayer) {
        const imageIndex = Math.floor(Math.random() * 24); // 0-23
        bgLayer.style.backgroundImage = `url('/medias/featureimages/${imageIndex}.jpg')`;
    }

    // Elements
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearInputBtn = document.getElementById('clearInputBtn');
    const swapBtn = document.getElementById('swapBtn');
    const toast = document.getElementById('toast');

    // Encode URL
    encodeBtn.addEventListener('click', function() {
        const input = inputText.value;
        if (!input.trim()) {
            showToast('请输入内容', 'error');
            inputText.focus();
            return;
        }

        try {
            const encoded = encodeURIComponent(input);
            outputText.value = encoded;
            highlightOutput();
            showToast('编码成功！', 'success');
        } catch (e) {
            console.error(e);
            showToast('编码失败: ' + e.message, 'error');
        }
    });

    // Decode URL
    decodeBtn.addEventListener('click', function() {
        const input = inputText.value;
        if (!input.trim()) {
            showToast('请输入内容', 'error');
            inputText.focus();
            return;
        }

        try {
            const decoded = decodeURIComponent(input);
            outputText.value = decoded;
            highlightOutput();
            showToast('解码成功！', 'success');
        } catch (e) {
            console.error(e);
            showToast('解码失败: ' + e.message, 'error');
        }
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', function() {
        const output = outputText.value;
        if (!output.trim()) {
            showToast('没有可复制的内容', 'error');
            return;
        }

        copyToClipboard(output).then(() => {
            showToast('已复制！', 'success');
            // Visual feedback
            const icon = copyBtn.querySelector('i');
            icon.className = 'fas fa-check';
            copyBtn.style.color = 'var(--monokai-green)';
            setTimeout(() => {
                icon.className = 'fas fa-copy';
                copyBtn.style.color = '';
            }, 1000);
        }).catch(err => {
            showToast('复制失败', 'error');
        });
    });

    // Clear input
    clearInputBtn.addEventListener('click', function() {
        inputText.value = '';
        inputText.focus();
    });

    // Swap input and output
    swapBtn.addEventListener('click', function() {
        const output = outputText.value;
        if (!output.trim()) {
            showToast('没有可交换的内容', 'error');
            return;
        }
        inputText.value = output;
        outputText.value = '';
        showToast('已交换', 'success');
    });

    // Visual feedback for output
    function highlightOutput() {
        outputText.style.borderColor = 'var(--monokai-green)';
        setTimeout(() => {
            outputText.style.borderColor = '';
        }, 300);
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
});
