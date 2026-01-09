document.addEventListener('DOMContentLoaded', function() {
    // Set random background image
    const bgLayer = document.getElementById('bgLayer');
    if (bgLayer) {
        const imageIndex = Math.floor(Math.random() * 24); // 0-23
        bgLayer.style.backgroundImage = `url('/medias/featureimages/${imageIndex}.jpg')`;
    }

    // Elements
    const timestampInput = document.getElementById('timestampInput');
    const datetimeInput = document.getElementById('datetimeInput');
    const toTimeBtn = document.getElementById('toTimeBtn');
    const toTimestampBtn = document.getElementById('toTimestampBtn');
    const clearTimestampBtn = document.getElementById('clearTimestampBtn');
    const clearDatetimeBtn = document.getElementById('clearDatetimeBtn');
    const toast = document.getElementById('toast');
    
    // Custom Date Picker Elements
    const pickerBtn = document.getElementById('pickerBtn');
    const datePopover = document.getElementById('datePopover');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const currentMonthDisplay = document.getElementById('currentMonthDisplay');
    const calendarGrid = document.getElementById('calendarGrid');
    const timeHour = document.getElementById('timeHour');
    const timeMinute = document.getElementById('timeMinute');
    const timeSecond = document.getElementById('timeSecond');

    // Timezone Elements
    const chinaTimeEl = document.getElementById('chinaTime');
    const usaTimeEl = document.getElementById('usaTime');
    const ukTimeEl = document.getElementById('ukTime');

    // Code Placeholders
    const tsPlaceholders = document.querySelectorAll('.ts-placeholder');
    const dtPlaceholders = document.querySelectorAll('.dt-placeholder');

    // State
    let currentDate = new Date(); // The source of truth
    let viewDate = new Date(); // For calendar navigation

    // Initial State
    initNow();
    
    // --- Event Listeners ---

    // 1. Convert Timestamp to Time
    toTimeBtn.addEventListener('click', function() {
        let ts = timestampInput.value.trim();
        if (!ts) {
            initNow();
            showToast('已显示当前时间', 'success');
            return;
        }

        if (ts.length === 13) {
             ts = Math.floor(parseInt(ts) / 1000);
             timestampInput.value = ts;
             showToast('已自动转换为秒级时间戳', 'success');
        }

        const date = new Date(ts * 1000);
        if (isNaN(date.getTime())) {
            showToast('无效的时间戳格式', 'error');
            return;
        }

        updateAllFromDate(date);
        showToast('转换成功', 'success');
    });

    // 2. Convert Time to Timestamp
    toTimestampBtn.addEventListener('click', function() {
        const dtStr = datetimeInput.value.trim();
        if (!dtStr) {
            initNow();
            showToast('已显示当前时间', 'success');
            return;
        }

        const date = new Date(dtStr);
        if (isNaN(date.getTime())) {
            showToast('无效的时间格式 (YYYY-MM-DD HH:mm:ss)', 'error');
            return;
        }

        updateAllFromDate(date);
        showToast('转换成功', 'success');
    });

    // 3. Clear Buttons
    clearTimestampBtn.addEventListener('click', () => {
        timestampInput.value = '';
        timestampInput.focus();
    });

    clearDatetimeBtn.addEventListener('click', () => {
        datetimeInput.value = '';
        datetimeInput.focus();
    });

    // 4. Custom Date Picker Logic
    
    // Toggle Popover
    pickerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopover();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!datePopover.contains(e.target) && !pickerBtn.contains(e.target)) {
            datePopover.classList.remove('show');
        }
    });

    // Prevent closing when clicking inside popover
    datePopover.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Navigation
    prevMonthBtn.addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        renderCalendar();
    });

    // Time Inputs
    [timeHour, timeMinute, timeSecond].forEach(input => {
        input.addEventListener('change', updateTimeFromInputs);
        input.addEventListener('input', () => {
             // Optional: Limit input length
             if (input.value.length > 2) input.value = input.value.slice(0, 2);
        });
    });

    function updateTimeFromInputs() {
        let h = parseInt(timeHour.value) || 0;
        let m = parseInt(timeMinute.value) || 0;
        let s = parseInt(timeSecond.value) || 0;
        
        // Clamp values
        h = Math.max(0, Math.min(23, h));
        m = Math.max(0, Math.min(59, m));
        s = Math.max(0, Math.min(59, s));

        timeHour.value = String(h).padStart(2, '0');
        timeMinute.value = String(m).padStart(2, '0');
        timeSecond.value = String(s).padStart(2, '0');

        currentDate.setHours(h, m, s);
        updateAllFromDate(currentDate, false); // Don't re-render calendar fully, just inputs
    }

    // 5. Code Copy Buttons
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const codeBlock = document.getElementById(targetId);
            if (codeBlock) {
                copyToClipboard(codeBlock.innerText).then(() => {
                    showToast('代码已复制', 'success');
                    const icon = btn.querySelector('i');
                    icon.className = 'fas fa-check';
                    setTimeout(() => icon.className = 'fas fa-copy', 1500);
                });
            }
        });
    });

    // --- Helper Functions ---

    function initNow() {
        const now = new Date();
        updateAllFromDate(now);
    }

    function togglePopover() {
        const isShowing = datePopover.classList.contains('show');
        if (isShowing) {
            datePopover.classList.remove('show');
        } else {
            // Sync viewDate with currently selected date in input
            const dtStr = datetimeInput.value.trim();
            const date = new Date(dtStr);
            if (!isNaN(date.getTime())) {
                currentDate = date;
                viewDate = new Date(date);
            } else {
                currentDate = new Date();
                viewDate = new Date();
            }
            // Update time inputs
            timeHour.value = String(currentDate.getHours()).padStart(2, '0');
            timeMinute.value = String(currentDate.getMinutes()).padStart(2, '0');
            timeSecond.value = String(currentDate.getSeconds()).padStart(2, '0');
            
            renderCalendar();
            datePopover.classList.add('show');
        }
    }

    function renderCalendar() {
        // Update header
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        currentMonthDisplay.textContent = `${months[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

        // Clear grid
        calendarGrid.innerHTML = '';

        // Calculate days
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Prev Month Days
        for (let i = 0; i < firstDayOfMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day outside';
            dayDiv.textContent = daysInPrevMonth - firstDayOfMonth + 1 + i;
            dayDiv.addEventListener('click', () => {
                viewDate.setMonth(month - 1);
                currentDate.setFullYear(viewDate.getFullYear(), viewDate.getMonth(), daysInPrevMonth - firstDayOfMonth + 1 + i);
                updateAllFromDate(currentDate);
                renderCalendar(); // re-render needed because month changed
            });
            calendarGrid.appendChild(dayDiv);
        }

        // Current Month Days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = i;
            
            // Check if selected
            if (i === currentDate.getDate() && 
                month === currentDate.getMonth() && 
                year === currentDate.getFullYear()) {
                dayDiv.classList.add('selected');
            }

            // Check if today
            if (i === today.getDate() && 
                month === today.getMonth() && 
                year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }

            dayDiv.addEventListener('click', () => {
                currentDate.setFullYear(year, month, i);
                // Keep existing time
                updateAllFromDate(currentDate);
                // Refresh grid to show new selection
                renderCalendar();
            });
            calendarGrid.appendChild(dayDiv);
        }

        // Next Month Days (Fill up to 35 or 42 cells)
        const totalCells = firstDayOfMonth + daysInMonth;
        const nextMonthDays = totalCells > 35 ? 42 - totalCells : 35 - totalCells;
        
        for (let i = 1; i <= nextMonthDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day outside';
            dayDiv.textContent = i;
            dayDiv.addEventListener('click', () => {
                viewDate.setMonth(month + 1);
                currentDate.setFullYear(viewDate.getFullYear(), viewDate.getMonth(), i);
                updateAllFromDate(currentDate);
                renderCalendar();
            });
            calendarGrid.appendChild(dayDiv);
        }
    }

    function updateAllFromDate(date, updateTimeInputs = true) {
        currentDate = date; // Update global state
        
        // 1. Update Inputs
        const ts = Math.floor(date.getTime() / 1000);
        const dtStr = formatDate(date);
        
        timestampInput.value = ts;
        datetimeInput.value = dtStr;
        
        if (updateTimeInputs) {
            timeHour.value = String(date.getHours()).padStart(2, '0');
            timeMinute.value = String(date.getMinutes()).padStart(2, '0');
            timeSecond.value = String(date.getSeconds()).padStart(2, '0');
        }

        // 2. Update Timezones
        updateTimezones(date);

        // 3. Update Code Blocks
        updateCodeBlocks(ts, dtStr);
    }

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}:${s}`;
    }
    
    function updateTimezones(date) {
        // China (UTC+8)
        chinaTimeEl.textContent = date.toLocaleString('zh-CN', { 
            timeZone: 'Asia/Shanghai',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');

        // USA (New York UTC-5)
        usaTimeEl.textContent = date.toLocaleString('en-US', { 
            timeZone: 'America/New_York',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2'); 

        // UK (London UTC+0)
        ukTimeEl.textContent = date.toLocaleString('en-GB', { 
            timeZone: 'Europe/London',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }).replace(/\//g, '-').replace(',', '');
    }

    function updateCodeBlocks(ts, dtStr) {
        if (!ts) ts = Math.floor(Date.now() / 1000);
        if (!dtStr) dtStr = formatDate(new Date());

        tsPlaceholders.forEach(el => el.textContent = ts);
        dtPlaceholders.forEach(el => el.textContent = dtStr);
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }

    let toastTimeout;
    function showToast(msg, type = '') {
        toast.textContent = msg;
        toast.className = 'toast'; 
        if (type) toast.classList.add(type);
        toast.classList.add('show');
        
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
});
