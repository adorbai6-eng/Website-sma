// script.js
// AlgoViz Pro — Production Quality Vanilla JS Sorting Visualizer
// Built as a premium engineering portfolio piece

let array = [];
let originalArray = [];
let isSorting = false;
let isPaused = false;
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let currentTimeout = null;
let animationSpeed = 40;
let soundEnabled = true;
let singleMode = true;
let audioContext;

const barsContainer = document.getElementById('single-bars');
const compareBars1 = document.getElementById('compare-bars-1');
const compareBars2 = document.getElementById('compare-bars-2');

const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const algoSelect = document.getElementById('algo-select');
const singleAlgoTitle = document.getElementById('single-algo-title');

const generateBtn = document.getElementById('generate-btn');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const resetBtn = document.getElementById('reset-btn');

const themeToggle = document.getElementById('theme-toggle');
const singleModeBtn = document.getElementById('single-mode-btn');
const compareModeBtn = document.getElementById('compare-mode-btn');
const singleContainer = document.getElementById('single-container');
const compareContainer = document.getElementById('compare-container');
const soundBtn = document.getElementById('sound-btn');

const statComparisons = document.getElementById('stat-comparisons');
const statSwaps = document.getElementById('stat-swaps');
const statTime = document.getElementById('stat-time');

const complexityContent = document.getElementById('complexity-content');
const pseudocodeCode = document.getElementById('pseudocode-code');
const pseudocodePanel = document.getElementById('pseudocode-panel');
const pseudocodeToggle = document.getElementById('pseudocode-toggle');

const compareAlgo1 = document.getElementById('compare-algo-1');
const compareAlgo2 = document.getElementById('compare-algo-2');

const dataRandomBtn = document.getElementById('random-btn');
const dataSortedBtn = document.getElementById('sorted-btn');
const dataReverseBtn = document.getElementById('reverse-btn');

// Initialize Audio
function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

// Generate random array
function generateArray(size, mode = 'random') {
    array = [];
    for (let i = 0; i < size; i++) {
        let val;
        if (mode === 'sorted') val = Math.floor((i + 1) * (400 / size)) + 10;
        else if (mode === 'reverse') val = Math.floor((size - i) * (400 / size)) + 10;
        else val = Math.floor(Math.random() * 400) + 10;
        array.push(val);
    }
    originalArray = [...array];
    renderBars();
    resetStats();
}

// Render bars
function renderBars(container = barsContainer, arr = array, isSmall = false) {
    container.innerHTML = '';
    const max = Math.max(...arr);
    arr.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${(value / max) * 100}%`;
        bar.dataset.index = index;
        container.appendChild(bar);
    });
}

// Update bar colors
function updateBarColors(container, indices, className) {
    const bars = container.querySelectorAll('.bar');
    bars.forEach(bar => bar.classList.remove('comparing', 'swapping', 'sorted'));
    indices.forEach(i => {
        if (bars[i]) bars[i].classList.add(className);
    });
}

// Sleep with pause support
async function sleep(ms) {
    if (isPaused) {
        await new Promise(resolve => {
            const check = () => {
                if (!isPaused) resolve();
                else setTimeout(check, 50);
            };
            check();
        });
    }
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Play sound
function playSwapSound(freq = 440) {
    if (!soundEnabled || !audioContext) return;
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.05);
}

// Reset stats
function resetStats() {
    comparisons = 0;
    swaps = 0;
    statComparisons.textContent = '0';
    statSwaps.textContent = '0';
    statTime.textContent = '0 ms';
}

// Update stats
function updateStats() {
    statComparisons.textContent = comparisons;
    statSwaps.textContent = swaps;
    const elapsed = Date.now() - startTime;
    statTime.textContent = `${elapsed} ms`;
}

// Complexity data
const complexities = {
    bubble: {
        best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        title: 'Bubble Sort'
    },
    selection: {
        best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        title: 'Selection Sort'
    },
    insertion: {
        best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        title: 'Insertion Sort'
    },
    merge: {
        best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
        title: 'Merge Sort'
    },
    quick: {
        best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)',
        title: 'Quick Sort'
    },
    heap: {
        best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)',
        title: 'Heap Sort'
    }
};

function updateComplexity(algo) {
    const data = complexities[algo];
    complexityContent.innerHTML = `
        <div class="complexity-row"><strong>Best:</strong> <span>${data.best}</span></div>
        <div class="complexity-row"><strong>Average:</strong> <span>${data.avg}</span></div>
        <div class="complexity-row"><strong>Worst:</strong> <span>${data.worst}</span></div>
        <div class="complexity-row"><strong>Space:</strong> <span>${data.space}</span></div>
    `;
    singleAlgoTitle.textContent = data.title;
}

// Pseudo code templates (highlighted live)
const pseudoCodes = {
    bubble: `for i = 0 to n-1
    for j = 0 to n-i-2
        if A[j] > A[j+1]
            swap(A[j], A[j+1])`,
    selection: `for i = 0 to n-1
    minIdx = i
    for j = i+1 to n-1
        if A[j] < A[minIdx]
            minIdx = j
    swap(A[i], A[minIdx])`,
    insertion: `for i = 1 to n-1
    key = A[i]
    j = i - 1
    while j >= 0 and A[j] > key
        A[j+1] = A[j]
        j--
    A[j+1] = key`,
    merge: `mergeSort(arr, l, r)
if l < r
    m = (l+r)/2
    mergeSort(l, m)
    mergeSort(m+1, r)
    merge(l, m, r)`,
    quick: `quickSort(arr, low, high)
if low < high
    pi = partition(low, high)
    quickSort(low, pi-1)
    quickSort(pi+1, high)`,
    heap: `heapSort(arr)
buildMaxHeap(arr)
for i = n-1 downto 1
    swap(arr[0], arr[i])
    heapify(arr, 0, i)`
};

function showPseudoCode(algo) {
    if (!pseudocodeToggle.checked) {
        pseudocodePanel.style.display = 'none';
        return;
    }
    pseudocodePanel.style.display = 'block';
    pseudocodeCode.innerHTML = `<code>${pseudoCodes[algo].replace(/\n/g, '<br>')}</code>`;
}

// Sorting Algorithms (all async with visual feedback)
async function bubbleSort(arr, container) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (!isSorting) return;
            comparisons++;
            updateBarColors(container, [j, j + 1], 'comparing');
            await sleep(animationSpeed);
            updateStats();
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swaps++;
                updateBarColors(container, [j, j + 1], 'swapping');
                playSwapSound(300 + arr[j] * 2);
                await sleep(animationSpeed);
                renderBars(container, arr);
            }
        }
        // Mark last sorted
        const bars = container.querySelectorAll('.bar');
        if (bars[n - i - 1]) bars[n - i - 1].classList.add('sorted');
    }
}

async function selectionSort(arr, container) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (!isSorting) return;
            comparisons++;
            updateBarColors(container, [i, j], 'comparing');
            await sleep(animationSpeed);
            updateStats();
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            swaps++;
            updateBarColors(container, [i, minIdx], 'swapping');
            playSwapSound(400 + arr[i] * 2);
            await sleep(animationSpeed);
            renderBars(container, arr);
        }
        const bars = container.querySelectorAll('.bar');
        if (bars[i]) bars[i].classList.add('sorted');
    }
}

async function insertionSort(arr, container) {
    const n = arr.length;
    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            if (!isSorting) return;
            comparisons++;
            updateBarColors(container, [j, j + 1], 'comparing');
            await sleep(animationSpeed);
            updateStats();
            arr[j + 1] = arr[j];
            j--;
            renderBars(container, arr);
        }
        arr[j + 1] = key;
        swaps++;
        updateBarColors(container, [j + 1], 'swapping');
        await sleep(animationSpeed);
        renderBars(container, arr);
    }
    const bars = container.querySelectorAll('.bar');
    bars.forEach(b => b.classList.add('sorted'));
}

async function mergeSort(arr, container) {
    async function merge(left, mid, right) {
        const leftArr = arr.slice(left, mid + 1);
        const rightArr = arr.slice(mid + 1, right + 1);
        let i = 0, j = 0, k = left;
        while (i < leftArr.length && j < rightArr.length) {
            if (!isSorting) return;
            comparisons++;
            updateBarColors(container, [k], 'comparing');
            await sleep(animationSpeed);
            if (leftArr[i] <= rightArr[j]) {
                arr[k] = leftArr[i];
                i++;
            } else {
                arr[k] = rightArr[j];
                j++;
                swaps++;
            }
            k++;
            renderBars(container, arr);
        }
        while (i < leftArr.length) {
            arr[k] = leftArr[i];
            i++;
            k++;
            renderBars(container, arr);
        }
        while (j < rightArr.length) {
            arr[k] = rightArr[j];
            j++;
            k++;
            renderBars(container, arr);
        }
    }

    async function sort(l, r) {
        if (l >= r) return;
        const m = Math.floor((l + r) / 2);
        await sort(l, m);
        await sort(m + 1, r);
        await merge(l, m, r);
    }
    await sort(0, arr.length - 1);
    const bars = container.querySelectorAll('.bar');
    bars.forEach(b => b.classList.add('sorted'));
}

async function quickSort(arr, container) {
    async function partition(low, high) {
        const pivot = arr[high];
        let i = low - 1;
        for (let j = low; j < high; j++) {
            if (!isSorting) return -1;
            comparisons++;
            updateBarColors(container, [j, high], 'comparing');
            await sleep(animationSpeed);
            if (arr[j] < pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                swaps++;
                renderBars(container, arr);
            }
        }
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        swaps++;
        renderBars(container, arr);
        return i + 1;
    }

    async function sort(low, high) {
        if (low >= high) return;
        const pi = await partition(low, high);
        if (pi === -1) return;
        await sort(low, pi - 1);
        await sort(pi + 1, high);
    }
    await sort(0, arr.length - 1);
    const bars = container.querySelectorAll('.bar');
    bars.forEach(b => b.classList.add('sorted'));
}

async function heapSort(arr, container) {
    async function heapify(n, i) {
        let largest = i;
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        if (l < n && arr[l] > arr[largest]) largest = l;
        if (r < n && arr[r] > arr[largest]) largest = r;
        if (largest !== i) {
            [arr[i], arr[largest]] = [arr[largest], arr[i]];
            swaps++;
            renderBars(container, arr);
            await sleep(animationSpeed);
            await heapify(n, largest);
        }
    }

    const n = arr.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        if (!isSorting) return;
        await heapify(n, i);
    }
    for (let i = n - 1; i > 0; i--) {
        if (!isSorting) return;
        [arr[0], arr[i]] = [arr[i], arr[0]];
        swaps++;
        renderBars(container, arr);
        await heapify(i, 0);
    }
    const bars = container.querySelectorAll('.bar');
    bars.forEach(b => b.classList.add('sorted'));
}

// Master sorting runner
async function runSort(algo, container, targetArray) {
    isSorting = true;
    isPaused = false;
    startTime = Date.now();
    const copy = [...targetArray];
    renderBars(container, copy);

    const speedMap = {
        1: 120, 25: 80, 50: 40, 75: 15, 100: 5
    };
    animationSpeed = speedMap[Math.min(Math.max(speedSlider.value, 1), 100)] || 40;

    if (algo === 'bubble') await bubbleSort(copy, container);
    else if (algo === 'selection') await selectionSort(copy, container);
    else if (algo === 'insertion') await insertionSort(copy, container);
    else if (algo === 'merge') await mergeSort(copy, container);
    else if (algo === 'quick') await quickSort(copy, container);
    else if (algo === 'heap') await heapSort(copy, container);

    isSorting = false;
    updateStats();
    return copy;
}

// Event listeners
function addListeners() {
    sizeSlider.addEventListener('input', () => {
        sizeValue.textContent = sizeSlider.value;
        if (!isSorting) generateArray(parseInt(sizeSlider.value));
    });

    speedSlider.addEventListener('input', () => {
        const v = parseInt(speedSlider.value);
        if (v < 25) speedValue.textContent = 'Ultra Slow';
        else if (v < 50) speedValue.textContent = 'Slow';
        else if (v < 75) speedValue.textContent = 'Medium';
        else speedValue.textContent = 'Fast';
    });

    algoSelect.addEventListener('change', () => {
        updateComplexity(algoSelect.value);
        showPseudoCode(algoSelect.value);
    });

    generateBtn.addEventListener('click', () => {
        let mode = 'random';
        if (dataSortedBtn.classList.contains('active')) mode = 'sorted';
        else if (dataReverseBtn.classList.contains('active')) mode = 'reverse';
        generateArray(parseInt(sizeSlider.value), mode);
    });

    startBtn.addEventListener('click', async () => {
        if (isSorting) return;
        initAudio();
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        if (singleMode) {
            updateComplexity(algoSelect.value);
            showPseudoCode(algoSelect.value);
            await runSort(algoSelect.value, barsContainer, array);
        } else {
            // Compare mode
            const arr1 = [...array];
            const arr2 = [...array];
            const p1 = runSort(compareAlgo1.value, compareBars1, arr1);
            const p2 = runSort(compareAlgo2.value, compareBars2, arr2);
            await Promise.all([p1, p2]);
        }
        pauseBtn.classList.add('hidden');
        startBtn.classList.remove('hidden');
    });

    pauseBtn.addEventListener('click', () => {
        isPaused = true;
        pauseBtn.classList.add('hidden');
        resumeBtn.classList.remove('hidden');
    });

    resumeBtn.addEventListener('click', () => {
        isPaused = false;
        resumeBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
    });

    resetBtn.addEventListener('click', () => {
        isSorting = false;
        isPaused = false;
        array = [...originalArray];
        renderBars();
        resetStats();
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        resumeBtn.classList.add('hidden');
    });

    // Mode toggle
    singleModeBtn.addEventListener('click', () => {
        singleMode = true;
        singleModeBtn.classList.add('active');
        compareModeBtn.classList.remove('active');
        singleContainer.classList.add('active');
        compareContainer.classList.remove('active');
    });

    compareModeBtn.addEventListener('click', () => {
        singleMode = false;
        compareModeBtn.classList.add('active');
        singleModeBtn.classList.remove('active');
        singleContainer.classList.remove('active');
        compareContainer.classList.add('active');
        // Initial render for comparison
        renderBars(compareBars1, array, true);
        renderBars(compareBars2, array, true);
    });

    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('light-mode');
        if (document.documentElement.classList.contains('light-mode')) {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    });

    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.classList.toggle('active', soundEnabled);
        soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
    });

    pseudocodeToggle.addEventListener('change', () => {
        if (isSorting) return;
        showPseudoCode(algoSelect.value);
    });

    // Data mode buttons
    [dataRandomBtn, dataSortedBtn, dataReverseBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.data-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.key === 'r' || e.key === 'R') generateBtn.click();
        if (e.key === ' ' && isSorting) {
            e.preventDefault();
            if (isPaused) resumeBtn.click();
            else pauseBtn.click();
        }
    });
}

// Initialize everything
function init() {
    generateArray(50);
    updateComplexity('bubble');
    showPseudoCode('bubble');
    addListeners();
    console.log('%c🚀 AlgoViz Pro initialized — Premium production ready!', 'color:#00f7ff; font-size:13px; font-family:monospace');
}

window.onload = init;
