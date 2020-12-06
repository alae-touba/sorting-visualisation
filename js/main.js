function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

const divAlgosContainer = document.getElementById("algos-container")
const divAlgosRow = document.getElementById("algos-row")

function clearCanvas(algoName) {
	const canvas = document.getElementById("canvas " + algoName)
	const ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function swap(arr, i, j) {
	if (i < 0 || i >= arr.length || j < 0 || j >= arr.length) {
		throw new Error(`array out of bounds exception, length = ${arr.length} / i = ${j} / j = ${j}`)
	}

	const tmp = arr[i]
	arr[i] = arr[j]
	arr[j] = tmp
}

const algorithms = [
	{
		name: "shellSort",
		step: 8,
		yTailArray: [],
		async sort() {
			let gap = Math.floor(this.yTailArray.length / 2)

			while (gap !== 0) {
				let start = 0
				let end = start + gap

				while (end < this.yTailArray.length) {
					if (this.yTailArray[start] > this.yTailArray[end]) {
						swap(this.yTailArray, start, end)

						clearCanvas(this.name)
						display(this.name, "#de512a")
						await sleep(20)

						let tmpStart = start
						let previous = tmpStart - gap
						while (previous > -1 && this.yTailArray[previous] > this.yTailArray[tmpStart]) {
							swap(this.yTailArray, previous, tmpStart)

							clearCanvas(this.name)
							display(this.name, "#de512a")
							await sleep(30)

							tmpStart = previous
							previous = previous - gap
						}
					}
					start++
					end++
				}
				gap = Math.floor(gap / 2)
			}
		}
	},
	{
		name: "quickSort",
		step: 8,
		yTailArray: [],
		async sort() {
			await this.quickSortHelper(this.yTailArray, 0, this.yTailArray.length - 1)
		},
		async partition(arr, start, end) {
			let pivot = arr[end]

			//index of smaller element
			let i = start - 1

			for (let j = start; j < end; j++) {
				if (arr[j] < pivot) {
					i++

					swap(arr, i, j)

					clearCanvas(this.name)
					display(this.name, "#de512a")
					await sleep(30)
				}
			}

			swap(arr, i + 1, end)
			//by now, all the elements on the right of the pivot are smaller than the pivot
			//and all elements on the left of the pivot are greater than the pivot

			clearCanvas(this.name)
			display(this.name, "#de512a")
			await sleep(30)

			return i + 1
		},

		async quickSortHelper(arr, start, end) {
			if (start < end) {
				let indexPivot = await this.partition(arr, start, end)
				this.quickSortHelper(arr, 0, indexPivot - 1)
				this.quickSortHelper(arr, indexPivot + 1, end)
			}
		}
	},
	{
		name: "bubbleSort",
		step: 8,
		yTailArray: [],
		async sort() {
			let isSorted = false
			for (let i = 0; i < this.yTailArray.length - 1; i++) {
				if (!isSorted) {
					isSorted = true
					for (let j = 0; j < this.yTailArray.length - 1 - i; j++) {
						if (this.yTailArray[j] > this.yTailArray[j + 1]) {
							isSorted = false
							swap(this.yTailArray, j, j + 1)

							clearCanvas(this.name)
							display(this.name, "#de512a")
							await sleep(30)
						}
					}
				}
			}
		}
	},
	{
		name: "selectionSort",
		step: 8,
		yTailArray: [],
		async sort() {
			for (let i = 0; i < this.yTailArray.length - 1; i++) {
				let indexMax = 0
				for (let j = 0; j < this.yTailArray.length - i; j++) {
					if (this.yTailArray[j] > this.yTailArray[indexMax]) {
						indexMax = j
					}
				}
				swap(this.yTailArray, indexMax, this.yTailArray.length - 1 - i)

				clearCanvas(this.name)
				display(this.name, "#de512a")
				await sleep(30)
			}
		}
	},
	{
		name: "insertionSort",
		step: 8,
		yTailArray: [],
		async sort() {
			for (let i = 1; i < this.yTailArray.length; i++) {
				let k = i
				while (k > 0 && this.yTailArray[k] < this.yTailArray[k - 1]) {
					swap(this.yTailArray, k, k - 1)
					k--

					clearCanvas(this.name)
					display(this.name, "#de512a")
					await sleep(30)
				}
			}
		}
	}
]

const yHead = 2

function generateYTailArray(algoName) {
	const canvas = document.getElementById("canvas " + algoName)
	const algo = algorithms.find((a) => a.name === algoName)

	algo.yTailArray = []

	for (let x = 2; x < canvas.width; x += algo.step) {
		const halfHeight = canvas.height / 2
		algo.yTailArray.push(halfHeight + Math.floor(Math.random() * (halfHeight - 2)))
	}
}

function display(algoName, color) {
	const canvas = document.getElementById("canvas " + algoName)
	const ctx = canvas.getContext("2d")

	const algo = algorithms.find((a) => a.name === algoName)

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	for (let x = 2, i = 0; x < canvas.width && i < algo.yTailArray.length; x += algo.step, i++) {
		ctx.beginPath()
		ctx.moveTo(x, yHead)
		ctx.lineTo(x, algo.yTailArray[i])
		ctx.lineWidth = algo.step / 4
		ctx.strokeStyle = color
		ctx.stroke()
	}
}

function getAlgoName(algoName) {
	const i = algoName.indexOf("Sort")
	return algoName.substr(0, i) + " sort"
}

for (let i = 0; i < algorithms.length; i++) {
	const div = document.createElement("div")
	div.className = "col-md-5 mx-auto mt-3"

	const canvas = document.createElement("canvas")
	canvas.id = "canvas " + algorithms[i].name
	canvas.textContent = "Your browser does not support the HTML5 canvas tag"

	const divContainerButtons = document.createElement("div")
	divContainerButtons.className = "d-flex justify-content-center"

	const buttonSort = document.createElement("button")
	buttonSort.className = "btn btn-primary mr-2 sort " + algorithms[i].name
	buttonSort.textContent = getAlgoName(algorithms[i].name)

	const buttonRemoveLines = document.createElement("button")
	buttonRemoveLines.className = "remove-lines " + algorithms[i].name
	buttonRemoveLines.textContent = "<<"
	// buttonRemoveLines.innerHTML = `<i class="fas fa-angle-double-left">`

	const buttonAddLines = document.createElement("button")
	buttonAddLines.className = "mr-2 add-lines " + algorithms[i].name
	buttonAddLines.textContent = ">>"
	// buttonAddLines.innerHTML = `<i class="fas fa-angle-double-right">`

	const buttonNewArray = document.createElement("button")
	buttonNewArray.className = "btn btn-primary mr-2 new-array " + algorithms[i].name
	buttonNewArray.textContent = "new array"

	divContainerButtons.appendChild(buttonSort)
	divContainerButtons.appendChild(buttonRemoveLines)
	divContainerButtons.appendChild(buttonAddLines)
	divContainerButtons.appendChild(buttonNewArray)

	div.appendChild(canvas)
	div.appendChild(divContainerButtons)

	divAlgosRow.appendChild(div)

	generateYTailArray(algorithms[i].name)
	display(algorithms[i].name, "#de512a")
}

const sortButtons = document.querySelectorAll(".sort")
for (let i = 0; i < sortButtons.length; i++) {
	sortButtons[i].addEventListener("click", async (e) => {
		const classes = e.target.className.split(" ")
		const algoName = classes[classes.length - 1]
		// console.log(algoName)

		const algo = algorithms.find((a) => a.name === algoName)
		// console.log(algo)
		// console.log(algo.yTailArray)
		await algo.sort()
	})
}

const removeLinesButtons = document.querySelectorAll(".remove-lines")
for (let i = 0; i < removeLinesButtons.length; i++) {
	removeLinesButtons[i].addEventListener("click", (e) => {
		const classes = e.target.className.split(" ")
		const algoName = classes[classes.length - 1]

		const algo = algorithms.find((a) => a.name === algoName)

		if (algo.step < 30) {
			algo.step += 3
			generateYTailArray(algoName)
			display(algoName, "#de512a")
		}
	})
}

const addLinesButtons = document.querySelectorAll(".add-lines")
for (let i = 0; i < addLinesButtons.length; i++) {
	addLinesButtons[i].addEventListener("click", (e) => {
		const classes = e.target.className.split(" ")
		const algoName = classes[classes.length - 1]

		const algo = algorithms.find((a) => a.name === algoName)

		if (algo.step > 3) {
			algo.step -= 3
			generateYTailArray(algoName)
			display(algoName, "#de512a")
		}
	})
}

const newArrayButtons = document.querySelectorAll(".new-array")
for (let i = 0; i < newArrayButtons.length; i++) {
	newArrayButtons[i].addEventListener("click", (e) => {
		const classes = e.target.className.split(" ")
		const algoName = classes[classes.length - 1]

		const algo = algorithms.find((a) => a.name === algoName)
		algo.step = 8

		generateYTailArray(algoName)
		display(algoName, "#de512a")
	})
}

const buttonSortAll = document.getElementById("button-sort-all")
const buttonResetAll = document.getElementById("button-reset-all")

buttonSortAll.addEventListener("click", (e) => {
	for (let i = 0; i < algorithms.length; i++) {
		algorithms[i].sort()
	}
})

buttonResetAll.addEventListener("click", (e) => {
	for (let i = 0; i < algorithms.length; i++) {
		algorithms[i].step = 8
		generateYTailArray(algorithms[i].name)
		display(algorithms[i].name, "#de512a")
	}
})
