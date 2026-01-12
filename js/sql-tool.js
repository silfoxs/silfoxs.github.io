/**
 * SQL Tool
 * Features: Format (Beautify), Compress, Copy, Clear
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        sqlInput: document.getElementById('sqlInput'),
        syntaxHighlight: document.getElementById('syntaxHighlight'),
        lineNumbers: document.getElementById('lineNumbers'),
        buttons: {
            format: document.getElementById('formatBtn'),
            compress: document.getElementById('compressBtn'),
            copy: document.getElementById('copyBtn'),
            clear: document.getElementById('clearBtn')
        },
        status: {
            cursorLine: document.getElementById('cursorLine'),
            cursorCol: document.getElementById('cursorCol')
        }
    };

    // --- Initialization ---
    function init() {
        bindEvents();
        updateLineNumbers();
        updateSyntaxHighlight();
        validateSQL(); // Initial validation
        elements.sqlInput.focus();
    }

    function bindEvents() {
        elements.sqlInput.addEventListener('input', () => {
            updateSyntaxHighlight();
            updateLineNumbers();
            validateSQL(); // Validate on input
        });
        
        elements.sqlInput.addEventListener('scroll', syncScroll);
        elements.sqlInput.addEventListener('click', updateCursorPosition);
        elements.sqlInput.addEventListener('keyup', updateCursorPosition);
        elements.sqlInput.addEventListener('keydown', (e) => {
            // Handle Tab key
            if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertText', false, '  ');
            }
            updateCursorPosition();
        });

        // Toolbar actions
        elements.buttons.format.addEventListener('click', formatSQL);
        elements.buttons.compress.addEventListener('click', compressSQL);
        elements.buttons.copy.addEventListener('click', copyToClipboard);
        elements.buttons.clear.addEventListener('click', clearContent);
    }

    // --- Core Editor Functions ---
    
    // Simple SQL Validator
    function validateSQL() {
        const text = elements.sqlInput.value;
        const statusEl = document.getElementById('sqlStatus');
        const errorBar = document.getElementById('errorBar');
        const errorMessagePtr = document.getElementById('errorMessage');
        
        // Reset state
        statusEl.className = 'sql-status';
        statusEl.innerHTML = '';
        errorBar.classList.remove('active');
        document.querySelectorAll('.line-number.error').forEach(el => el.classList.remove('error'));
        
        if (!text.trim()) {
            return;
        }

        const error = checkSyntax(text);

        if (error) {
            statusEl.classList.add('invalid');
            statusEl.innerHTML = '<i class="fas fa-times-circle"></i> Invalid SQL';
            
            errorBar.classList.add('active');
            errorMessagePtr.textContent = `${error.message} (Line ${error.line})`;
            
            // Mark line
            const lineEl = elements.lineNumbers.children[error.line - 1];
            if (lineEl) {
                lineEl.classList.add('error');
            }
        } else {
            statusEl.classList.add('valid');
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Valid SQL';
        }
    }
    
    function checkSyntax(text) {
        // 1. Check for unclosed quotes
        const lines = text.split('\n');
        let currentQuote = null; // ' or ` or "
        let quoteStartLine = -1;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // If inside quote
            if (currentQuote) {
                if (char === currentQuote) {
                    // Check escaped
                    // Using simple check: if prev char is backslash, maybe escaped. 
                    // SQL standard is usually double quote to escape, e.g. 'can''t'.
                    // Backslash is MySQL specific but common.
                    // Let's assume standard ' inversion first or backslash.
                    // Simplified: just end it on matching quote unless literal escape detected (omitted for simple check)
                    currentQuote = null;
                }
            } else {
                // Not inside quote
                if (char === "'" || char === '`' || char === '"') {
                    currentQuote = char;
                    // Find line number
                    quoteStartLine = text.substring(0, i).split('\n').length;
                }
            }
        }
        
        if (currentQuote) {
            return { message: `Unclosed quote (${currentQuote})`, line: quoteStartLine };
        }
        
        // 2. Check for unbalanced parentheses
        const stack = [];
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            // Skip checking inside quotes (simplified, assume valid quotes from above check passes mostly, 
            // but for robust check we should re-track quotes. 
            // Let's just do a simple strict check ignoring context for now to keep it lightweight,
            // or better: track quotes loop combined.
            
            // Re-implementing with quote awareness
        }
        
        return checkBalanced(text);
    }
    
    function checkBalanced(text) {
        let stack = [];
        let inQuote = null; // ' or " or `
        let lines = text.split('\n');
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (inQuote) {
                if (char === inQuote) {
                    // Check for escapes: usually '' for '
                    if (char === "'" && text[i+1] === "'") {
                        i++; // Skip next
                        continue;
                    }
                     // Backslash escape
                    if (text[i-1] === '\\' && text[i-2] !== '\\') { // Simple escape check
                         continue;
                     }
                    inQuote = null;
                }
                continue;
            }
            
            if (char === "'" || char === '"' || char === '`') {
                inQuote = char;
                continue;
            }
            
            // Parentheses
            if (char === '(') {
                stack.push({ char: '(', index: i });
            } else if (char === ')') {
                if (stack.length === 0 || stack[stack.length - 1].char !== '(') {
                    const line = text.substring(0, i).split('\n').length;
                    return { message: 'Unexpected closing parenthesis )', line: line };
                }
                stack.pop();
            }
        }
        
        if (stack.length > 0) {
            const last = stack.pop();
            constline = text.substring(0, last.index).split('\n').length;
            const line = text.substring(0, last.index).split('\n').length;
            return { message: 'Unclosed parenthesis (', line: line };
        }
        
        // Check for unclosed comments? (/* ... */)
        
        return null;
    }

    function updateLineNumbers() {
        const text = elements.sqlInput.value;
        const lines = text.split('\n');
        
        // Preserve existing classes (like error) if line count matches? 
        // No, simplest is re-render. Validation runs after updateLineNumbers so it re-applies error.
        
        elements.lineNumbers.innerHTML = lines.map((_, i) => {
            return `<span class="line-number" data-line="${i+1}">${i + 1}</span>`;
        }).join('');
    }

    function updateSyntaxHighlight() {
        const text = elements.sqlInput.value;
        const highlighted = highlightSQL(text);
        const codeEl = elements.syntaxHighlight.querySelector('code');
        codeEl.innerHTML = highlighted;
    }

    // Simple Regex-based SQL highlighter for display
    function highlightSQL(text) {
        if (!text) return '';
        
        // Escape HTML first
        let html = escapeHtml(text);
        
        // Define patterns
        const patterns = [
             // Strings: single quotes
            { regex: /'[^']*'/g, cls: 'hl-string' },
            { regex: /`[^`]*`/g, cls: 'hl-string' },
             // Numbers
            { regex: /\b\d+(\.\d+)?\b/g, cls: 'hl-number' },
             // Keywords (case insensitive matching, but we need to match regex carefully)
             // We'll replace keywords with uppercase for standard matches or use case-insensitive regex flag
            { regex: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|INTO|VALUES|SET|AND|OR|NOT|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|DISTINCT|UNION|ALL|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|CASE|WHEN|THEN|ELSE|END|VIEW|TRIGGER|PROCEDURE|FUNCTION|DATABASE|GRANT|REVOKE)\b/gi, cls: 'hl-keyword' },
            // Functions
            { regex: /\b(COUNT|SUM|AVG|MAX|MIN|NOW|DATE|CONCAT|SUBSTRING|LENGTH|UPPER|LOWER|COALESCE)\b/gi, cls: 'hl-function' },
            // Comments (--)
            { regex: /--.*$/gm, cls: 'hl-comment' },
            // Comments (/* */)
            { regex: /\/\*[\s\S]*?\*\//g, cls: 'hl-comment' }
        ];

        // To apply highlighting correctly without messing up previous tags, we have to be careful.
        // A simple approach tokenizes. A robust one parses. 
        // For this lightweight tool, we can use a tokenizing loop or "replace" carefully.
        // However, regex replacement on HTML string is flaky. 
        // Let's stick to a simpler "tokenize and highlight" approach or multiple passes if we accept some risk.
        // Given complexity, let's try a safe tokenization approach: split by delimiters and check types.
        
        return tokenizeAndHighlight(text);
    }
    
    function tokenizeAndHighlight(text) {
        // Simple tokenizer
        let result = '';
        let i = 0;
        const len = text.length;
        
        while (i < len) {
            const char = text[i];
            
            // Strings
            if (char === "'" || char === '`') {
                let str = char;
                i++;
                while (i < len) {
                    str += text[i];
                    if (text[i] === char && text[i-1] !== '\\') {
                        i++;
                        break;
                    }
                    i++;
                }
                result += `<span class="hl-string">${escapeHtml(str)}</span>`;
                continue;
            }
            
            // Comments --
            if (char === '-' && text[i+1] === '-') {
                let comment = '';
                while (i < len && text[i] !== '\n') {
                    comment += text[i];
                    i++;
                }
                result += `<span class="hl-comment">${escapeHtml(comment)}</span>`;
                continue;
            }
            
             // Comments /**/
             if (char === '/' && text[i+1] === '*') {
                 let comment = '/*';
                 i+=2;
                 while (i < len) {
                     comment += text[i];
                     if (text[i] === '*' && text[i+1] === '/') {
                         comment += '/';
                         i+=2; // skip / and * and next char? no, skip * and / which are next 2. 
                         // current is *. next is /. so i += 2 moves past /? 
                         // wait: at *, i points to *. text[i+1] is /. 
                         // comment += text[i] adds *. loop continues.
                         // Let's simplify:
                         break;
                     }
                     i++;
                 }
                 // Actually the loop above adds char then checks.
                 // Let's rewrite loop for clarity
                 // i is at first char of comment content
                 while(i < len) {
                     if (text[i] === '*' && text[i+1] === '/') {
                         comment += '*/';
                         i += 2;
                         break;
                     }
                     comment += text[i];
                     i++;
                 }
                 result += `<span class="hl-comment">${escapeHtml(comment)}</span>`;
                 continue;
             }
             
             // Numbers
             if (/\d/.test(char)) {
                 let num = '';
                 while (i < len && /[\d\.]/.test(text[i])) {
                     num += text[i];
                     i++;
                 }
                 result += `<span class="hl-number">${num}</span>`;
                 continue;
             }
             
             // Words (Keywords/Functions/Identifiers)
             if (/[a-zA-Z_]/.test(char)) {
                 let word = '';
                 while (i < len && /[a-zA-Z0-9_]/.test(text[i])) {
                     word += text[i];
                     i++;
                 }
                 
                 const upper = word.toUpperCase();
                 if (KEYWORDS.has(upper)) {
                     result += `<span class="hl-keyword">${escapeHtml(word)}</span>`;
                 } else if (FUNCTIONS.has(upper)) {
                     result += `<span class="hl-function">${escapeHtml(word)}</span>`;
                 } else {
                     result += escapeHtml(word);
                 }
                 continue;
             }
             
             // Punctuation/Operators
             if ('(),;.*=<>!+-/%'.includes(char)) {
                 result += `<span class="hl-punctuation">${escapeHtml(char)}</span>`;
                 i++;
                 continue;
             }
             
             // Whitespace & others
             result += escapeHtml(char);
             i++;
        }
        
        return result;
    }

    const KEYWORDS = new Set(['SELECT','FROM','WHERE','INSERT','UPDATE','DELETE','CREATE','DROP','ALTER','TABLE','INDEX','INTO','VALUES','SET','AND','OR','NOT','NULL','ORDER','BY','GROUP','HAVING','LIMIT','OFFSET','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AS','DISTINCT','UNION','ALL','PRIMARY','KEY','FOREIGN','REFERENCES','DEFAULT','CASE','WHEN','THEN','ELSE','END','VIEW','TRIGGER','PROCEDURE','FUNCTION','DATABASE','GRANT','REVOKE']);
    const FUNCTIONS = new Set(['COUNT','SUM','AVG','MAX','MIN','NOW','DATE','CONCAT','SUBSTRING','LENGTH','UPPER','LOWER','COALESCE']);

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function syncScroll() {
        elements.lineNumbers.scrollTop = elements.sqlInput.scrollTop;
        elements.syntaxHighlight.scrollTop = elements.sqlInput.scrollTop;
        elements.syntaxHighlight.scrollLeft = elements.sqlInput.scrollLeft;
    }

    function updateCursorPosition() {
        const text = elements.sqlInput.value;
        const pos = elements.sqlInput.selectionStart;
        const lines = text.substr(0, pos).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        elements.status.cursorLine.textContent = line;
        elements.status.cursorCol.textContent = col;
    }

    // --- Actions ---

    function formatSQL() {
        const text = elements.sqlInput.value.trim();
        if (!text) return;

        try {
            // Using global sqlFormatter from CDN
            if (window.sqlFormatter) {
                const formatted = sqlFormatter.format(text, { language: 'sql', indent: '  ' });
                elements.sqlInput.value = formatted;
                updateLineNumbers();
                updateSyntaxHighlight();
                validateSQL();
            } else {
                console.error('sql-formatter library not loaded');
            }
        } catch (e) {
            console.error('Format error:', e);
            alert('Format error: ' + e.message);
        }
    }

    function compressSQL() {
        const text = elements.sqlInput.value.trim();
        if (!text) return;

        // Simple compression: remove comments and extra whitespace
        let compressed = text
            .replace(/--.*$/gm, '') // Remove -- comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();
            
        elements.sqlInput.value = compressed;
        updateLineNumbers();
        updateSyntaxHighlight();
    }

    // Custom Modal Logic
    function showConfirmModal(onConfirm) {
        const modal = document.getElementById('confirmModal');
        const cancelBtn = document.getElementById('modalCancel');
        const confirmBtn = document.getElementById('modalConfirm');

        function closeModal() {
            modal.classList.remove('active');
            cleanup();
        }

        function handleConfirm() {
            onConfirm();
            closeModal();
        }

        function cleanup() {
            cancelBtn.removeEventListener('click', closeModal);
            confirmBtn.removeEventListener('click', handleConfirm);
            modal.removeEventListener('click', handleOutsideClick);
        }

        function handleOutsideClick(e) {
            if (e.target === modal) {
                closeModal();
            }
        }

        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', handleConfirm);
        modal.addEventListener('click', handleOutsideClick);
        
        modal.classList.add('active');
    }

    function clearContent() {
        showConfirmModal(() => {
            elements.sqlInput.value = '';
            updateLineNumbers();
            updateSyntaxHighlight();
            elements.sqlInput.focus();
        });
    }

    function copyToClipboard() {
        elements.sqlInput.select();
        document.execCommand('copy');
        // Visual feedback
        const btn = elements.buttons.copy;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => btn.innerHTML = originalHtml, 2000);
    }

    init();
});
