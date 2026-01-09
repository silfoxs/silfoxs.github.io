/**
 * JSON Format Tool
 * Features: Text/Tree/Table views, Format/Compress, Search/Replace, Undo/Redo
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        container: document.querySelector('.json-tool-container'),
        jsonInput: document.getElementById('jsonInput'),
        syntaxHighlight: document.getElementById('syntaxHighlight'),
        lineNumbers: document.getElementById('lineNumbers'),
        lineNumbers: document.getElementById('lineNumbers'),
        views: {
            text: document.getElementById('textView'),
            tree: document.getElementById('treeView'),
            table: document.getElementById('tableView')
        },
        containers: {
            tree: document.getElementById('treeContainer'),
            table: document.getElementById('tableContainer')
        },
        buttons: {
            views: document.querySelectorAll('[data-view]'),
            expand: document.getElementById('expandAll'),
            collapse: document.getElementById('collapseAll'),
            format: document.getElementById('formatBtn'),
            compress: document.getElementById('compressBtn'),
            searchToggle: document.getElementById('searchToggle'),
            undo: document.getElementById('undoBtn'),
            redo: document.getElementById('redoBtn'),
            copy: document.getElementById('copyBtn'),
            clear: document.getElementById('clearBtn'),
            goToError: document.getElementById('goToError'),
            tryFix: document.getElementById('tryFix')
        },
        search: {
            bar: document.getElementById('searchBar'),
            input: document.getElementById('searchInput'),
            replace: document.getElementById('replaceInput'),
            count: document.getElementById('searchCount'),
            regex: document.getElementById('regexToggle'),
            case: document.getElementById('caseToggle'),
            prev: document.getElementById('prevMatch'),
            next: document.getElementById('nextMatch'),
            replaceOne: document.getElementById('replaceOne'),
            replaceAll: document.getElementById('replaceAll'),
            close: document.getElementById('searchClose')
        },
        status: {
            cursorLine: document.getElementById('cursorLine'),
            cursorCol: document.getElementById('cursorCol'),
            jsonStats: document.getElementById('jsonStats'),
            jsonStatus: document.getElementById('jsonStatus')
        },
        error: {
            bar: document.getElementById('errorBar'),
            message: document.getElementById('errorMessage'),
            position: document.getElementById('errorPosition')
        }
    };

    // State
    const state = {
        currentView: 'text',
        history: [],
        historyIndex: -1,
        searchQuery: '',
        replaceQuery: '',
        searchOptions: {
            regex: false,
            caseSensitive: false
        },
        matches: [],
        currentMatchIndex: -1,
        error: null,
        foldedLines: new Set(), // Track folded line indices
        foldRanges: new Map(), // Map of line index to fold end index
        foldBrackets: new Map(), // Map of line index to bracket type ('{' or '[')
        originalContent: '' // Store original content for unfolding
    };

    // --- Initialization ---

    function init() {
        bindEvents();
        updateLineNumbers();
        updateSyntaxHighlight();
        saveHistory(); // Initial state
        elements.jsonInput.focus();
    }

    function bindEvents() {
        // Input handling
        elements.jsonInput.addEventListener('input', () => {
            updateSyntaxHighlight();
            updateLineNumbers();
            validateJSON();
            debounce(saveHistory, 500)();
        });
        
        elements.jsonInput.addEventListener('scroll', syncScroll);
        elements.jsonInput.addEventListener('keydown', handleKeydown);
        elements.jsonInput.addEventListener('click', updateCursorPosition);
        elements.jsonInput.addEventListener('keyup', updateCursorPosition);

        // View switching
        elements.buttons.views.forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.dataset.view));
        });

        // Toolbar actions
        elements.buttons.format.addEventListener('click', formatJSON);
        elements.buttons.compress.addEventListener('click', compressJSON);
        elements.buttons.copy.addEventListener('click', copyToClipboard);
        elements.buttons.clear.addEventListener('click', clearContent);
        elements.buttons.undo.addEventListener('click', undo);
        elements.buttons.redo.addEventListener('click', redo);
        
        // Expand/Collapse actions (works for both text and tree views)
        elements.buttons.expand.addEventListener('click', () => expandCollapseAll(true));
        elements.buttons.collapse.addEventListener('click', () => expandCollapseAll(false));

        // Search actions
        elements.buttons.searchToggle.addEventListener('click', toggleSearchBar);
        elements.search.close.addEventListener('click', toggleSearchBar);
        elements.search.regex.addEventListener('click', () => toggleSearchOption('regex'));
        elements.search.case.addEventListener('click', () => toggleSearchOption('caseSensitive'));
        elements.search.input.addEventListener('input', handleSearchInput);
        elements.search.prev.addEventListener('click', () => navigateMatch(-1));
        elements.search.next.addEventListener('click', () => navigateMatch(1));
        elements.search.replaceOne.addEventListener('click', replaceOne);
        elements.search.replaceAll.addEventListener('click', replaceAll);

        // Error actions
        elements.buttons.goToError.addEventListener('click', scrollToError);
        elements.buttons.tryFix.addEventListener('click', tryFixJSON);

        // Fold icon clicks (using event delegation)
        elements.lineNumbers.addEventListener('click', (e) => {
            if (e.target.classList.contains('fold-icon')) {
                e.stopPropagation();
                const lineSpan = e.target.closest('.line-number');
                if (lineSpan) {
                    const lineIdx = parseInt(lineSpan.dataset.line);
                    toggleFold(lineIdx);
                }
            }
        });

        // Click anywhere in text view to focus input
        elements.views.text.addEventListener('click', (e) => {
            if (e.target !== elements.jsonInput) {
                elements.jsonInput.focus();
            }
        });
    }

    // --- Core Editor Functions ---

    function updateLineNumbers() {
        const text = elements.jsonInput.value;
        const lines = text.split('\n');
        const foldInfo = findFoldableLines(text);
        
        // Update fold ranges in state
        state.foldRanges = foldInfo.ranges;
        state.foldBrackets = foldInfo.brackets;
        
        elements.lineNumbers.innerHTML = lines.map((_, i) => {
            const lineNum = i + 1;
            const isFoldable = foldInfo.foldable.has(i);
            const isFolded = state.foldedLines.has(i);
            const iconClass = isFolded ? 'fa-caret-right' : 'fa-caret-down';
            const classes = isFoldable ? 'line-number foldable' : 'line-number';
            // Always include fold icon for consistent spacing; CSS handles visibility
            const icon = `<i class="fas ${iconClass} fold-icon"></i>`;
            return `<span class="${classes}" data-line="${i}"><span class="line-num-text">${lineNum}</span>${icon}</span>`;
        }).join('');
    }
    
    function findFoldableLines(text) {
        const lines = text.split('\n');
        const foldable = new Set();
        const ranges = new Map(); // lineIndex -> endLineIndex
        const brackets = new Map(); // lineIndex -> bracket type ('{' or '[')
        
        // Track bracket matching to find fold ranges
        const bracketStack = []; // {char, lineIdx}
        
        lines.forEach((line, idx) => {
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '{' || char === '[') {
                    bracketStack.push({ char, lineIdx: idx, charIdx: i });
                } else if (char === '}' || char === ']') {
                    const expected = char === '}' ? '{' : '[';
                    if (bracketStack.length > 0 && bracketStack[bracketStack.length - 1].char === expected) {
                        const opening = bracketStack.pop();
                        // Only mark as foldable if spans multiple lines
                        if (idx > opening.lineIdx) {
                            foldable.add(opening.lineIdx);
                            ranges.set(opening.lineIdx, idx);
                            brackets.set(opening.lineIdx, opening.char);
                        }
                    }
                }
            }
        });
        
        return { foldable, ranges, brackets };
    }
    
    function toggleFold(lineIdx) {
        const endLine = state.foldRanges.get(lineIdx);
        if (endLine === undefined) return;
        
        const icon = elements.lineNumbers.querySelector(`[data-line="${lineIdx}"] .fold-icon`);
        const isFolded = state.foldedLines.has(lineIdx);
        
        if (isFolded) {
            // Unfold
            state.foldedLines.delete(lineIdx);
            if (icon) {
                icon.classList.remove('fa-caret-right');
                icon.classList.add('fa-caret-down');
            }
        } else {
            // Fold
            state.foldedLines.add(lineIdx);
            if (icon) {
                icon.classList.remove('fa-caret-down');
                icon.classList.add('fa-caret-right');
            }
        }
        
        // Update visual display of folded lines
        updateFoldedDisplay();
    }
    
    function updateFoldedDisplay() {
        const lineSpans = elements.lineNumbers.querySelectorAll('.line-number');
        const hiddenLines = new Set();
        const foldedStartLines = new Map(); // Map of folded start line -> bracket type
        
        // Calculate which lines should be hidden
        state.foldedLines.forEach(foldedIdx => {
            const endLine = state.foldRanges.get(foldedIdx);
            if (endLine !== undefined) {
                for (let i = foldedIdx + 1; i <= endLine; i++) {
                    hiddenLines.add(i);
                }
                foldedStartLines.set(foldedIdx, state.foldBrackets?.get(foldedIdx) || '{');
            }
        });
        
        // Update line number visibility
        lineSpans.forEach(span => {
            const lineIdx = parseInt(span.dataset.line);
            if (hiddenLines.has(lineIdx)) {
                span.style.display = 'none';
            } else {
                span.style.display = '';
            }
        });
        
        // Update syntax highlight display with fold placeholders
        const text = elements.jsonInput.value;
        const lines = text.split('\n');
        const displayLines = [];
        
        for (let idx = 0; idx < lines.length; idx++) {
            if (hiddenLines.has(idx)) {
                continue; // Skip hidden lines
            }
            
            let line = lines[idx];
            // If this is a folded start line, append {...} or [...]
            if (foldedStartLines.has(idx)) {
                const bracket = foldedStartLines.get(idx);
                const placeholder = bracket === '[' ? '...]' : '...}';
                // Trim trailing whitespace and add placeholder
                line = line.trimEnd() + placeholder;
            }
            displayLines.push(line);
        }
        
        const highlightedVisible = highlightJSON(displayLines.join('\n'));
        const codeEl = elements.syntaxHighlight.querySelector('code');
        codeEl.style.margin = '0';
        codeEl.style.padding = '0';
        codeEl.innerHTML = highlightedVisible;
    }
    
    function expandCollapseAll(expand) {
        if (state.currentView === 'tree') {
            // Tree view: toggle all .json-children visibility
            toggleTree(expand);
        } else {
            // Text view: expand/collapse all fold points
            if (expand) {
                // Unfold all
                state.foldedLines.clear();
            } else {
                // Fold all foldable lines
                state.foldRanges.forEach((endLine, startLine) => {
                    state.foldedLines.add(startLine);
                });
            }
            updateLineNumbers();
            updateFoldedDisplay();
        }
    }
    
    function updateSyntaxHighlight() {
        const text = elements.jsonInput.value;
        const highlighted = highlightJSON(text);
        const codeEl = elements.syntaxHighlight.querySelector('code');
        // Reset any default margins/padding that can cause line misalignment
        codeEl.style.margin = '0';
        codeEl.style.padding = '0';
        codeEl.innerHTML = highlighted;
    }
    
    function highlightJSON(text) {
        if (!text) return '';
        
        let result = '';
        let i = 0;
        const len = text.length;
        let bracketDepth = 0;
        
        try {
            while (i < len) {
                const char = text[i];
                
                // Handle strings
                if (char === '"') {
                    let str = '"';
                    i++;
                    while (i < len) {
                        if (text[i] === '"' && text[i-1] !== '\\') { // Simple end check
                             break;
                        }
                        if (text[i] === '"' && text[i-1] === '\\' && text[i-2] === '\\') { // Escaped backslash then quote
                             break;
                        }
                        str += text[i];
                        i++;
                    }
                    if (i < len) {
                        str += '"';
                        i++;
                    }
                    
                    // Check if it's a key (followed by :)
                    let j = i;
                    let isKey = false;
                    while (j < len) {
                        const nextChar = text[j];
                        if (/\s/.test(nextChar)) {
                            j++;
                            continue;
                        }
                        if (nextChar === ':') {
                            isKey = true;
                        }
                        break;
                    }
                    
                    const cls = isKey ? 'hl-key' : 'hl-string';
                    result += `<span class="${cls}">${escapeHtmlLight(str)}</span>`;
                    continue;
                }
                
                // Handle numbers
                if (/[0-9\-]/.test(char)) {
                    let num = '';
                    while (i < len && /[0-9\.\-eE\+]/.test(text[i])) {
                        num += text[i];
                        i++;
                    }
                    result += `<span class="hl-number">${num}</span>`;
                    continue;
                }
                
                // Handle keywords
                if (/[tfn]/.test(char)) {
                    if (text.startsWith('true', i)) {
                        result += '<span class="hl-boolean">true</span>';
                        i += 4;
                        continue;
                    }
                    if (text.startsWith('false', i)) {
                        result += '<span class="hl-boolean">false</span>';
                        i += 5;
                        continue;
                    }
                    if (text.startsWith('null', i)) {
                        result += '<span class="hl-null">null</span>';
                        i += 4;
                        continue;
                    }
                }
                
                // Handle punctuation
                if ('{}[]:,'.includes(char)) {
                    let cls = '';
                    if (char === ':' || char === ',') {
                        cls = char === ':' ? 'hl-colon' : 'hl-comma';
                    } else {
                        // Brackets
                        if (char === '{' || char === '[') {
                            cls = `hl-bracket hl-bracket-${bracketDepth % 4}`;
                            bracketDepth++;
                        } else {
                            // Closing bracket, decrement depth first
                            bracketDepth = Math.max(0, bracketDepth - 1);
                            cls = `hl-bracket hl-bracket-${bracketDepth % 4}`;
                        }
                    }
                    result += `<span class="${cls}">${char}</span>`;
                    i++;
                    continue;
                }
                
                // Default: just append
                result += escapeHtmlLight(char);
                i++;
            }
        } catch (e) {
            console.error('Highlight error:', e);
            // Fallback to plain text if highlighting fails
            return escapeHtmlLight(text);
        }
        
        return result;
    }
    
    // Light HTML escaping that only escapes < and > to prevent HTML injection
    // but preserves other characters for correct visual alignment
    function escapeHtmlLight(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function syncScroll() {
        elements.lineNumbers.scrollTop = elements.jsonInput.scrollTop;
        elements.syntaxHighlight.scrollTop = elements.jsonInput.scrollTop;
        elements.syntaxHighlight.scrollLeft = elements.jsonInput.scrollLeft;
        elements.errorMarkers.style.transform = `translateY(-${elements.jsonInput.scrollTop}px)`;
    }

    function updateCursorPosition() {
        const text = elements.jsonInput.value;
        const pos = elements.jsonInput.selectionStart;
        const lines = text.substr(0, pos).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        elements.status.cursorLine.textContent = line;
        elements.status.cursorCol.textContent = col;
    }

    function validateJSON() {
        const text = elements.jsonInput.value.trim();
        
        // Always reset error state first
        // Always reset error state first
        const pErr = elements.lineNumbers.querySelector('.line-number.error');
        if (pErr) pErr.classList.remove('error');
        
        elements.error.bar.classList.remove('active');
        state.error = null;
        
        if (!text) {
            updateStatus('empty');
            return null;
        }

        try {
            const data = JSON.parse(text);
            updateStatus('valid', data);
            return data;
        } catch (e) {
            handleError(e, text);
            return null;
        }
    }

    function handleError(e, text) {
        state.error = e;
        updateStatus('invalid');

        // Parse error message for position
        const match = e.message.match(/at position (\d+)/);
        let pos = match ? parseInt(match[1]) : 0;
        
        // Calculate line and column
        const lines = text.substr(0, pos).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        // Show error bar
        elements.error.message.textContent = e.message;
        elements.error.position.textContent = `(Line ${line}, Col ${col})`;
        elements.error.bar.classList.add('active');

        // Highlight line number
        const lineEl = elements.lineNumbers.querySelector(`[data-line="${line - 1}"]`);
        if (lineEl) {
            lineEl.classList.add('error');
        }
    }

    function updateStatus(type, data) {
        const statusEl = elements.status.jsonStatus;
        const statsEl = elements.status.jsonStats;

        if (type === 'valid') {
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> <span>Valid JSON</span>';
            statusEl.className = 'json-status valid';
            
            // Calc stats
            try {
                if (data && typeof data === 'object') {
                    const size = new Blob([JSON.stringify(data)]).size;
                    const items = Array.isArray(data) ? data.length : Object.keys(data).length;
                    statsEl.textContent = `${formatSize(size)} • ${items} items`;
                } else {
                    statsEl.textContent = 'Primitive Value';
                }
            } catch (e) {
                console.warn('Stats calc error:', e);
                statsEl.textContent = '';
            }
        } else if (type === 'invalid') {
            statusEl.innerHTML = '<i class="fas fa-times-circle"></i> <span>Invalid JSON</span>';
            statusEl.className = 'json-status invalid';
            statsEl.textContent = '';
        } else {
            statusEl.innerHTML = '';
            statsEl.textContent = '';
        }
    }

    // --- View Handling ---

    function switchView(view) {
        // Update UI
        elements.buttons.views.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        Object.values(elements.views).forEach(el => el.classList.remove('active'));
        elements.views[view].classList.add('active');
        state.currentView = view;

        // Render content
        if (view !== 'text') {
            const data = validateJSON();
            if (data) {
                if (view === 'tree') renderTree(data);
                if (view === 'table') renderTable(data);
            } else {
                // If invalid, show error
                const container = elements.containers[view];
                container.innerHTML = '<div style="color:var(--monokai-red);padding:20px;">Invalid JSON. Please fix errors in Text view.</div>';
            }
        }
    }

    // --- Tree Renderer ---
    function renderTree(data) {
        elements.containers.tree.innerHTML = `<div class="json-tree">${buildTreeHTML(data)}</div>`;
        
        // Add click listeners for folding
        elements.containers.tree.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('json-toggle') || target.classList.contains('json-key')) {
                const node = target.closest('.json-node');
                const children = node.querySelector('.json-children');
                if (children) {
                    const isCollapsed = children.style.display === 'none';
                    children.style.display = isCollapsed ? 'block' : 'none';
                    
                    // Update icon state
                    const icon = node.querySelector('.json-toggle');
                    if (icon) {
                        icon.classList.toggle('expanded', isCollapsed);
                    }
                }
            }
        });
    }

    function buildTreeHTML(data) {
        if (data === null) return '<span class="json-null">null</span>';
        if (typeof data === 'boolean') return `<span class="json-boolean">${data}</span>`;
        if (typeof data === 'number') return `<span class="json-number">${data}</span>`;
        if (typeof data === 'string') return `<span class="json-string">"${escapeHtml(data)}"</span>`;

        const isArray = Array.isArray(data);
        const keys = Object.keys(data);
        
        // Empty object/array
        if (keys.length === 0) {
            return `<span class="json-bracket">${isArray ? '[]' : '{}'}</span>`;
        }

        let startBracket = `<span class="json-bracket">${isArray ? '[' : '{'}</span>`;
        let endBracket = `<span class="json-bracket">${isArray ? ']' : '}'}</span>`;
        
        let childrenHtml = `<div class="json-children">`;
        
        keys.forEach((key, index) => {
            const value = data[key];
            const isLast = index === keys.length - 1;
            const isComplex = value !== null && typeof value === 'object' && Object.keys(value).length > 0;
            
            childrenHtml += `<div class="json-node">`;
            
            // Icon
            if (isComplex) {
                childrenHtml += `<i class="fas fa-caret-right json-toggle expanded"></i>`;
            } else {
                childrenHtml += `<i class="json-toggle invisible"></i>`;
            }
            
            // Key
            if (!isArray) {
                childrenHtml += `<span class="json-key">"${key}"</span><span class="json-colon">:</span>`;
            }
            
            // Value
            childrenHtml += buildTreeHTML(value);
            
            // Comma
            if (!isLast) childrenHtml += `<span class="json-comma">,</span>`;
            
            childrenHtml += `</div>`;
        });
        
        childrenHtml += `</div>`;
        
        return startBracket + childrenHtml + endBracket;
    }

    // Wrap the initial call to handle the ROOT object not having a key/icon?
    // The Root object is usually just displayed.
    // If I use the above buildTreeHTML, the root will be:
    // { <children> }
    // The children contain the nodes with icons.
    // This is correct. The root itself is usually explicitly expanded or just the container.

    function toggleTree(expand) {
        const children = elements.containers.tree.querySelectorAll('.json-children');
        children.forEach(el => el.style.display = expand ? 'block' : 'none');
        
        const icons = elements.containers.tree.querySelectorAll('.json-toggle');
        icons.forEach(icon => {
            if (!icon.classList.contains('invisible')) {
                icon.classList.toggle('expanded', expand);
            }
        });
    }

    // --- Table Renderer ---
    function renderTable(data) {
        if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
            elements.containers.table.innerHTML = '<div style="padding:20px;">Table view only supports Arrays of Objects.</div>';
            return;
        }

        const headers = new Set();
        data.forEach(item => Object.keys(item).forEach(k => headers.add(k)));
        const headerArray = Array.from(headers);

        let html = '<table class="json-table" style="width:100%; border-collapse:collapse; color:var(--monokai-fg);">';
        // Header
        html += '<thead><tr style="border-bottom:1px solid var(--glass-border); text-align:left;">';
        headerArray.forEach(k => html += `<th style="padding:10px; color:var(--monokai-blue);">${k}</th>`);
        html += '</tr></thead>';
        
        // Body
        html += '<tbody>';
        data.forEach((item, i) => {
            html += `<tr style="background:${i%2===0 ? 'rgba(255,255,255,0.02)':'transparent'}">`;
            headerArray.forEach(k => {
                const val = item[k];
                const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                html += `<td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">${escapeHtml(str)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        elements.containers.table.innerHTML = html;
    }

    // --- Actions ---

    function formatJSON() {
        const data = validateJSON();
        if (data) {
            elements.jsonInput.value = JSON.stringify(data, null, 2);
            saveHistory();
            updateLineNumbers();
            updateSyntaxHighlight();
        }
    }

    function compressJSON() {
        const data = validateJSON();
        if (data) {
            elements.jsonInput.value = JSON.stringify(data);
            saveHistory();
            updateLineNumbers();
            updateSyntaxHighlight();
        }
    }

    function clearContent() {
        if (confirm('Are you sure you want to clear everything?')) {
            elements.jsonInput.value = '';
            updateLineNumbers();
            validateJSON();
            saveHistory();
        }
    }

    function copyToClipboard() {
        elements.jsonInput.select();
        document.execCommand('copy');
        // Toast?
        const originalIcon = elements.buttons.copy.innerHTML;
        elements.buttons.copy.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => elements.buttons.copy.innerHTML = originalIcon, 2000);
    }

    function tryFixJSON() {
        let text = elements.jsonInput.value.trim();
        
        // Step 1: Add quotes to unquoted keys (e.g., {key: "value"} -> {"key": "value"})
        text = text.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
        
        // Step 2: Remove trailing commas before closing brackets/braces
        text = text.replace(/,(\s*[\]}])/g, '$1');
        
        // Step 3: Add missing commas between adjacent values
        // Between }" and " (object followed by string)
        text = text.replace(/}(\s*)"(?!")/g, '},$1"');
        // Between ]" and " (array followed by string)
        text = text.replace(/](\s*)"(?!")/g, '],$1"');
        // Between }" and { (object followed by object)
        text = text.replace(/}(\s*){/g, '},$1{');
        // Between ]{ and { (array followed by object)
        text = text.replace(/](\s*){/g, '],$1{');
        // Between }" and [ (object followed by array)
        text = text.replace(/}(\s*)\[/g, '},$1[');
        // Between ]] and [ (array followed by array)
        text = text.replace(/](\s*)\[/g, '],$1[');
        // Between "value"newline"value"
        text = text.replace(/"(\s*\n\s*)"(?!")/g, '",$1"');
        // Between number and string/object/array
        text = text.replace(/(\d)(\s+)(["{\[])/g, '$1,$2$3');
        // Between string and number
        text = text.replace(/"(\s+)(\d)/g, '",$1$2');
        // Between boolean/null and other values
        text = text.replace(/(true|false|null)(\s+)(["{\[])/g, '$1,$2$3');
        text = text.replace(/"(\s+)(true|false|null)/g, '",$1$2');
        
        // Step 4: Fix common bracket/brace mismatches by attempting to balance
        const stack = [];
        let fixed = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '{' || char === '[') {
                stack.push(char);
                fixed += char;
            } else if (char === '}' || char === ']') {
                const expected = char === '}' ? '{' : '[';
                if (stack.length > 0 && stack[stack.length - 1] === expected) {
                    stack.pop();
                    fixed += char;
                } else {
                    // Skip mismatched closing bracket
                    continue;
                }
            } else {
                fixed += char;
            }
        }
        
        // Add missing closing brackets
        while (stack.length > 0) {
            const open = stack.pop();
            fixed += open === '{' ? '}' : ']';
        }
        
        elements.jsonInput.value = fixed;
        validateJSON();
        updateLineNumbers();
        updateSyntaxHighlight();
        saveHistory();
    }

    function scrollToError() {
        const errorLine = elements.lineNumbers.querySelector('.line-number.error');
        if (errorLine) {
            const lineIdx = parseInt(errorLine.dataset.line);
            // Height is 21px per line
            const top = lineIdx * 21;
            elements.jsonInput.scrollTop = top - 100;
        }
    }

    // --- Search & Replace ---

    function toggleSearchBar() {
        elements.search.bar.classList.toggle('active');
        elements.container.classList.toggle('search-active', elements.search.bar.classList.contains('active'));
        if (elements.search.bar.classList.contains('active')) {
            elements.search.input.focus();
        }
    }

    function toggleSearchOption(opt) {
        state.searchOptions[opt] = !state.searchOptions[opt];
        const btn = opt === 'regex' ? elements.search.regex : elements.search.case;
        btn.classList.toggle('active');
        performSearch(); // Re-search
    }

    function handleSearchInput() {
        state.searchQuery = elements.search.input.value;
        debounce(performSearch, 300)();
    }

    function performSearch() {
        const query = state.searchQuery;
        if (!query) {
            state.matches = [];
            state.currentMatchIndex = -1;
            updateSearchUI();
            return;
        }

        const text = elements.jsonInput.value;
        const flags = state.searchOptions.caseSensitive ? 'g' : 'gi';
        state.matches = [];

        try {
            let regex;
            if (state.searchOptions.regex) {
                regex = new RegExp(query, flags);
            } else {
                // Escape special chars for literal search
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                regex = new RegExp(escaped, flags);
            }

            let match;
            while ((match = regex.exec(text)) !== null) {
                state.matches.push({
                    start: match.index,
                    end: match.index + match[0].length
                });
            }
        } catch (e) {
            // Invalid regex
            console.warn('Invalid Regex', e);
        }

        state.currentMatchIndex = state.matches.length > 0 ? 0 : -1;
        updateSearchUI();
        highlightMatches();
    }

    function updateSearchUI() {
        const count = state.matches.length;
        const current = state.currentMatchIndex + 1;
        elements.search.count.textContent = count > 0 ? `${current}/${count}` : '0/0';
    }

    function navigateMatch(dir) {
        if (state.matches.length === 0) return;
        state.currentMatchIndex = (state.currentMatchIndex + dir + state.matches.length) % state.matches.length;
        updateSearchUI();
        scrollToMatch(state.matches[state.currentMatchIndex]);
    }

    function scrollToMatch(match) {
        const text = elements.jsonInput.value;
        // Very basic scroll logic
        const lines = text.substr(0, match.start).split('\n');
        const lineVal = lines.length;
        const top = (lineVal - 1) * 21; // approx
        elements.jsonInput.scrollTop = top - 100;
        
        elements.jsonInput.setSelectionRange(match.start, match.end);
        elements.jsonInput.focus();
    }

    function highlightMatches() {
        // Since we use textarea, we can't do rich highlighting easily within it.
        // We rely on selection and native find for now, or just jumping.
        // For a full highlighter, we'd need a custom editor (like CodeMirror).
        // Here we just navigate.
        if (state.matches.length > 0) {
            scrollToMatch(state.matches[state.currentMatchIndex]);
        }
    }

    function replaceOne() {
        if (state.currentMatchIndex === -1) return;
        
        const match = state.matches[state.currentMatchIndex];
        const text = elements.jsonInput.value;
        const replacement = elements.search.replace.value;
        
        const newText = text.substring(0, match.start) + replacement + text.substring(match.end);
        elements.jsonInput.value = newText;
        
        saveHistory();
        performSearch(); // Refresh matches
    }

    function replaceAll() {
        if (state.matches.length === 0) return;
        
        const text = elements.jsonInput.value;
        const replacement = elements.search.replace.value;
        const query = state.searchQuery;
        const flags = state.searchOptions.caseSensitive ? 'g' : 'gi';

        let regex;
        if (state.searchOptions.regex) {
            regex = new RegExp(query, flags);
        } else {
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            regex = new RegExp(escaped, flags);
        }

        elements.jsonInput.value = text.replace(regex, replacement);
        saveHistory();
        performSearch();
    }

    // --- History (Undo/Redo) ---
    function saveHistory() {
        const current = elements.jsonInput.value;
        // Avoid dups
        if (state.historyIndex >= 0 && state.history[state.historyIndex] === current) return;

        // Cut off future if we were in middle
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(current);
        state.historyIndex++;
        
        // Limit history size
        if (state.history.length > 50) {
            state.history.shift();
            state.historyIndex--;
        }

        updateUndoRedoButtons();
    }

    function undo() {
        if (state.historyIndex > 0) {
            state.historyIndex--;
            elements.jsonInput.value = state.history[state.historyIndex];
            updateLineNumbers();
            updateSyntaxHighlight();
            validateJSON();
            updateUndoRedoButtons();
        }
    }

    function redo() {
        if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            elements.jsonInput.value = state.history[state.historyIndex];
            updateLineNumbers();
            updateSyntaxHighlight();
            validateJSON();
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        elements.buttons.undo.disabled = state.historyIndex <= 0;
        elements.buttons.redo.disabled = state.historyIndex >= state.history.length - 1;
    }

    // --- Helpers ---

    function handleKeydown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 2;
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Start
    init();
});
