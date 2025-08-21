// ============ CONFIGURATION CONSTANTS ============
const CONFIG = {
  // Speed slider configuration
  SPEED: {
    SLIDER_DEFAULT: 40,   // Default slider position
    DEFAULT_DELAY_MS: 80, // Delay corresponding to default slider position
    DELAY_MIN: 20,        // Fastest delay in ms
    DELAY_MAX: 120       // Slowest delay in ms
  },
  
  // Bar density configuration
  DENSITY: {
    MIN: 3,              // Minimum bar spacing (most dense)
    MAX: 30,             // Maximum bar spacing (least dense)
    DEFAULT: 8           // Default bar spacing
  },
  
  // Canvas configuration
  CANVAS: {
    MIN_WIDTH: 300,      // Minimum canvas width
    PADDING: 2,          // Starting X position for bars
    RESIZE_DEBOUNCE: 120 // Debounce delay for resize events in ms
  },
  
  // Visual styling
  COLORS: {
    BAR: "#000000"       // Color for all bars
  },
  
  // Bar generation
  BAR: {
    MIN_LINE_WIDTH: 1,   // Minimum stroke width for bars
    LINE_WIDTH_DIVISOR: 4 // Divisor for calculating line width from spacing
  },
  
  // Element IDs (to avoid magic strings)
  ELEMENTS: {
    SPEED_SLIDER: "speedRange",
    DENSITY_SLIDER: "densityRange", 
    ALGO_CONTAINER: "algo-cards-container",
    SORT_ALL_BTN: "button-sort-all",
    RESET_ALL_BTN: "button-reset-all"
  }
};

// ============ UTILITIES ============
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// global, dynamic from slider (1..100) mapped to delay 2..120ms
function currentDelay() {
  const slider = document.getElementById(CONFIG.ELEMENTS.SPEED_SLIDER);
  if (!slider) 
    return CONFIG.SPEED.DEFAULT_DELAY_MS;

  const sliderValue = Number(slider.value);

  const delay = CONFIG.SPEED.DELAY_MAX - sliderValue;
  
  return Math.max(CONFIG.SPEED.DELAY_MIN, delay);
}

// global density -> algorithm.barSpacing (min 3, max 30)
function currentBarSpacing() {
  const slider = document.getElementById(CONFIG.ELEMENTS.DENSITY_SLIDER);
  return slider ? Number(slider.value) : CONFIG.DENSITY.DEFAULT;
}

// Disable / enable all controls of a card
function toggleAlgorithmControls(algoName, isDisabled) {
  const card = document.querySelector(`[data-algo='${algoName}']`);
  if (!card) return;
  const controls = card.querySelectorAll("button");
  controls.forEach((btn) => (btn.disabled = isDisabled));
  card.classList.toggle("sorting-disabled", isDisabled);
}

// ============ CORE ============
const algoCardsContainer = document.getElementById(CONFIG.ELEMENTS.ALGO_CONTAINER);

function clearCanvas(algoName) {
  const canvas = document.getElementById(`canvas-${algoName}`);
    if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Set canvas dimensions to match its parent container for responsive design.
// This ensures the canvas properly resizes when the window or container changes size.
function setCanvasSizeToParent(canvas) {
  if (!canvas || !canvas.parentElement) return;
  const parent = canvas.parentElement;
  const rect = parent.getBoundingClientRect();
  canvas.width = Math.max(CONFIG.CANVAS.MIN_WIDTH, Math.floor(rect.width - 2)); // avoid 0 width
  canvas.height = Math.round(parseFloat(getComputedStyle(canvas).height));
}

// Refresh the visualization for an algorithm by updating canvas size, regenerating bar heights, and redrawing
function refresh(algoName) {
  const canvas = document.getElementById(`canvas-${algoName}`);
  if (!canvas) return;
  setCanvasSizeToParent(canvas);
  generateBarHeights(algoName);
  renderBars(algoName);
}

function renderBars(algoName) {
  const canvas = document.getElementById(`canvas-${algoName}`);
  const algo = algorithmsConfigByName.get(algoName);
  if (!canvas || !algo) return;
  const ctx = canvas.getContext("2d");

  clearCanvas(algoName);

  for (let x = CONFIG.CANVAS.PADDING, i = 0; x < canvas.width && i < algo.barHeights.length; x += algo.barSpacing, i++) {
    const currBarHeight = algo.barHeights[i];
    ctx.beginPath();
    ctx.moveTo(x, CONFIG.CANVAS.PADDING);
    ctx.lineTo(x, currBarHeight);
    ctx.lineWidth = Math.max(CONFIG.BAR.MIN_LINE_WIDTH, algo.barSpacing / CONFIG.BAR.LINE_WIDTH_DIVISOR);
    ctx.strokeStyle = CONFIG.COLORS.BAR;
    ctx.stroke();
  }
}

// swapping with bounds check
function swap(arr, i, j) {
  if (i < 0 || i >= arr.length || j < 0 || j >= arr.length) {
    throw new Error(`Array out of bounds: length=${arr.length}, i=${i}, j=${j}`);
  }
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

// ============ SORTING ALGORITHM CLASS ============
class SortingAlgorithm {
  constructor(name) {
    if (this.constructor === SortingAlgorithm) {
      throw new Error("Abstract class SortingAlgorithm cannot be instantiated directly");
    }
    this.name = name;
    this.barSpacing = CONFIG.DENSITY.DEFAULT;
    this.barHeights = [];
  }

  async sort() {
    throw new Error("Abstract method 'sort()' must be implemented in subclass");
  }
}

class ShellSort extends SortingAlgorithm {
  async sort() {
    toggleAlgorithmControls(this.name, true);
    let gap = Math.floor(this.barHeights.length / 2);

    while (gap !== 0) {
      let start = 0;
      let end = start + gap;

      while (end < this.barHeights.length) {
        if (this.barHeights[start] > this.barHeights[end]) {
          swap(this.barHeights, start, end);
          renderBars(this.name);
          await sleep(currentDelay());

          let tmpStart = start;
          let previous = tmpStart - gap;
          while (previous > -1 && this.barHeights[previous] > this.barHeights[tmpStart]) {
            swap(this.barHeights, previous, tmpStart);
            renderBars(this.name);
            await sleep(currentDelay());

            tmpStart = previous;
            previous = previous - gap;
          }
        }
        start++;
        end++;
      }
      gap = Math.floor(gap / 2);
    }
    toggleAlgorithmControls(this.name, false);
  }
}

class QuickSort extends SortingAlgorithm {
  async sort() {
    toggleAlgorithmControls(this.name, true);
    await this.quickSortHelper(this.barHeights, 0, this.barHeights.length - 1);
    toggleAlgorithmControls(this.name, false);
  }

  async partition(arr, start, end) {
    const pivot = arr[end];
    let i = start - 1;
    for (let j = start; j < end; j++) {
      if (arr[j] < pivot) {
        i++;
        swap(arr, i, j);
        renderBars(this.name);
        await sleep(currentDelay());
      }
    }
    swap(arr, i + 1, end);
    renderBars(this.name);
    await sleep(currentDelay());
    return i + 1;
  }

  async quickSortHelper(arr, start, end) {
    if (start < end) {
      const idx = await this.partition(arr, start, end);
      await this.quickSortHelper(arr, start, idx - 1);
      await this.quickSortHelper(arr, idx + 1, end);
    }
  }
}

class BubbleSort extends SortingAlgorithm {
  async sort() {
    toggleAlgorithmControls(this.name, true);
    let alreadySorted = false;
    for (let i = 0; i < this.barHeights.length - 1; i++) {
      if (!alreadySorted) {
        alreadySorted = true;
        for (let j = 0; j < this.barHeights.length - 1 - i; j++) {
          if (this.barHeights[j] > this.barHeights[j + 1]) {
            alreadySorted = false;
            swap(this.barHeights, j, j + 1);
            renderBars(this.name);
            await sleep(currentDelay());
          }
        }
      }
    }
    toggleAlgorithmControls(this.name, false);
  }
}

class SelectionSort extends SortingAlgorithm {
  async sort() {
    toggleAlgorithmControls(this.name, true);
    for (let i = 0; i < this.barHeights.length - 1; i++) {
      let indexMax = 0;
      for (let j = 0; j < this.barHeights.length - i; j++) {
        if (this.barHeights[j] > this.barHeights[indexMax]) {
          indexMax = j;
        }
      }
      swap(this.barHeights, indexMax, this.barHeights.length - 1 - i);
      renderBars(this.name);
      await sleep(currentDelay());
    }
    toggleAlgorithmControls(this.name, false);
  }
}

class InsertionSort extends SortingAlgorithm {
  async sort() {
    toggleAlgorithmControls(this.name, true);
    for (let i = 1; i < this.barHeights.length; i++) {
      let k = i;
      while (k > 0 && this.barHeights[k] < this.barHeights[k - 1]) {
        swap(this.barHeights, k, k - 1);
        k--;
        renderBars(this.name);
        await sleep(currentDelay());
      }
    }
    toggleAlgorithmControls(this.name, false);
  }
}

// ============ ALGORITHMS CONFIGURATION ============
const algorithmsConfig = [
  new ShellSort("shellSort"),
  new QuickSort("quickSort"),
  new BubbleSort("bubbleSort"),
  new SelectionSort("selectionSort"),
  new InsertionSort("insertionSort")
];

// Create a Map for O(1) lookup of algorithms by name
const algorithmsConfigByName = new Map(algorithmsConfig.map(a => [a.name, a]));

// ============ GENERATION & DISPLAY ============
function generateBarHeights(algoName) {
  const canvas = document.getElementById(`canvas-${algoName}`);
  const algo = algorithmsConfigByName.get(algoName);
  if (!canvas || !algo) return;

  algo.barHeights = [];
  const barSpacing = algo.barSpacing;
  for (let x = CONFIG.CANVAS.PADDING; x < canvas.width; x += barSpacing) {
    const halfHeight = canvas.height / 2;
    const val = halfHeight + Math.floor(Math.random() * (halfHeight - CONFIG.CANVAS.PADDING));
    algo.barHeights.push(val);
  }
}

function formatAlgoName(algoName) {
  const pretty = algoName.replace(/([a-z])([A-Z])/g, "$1 $2"); // quickSort -> quick Sort
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

// ============ TEMPLATED UI ============
function createAlgorithmCard(algo) {
  return `
    <div class="col-lg-6 col-md-12 mb-4" data-algo="${algo.name}">
      <div class="card algo-card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">${formatAlgoName(algo.name)}</h5>
          <small class="text-muted" title="Best/Avg/Worst: see docs"></small>
        </div>
        <div class="card-body">
          <div class="canvas-wrap mb-3">
            <canvas id="canvas-${algo.name}">Your browser does not support the HTML5 canvas tag</canvas>
          </div>
          <div class="controls-row d-flex justify-content-center">
            <button class="btn btn-primary mr-2 sort" data-algo-name="${algo.name}">Sort</button>
            <button class="btn btn-outline-warning btn-icon increase-bars" data-algo-name="${algo.name}" aria-label="Increase bars (decreases spacing)">More bars</button>
            <button class="btn btn-outline-warning btn-icon mr-2 decrease-bars" data-algo-name="${algo.name}" aria-label="Decrease bars (increases spacing)">Fewer bars</button>
            <button class="btn btn-secondary generate-new-bars" data-algo-name="${algo.name}">Generate New Bars</button>
          </div>
          <div class="text-center mt-2 card-note">Adjust bar density or generate new bars</div>
        </div>
      </div>
    </div>
  `;
}

// Build once, then init after layout is ready
algoCardsContainer.innerHTML = algorithmsConfig.map(createAlgorithmCard).join("");
requestAnimationFrame(() => {
  algorithmsConfig.forEach((algo) => {
    algo.barSpacing = currentBarSpacing();
    refresh(algo.name);
  });
});

// Use event delegation for handling clicks on algorithm card buttons
algoCardsContainer.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const algoName = btn.dataset.algoName;
  const algo = algorithmsConfigByName.get(algoName);
  if (!algo) return;

  if (btn.classList.contains("sort")) {
    await algo.sort();
  } else if (btn.classList.contains("increase-bars")) {
    if (algo.barSpacing > CONFIG.DENSITY.MIN) {
      algo.barSpacing -= 1;
      refresh(algoName);
    }
  } else if (btn.classList.contains("decrease-bars")) {
    if (algo.barSpacing < CONFIG.DENSITY.MAX) {
      algo.barSpacing += 1;
      refresh(algoName);
    }
  } else if (btn.classList.contains("generate-new-bars")) {
    algo.barSpacing = currentBarSpacing();
    refresh(algoName);
  }
});

// resize handler
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    algorithmsConfig.forEach((algo) => {
      refresh(algo.name);
    });
  }, CONFIG.CANVAS.RESIZE_DEBOUNCE);
});

// ============ EVENTS ============

const buttonSortAll = document.getElementById(CONFIG.ELEMENTS.SORT_ALL_BTN);
const buttonResetAll = document.getElementById(CONFIG.ELEMENTS.RESET_ALL_BTN);

buttonSortAll.addEventListener("click", async () => {
  buttonSortAll.disabled = true;
  buttonResetAll.disabled = true;
  algorithmsConfig.forEach((a) => toggleAlgorithmControls(a.name, true));
  try {
    await Promise.all(algorithmsConfig.map((a) => a.sort()));
  } finally {
    algorithmsConfig.forEach((a) => toggleAlgorithmControls(a.name, false));
    buttonSortAll.disabled = false;
    buttonResetAll.disabled = false;
  }
});

buttonResetAll.addEventListener("click", () => {
  document.getElementById(CONFIG.ELEMENTS.SPEED_SLIDER).value = CONFIG.SPEED.SLIDER_DEFAULT;
  document.getElementById(CONFIG.ELEMENTS.DENSITY_SLIDER).value = CONFIG.DENSITY.DEFAULT;
  for (let i = 0; i < algorithmsConfig.length; i++) {
    algorithmsConfig[i].barSpacing = currentBarSpacing();
    refresh(algorithmsConfig[i].name);
  }
});

// global sliders
document.getElementById(CONFIG.ELEMENTS.DENSITY_SLIDER).addEventListener("input", (e) => {
  const newBarSpacing = Number(e.target.value);
  for (const algo of algorithmsConfig) {
    algo.barSpacing = newBarSpacing;
    refresh(algo.name);
  }
});