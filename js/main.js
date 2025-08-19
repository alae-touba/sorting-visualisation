// ============ CONFIGURATION CONSTANTS ============
const CONFIG = {
  // Speed slider configuration
  SPEED: {
    MIN: 1,
    MAX: 100,
    DEFAULT: 40,
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
  if (!slider) return 50; // reasonable default
  
  const sliderValue = Number(slider.value); // 1..100
  
  // Map slider 1-100 to delay 120-20
  // When slider = 1 (slowest), delay = 120ms
  // When slider = 100 (fastest), delay = 20ms
  const delay = CONFIG.SPEED.DELAY_MAX - sliderValue + CONFIG.SPEED.DELAY_MIN;
  
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
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Set canvas dimensions to match its parent container for responsive design.
// This ensures the canvas properly resizes when the window or container changes size.
function setCanvasSizeToParent(canvas) {
  const parent = canvas.parentElement;
  const rect = parent.getBoundingClientRect();
  canvas.width = Math.max(CONFIG.CANVAS.MIN_WIDTH, Math.floor(rect.width - 2)); // avoid 0 width
  canvas.height = Math.round(parseFloat(getComputedStyle(canvas).height));
}

// Refresh the visualization for an algorithm by updating canvas size, regenerating bar heights, and redrawing
function refresh(algoName) {
  const canvas = document.getElementById(`canvas-${algoName}`);
  setCanvasSizeToParent(canvas);
  generateBarHeights(algoName);
  renderBars(algoName);
}

function renderBars(algoName) {
  const canvas = document.getElementById(`canvas-${algoName}`);
  const ctx = canvas.getContext("2d");
  const algo = algorithmsConfigByName.get(algoName);

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

// ============ ALGORITHMS ============
const algorithmsConfig = [
  {
    name: "shellSort",
    barSpacing: CONFIG.DENSITY.DEFAULT,
    barHeights: [],
    async sort() {
      toggleAlgorithmControls(this.name, true);
      let gap = Math.floor(this.barHeights.length / 2);

      while (gap !== 0) {
        let start = 0;
        let end = start + gap;

        while (end < this.barHeights.length) {
          if (this.barHeights[start] > this.barHeights[end]) {
            swap(this.barHeights, start, end);
            clearCanvas(this.name);
            renderBars(this.name);
            await sleep(currentDelay());

            let tmpStart = start;
            let previous = tmpStart - gap;
            while (previous > -1 && this.barHeights[previous] > this.barHeights[tmpStart]) {
              swap(this.barHeights, previous, tmpStart);

              clearCanvas(this.name);
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
    },
  },
  {
    name: "quickSort",
    barSpacing: CONFIG.DENSITY.DEFAULT,
    barHeights: [],
    async sort() {
      toggleAlgorithmControls(this.name, true);
      await this.quickSortHelper(this.barHeights, 0, this.barHeights.length - 1);
      toggleAlgorithmControls(this.name, false);
    },
    async partition(arr, start, end) {
      const pivot = arr[end];
      let i = start - 1;
      for (let j = start; j < end; j++) {
        if (arr[j] < pivot) {
          i++;
          swap(arr, i, j);
          clearCanvas(this.name);
          renderBars(this.name);
          await sleep(currentDelay());
        }
      }
      swap(arr, i + 1, end);
      clearCanvas(this.name);
      renderBars(this.name);
      await sleep(currentDelay());
      return i + 1;
    },
    async quickSortHelper(arr, start, end) {
      if (start < end) {
        const idx = await this.partition(arr, start, end);
        await this.quickSortHelper(arr, start, idx - 1);
        await this.quickSortHelper(arr, idx + 1, end);
      }
    },
  },
  {
    name: "bubbleSort",
    barSpacing: CONFIG.DENSITY.DEFAULT,
    barHeights: [],
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
              clearCanvas(this.name);
              renderBars(this.name);
              await sleep(currentDelay());
            }
          }
        }
      }
      toggleAlgorithmControls(this.name, false);
    },
  },
  {
    name: "selectionSort",
    barSpacing: CONFIG.DENSITY.DEFAULT,
    barHeights: [],
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
        clearCanvas(this.name);
        renderBars(this.name);
        await sleep(currentDelay());
      }
      toggleAlgorithmControls(this.name, false);
    },
  },
  {
    name: "insertionSort",
    barSpacing: CONFIG.DENSITY.DEFAULT,
    barHeights: [],
    async sort() {
      toggleAlgorithmControls(this.name, true);
      for (let i = 1; i < this.barHeights.length; i++) {
        let k = i;
        while (k > 0 && this.barHeights[k] < this.barHeights[k - 1]) {
          swap(this.barHeights, k, k - 1);
          k--;
          clearCanvas(this.name);
          renderBars(this.name);
          await sleep(currentDelay());
        }
      }
      toggleAlgorithmControls(this.name, false);
    },
  },
];

// Create a Map for O(1) lookup of algorithms by name
const algorithmsConfigByName = new Map(algorithmsConfig.map(a => [a.name, a]));

// ============ GENERATION & DISPLAY ============
function generateBarHeights(algoName) {
  const canvas = document.getElementById(`canvas-${algoName}`);
  const algo = algorithmsConfigByName.get(algoName);

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

// ============ BUILD UI ============
for (let i = 0; i < algorithmsConfig.length; i++) {
  const algo = algorithmsConfig[i];

  const col = document.createElement("div");
  col.className = "col-lg-6 col-md-12 mb-4";
  col.setAttribute("data-algo", algo.name);

  const card = document.createElement("div");
  card.className = "card algo-card";

  const header = document.createElement("div");
  header.className = "card-header d-flex justify-content-between align-items-center";
  const title = document.createElement("h5");
  title.className = "mb-0";
  title.textContent = formatAlgoName(algo.name);
  const info = document.createElement("small");
  info.className = "text-muted";
  info.title = "Best/Avg/Worst: see docs";
  header.appendChild(title);
  header.appendChild(info);

  const body = document.createElement("div");
  body.className = "card-body";

  const canvasWrap = document.createElement("div");
  canvasWrap.className = "canvas-wrap mb-3";

  const canvas = document.createElement("canvas");
  canvas.id = `canvas-${algo.name}`;
  canvas.textContent = "Your browser does not support the HTML5 canvas tag";

  canvasWrap.appendChild(canvas);

  const controls = document.createElement("div");
  controls.className = "controls-row d-flex justify-content-center";

  const buttonSort = document.createElement("button");
  buttonSort.className = `btn btn-primary mr-2 sort`;
  buttonSort.setAttribute("data-algo-name", algo.name);
  buttonSort.textContent = "Sort";

  const buttonIncreaseBars = document.createElement("button");
  buttonIncreaseBars.className = `btn btn-outline-warning btn-icon increase-bars`;
  buttonIncreaseBars.setAttribute("data-algo-name", algo.name);
  buttonIncreaseBars.setAttribute("aria-label", "Increase bars (decreases spacing)");
  buttonIncreaseBars.textContent = "More bars";

  const buttonDecreaseBars = document.createElement("button");
  buttonDecreaseBars.className = `btn btn-outline-warning btn-icon mr-2 decrease-bars`;
  buttonDecreaseBars.setAttribute("data-algo-name", algo.name);
  buttonDecreaseBars.setAttribute("aria-label", "Decrease bars (increases spacing)");
  buttonDecreaseBars.textContent = "Fewer bars";

  const buttonGenerateNewBars = document.createElement("button");
  buttonGenerateNewBars.className = `btn btn-secondary generate-new-bars`;
  buttonGenerateNewBars.setAttribute("data-algo-name", algo.name);
  buttonGenerateNewBars.textContent = "Generate New Bars";

  const note = document.createElement("div");
  note.className = "text-center mt-2 card-note";
  note.textContent = "Adjust bar density or generate new bars";

  controls.appendChild(buttonSort);
  controls.appendChild(buttonIncreaseBars);
  controls.appendChild(buttonDecreaseBars);
  controls.appendChild(buttonGenerateNewBars);

  body.appendChild(canvasWrap);
  body.appendChild(controls);
  body.appendChild(note);

  card.appendChild(header);
  card.appendChild(body);
  col.appendChild(card);
  algoCardsContainer.appendChild(col);

  // initial sizing + data generation
  algo.barSpacing = currentBarSpacing();
  refresh(algo.name);
}

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
const sortButtons = document.querySelectorAll(".sort");
for (let i = 0; i < sortButtons.length; i++) {
  sortButtons[i].addEventListener("click", async (e) => {
    const algoName = e.currentTarget.dataset.algoName;
    const algo = algorithmsConfigByName.get(algoName);
    await algo.sort();
  });
}

const increaseBarsButtons = document.querySelectorAll(".increase-bars");
for (let i = 0; i < increaseBarsButtons.length; i++) {
  increaseBarsButtons[i].addEventListener("click", (e) => {
    const algoName = e.currentTarget.dataset.algoName;
    const algo = algorithmsConfigByName.get(algoName);
    if (algo.barSpacing > CONFIG.DENSITY.MIN) {  // Decrease spacing to show more bars
      algo.barSpacing -= 1;
      refresh(algoName);
    }
  });
}

const decreaseBarsButtons = document.querySelectorAll(".decrease-bars");
for (let i = 0; i < decreaseBarsButtons.length; i++) {
  decreaseBarsButtons[i].addEventListener("click", (e) => {
    const algoName = e.currentTarget.dataset.algoName;
    const algo = algorithmsConfigByName.get(algoName);
    if (algo.barSpacing < CONFIG.DENSITY.MAX) {  // Increase spacing to show fewer bars
      algo.barSpacing += 1;
      refresh(algoName);
    }
  });
}

const generateNewBarsButtons = document.querySelectorAll(".generate-new-bars");
for (let i = 0; i < generateNewBarsButtons.length; i++) {
  generateNewBarsButtons[i].addEventListener("click", (e) => {
    const algoName = e.currentTarget.dataset.algoName;
    const algo = algorithmsConfigByName.get(algoName);
    algo.barSpacing = currentBarSpacing();
    refresh(algoName);
  });
}

const buttonSortAll = document.getElementById(CONFIG.ELEMENTS.SORT_ALL_BTN);
const buttonResetAll = document.getElementById(CONFIG.ELEMENTS.RESET_ALL_BTN);

buttonSortAll.addEventListener("click", async () => {
  buttonSortAll.disabled = true;
  buttonResetAll.disabled = true;
  // disable each card
  algorithmsConfig.forEach((a) => toggleAlgorithmControls(a.name, true));
  await Promise.all(algorithmsConfig.map((a) => a.sort()));
  algorithmsConfig.forEach((a) => toggleAlgorithmControls(a.name, false));
  buttonSortAll.disabled = false;
  buttonResetAll.disabled = false;
});

buttonResetAll.addEventListener("click", () => {
  document.getElementById(CONFIG.ELEMENTS.SPEED_SLIDER).value = CONFIG.SPEED.DEFAULT;
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