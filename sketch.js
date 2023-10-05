let imgInput = false;
let process = false;

let input;
let img;
let fileImg;
let imgIn;

let x = 0;
let y = 0;
let steps = 0;

let ditherFactor = 31;
let ditherFactorInput;
let ditherFactorText;
let ditherBool = true;
let ditherCheckbox;

let restartButton;
let restarted;

let acesBool = true;
let acesCheckbox;

function positionDom(startHeight) {
	input.position(5, startHeight);

	let domHeight = startHeight + input.height + 5;

	restartButton.position(5, domHeight);
	restartButton.mousePressed(restartChange);

	domHeight += restartButton.height + 10;

	acesCheckbox.position(5, domHeight);

	domHeight += acesCheckbox.height + 10;

	ditherCheckbox.position(5, domHeight);

	domHeight += ditherCheckbox.height + 5;

	ditherFactorText.position(5, domHeight);
	ditherFactorInput.position(ditherFactorText.width + 20, domHeight);
}

function updateDomValues() {
	ditherFactor = ditherFactorInput.value();
	ditherBool = ditherCheckbox.checked();
	acesBool = acesCheckbox.checked();
}

function GetIndex(x, y, imgWidth) {
	return (x + y * imgWidth) * 4;
}

function preload() {
	input = createFileInput(handleFile);
	restartButton = createButton("Restart");

	ditherFactorText = createSpan("Dither Factor: ");
	ditherFactorInput = createInput(31, "number");

	ditherCheckbox = createCheckbox(" Toggle Dither", true);
	ditherCheckbox.changed(() => { console.log("Dither toggle: " + ditherCheckbox.checked()); });

	acesCheckbox = createCheckbox(" Toggle ACES", true);
	acesCheckbox.changed(() => { console.log("ACES toggle: " + acesCheckbox.checked()); });

	positionDom(5);
}

function setup() {
	createCanvas(windowWidth, windowHeight);

	// setAttributes('premultipliedAlpha', false);

	loop();
	// noLoop();
}

function draw() {
	if (imgInput === true) {
		// console.log(file);

		if (imgIn) {
			// console.log("----- IMAGE IN -----");

			steps = width;

			updateDomValues();

			positionDom(height + 5);

			loadPixels();

			// img.loadPixels(pixels);
			if (!restarted) {
				img.loadPixels(pixels);
			} else {
				restarted = false;
			}

			for (let x_i = 0; x_i < width; x_i++) {
				for (let y_i = 0; y_i < height; y_i++) {
					const index = img.index(x_i, y_i);

					for (let i = 0; i < 4; i++) {
						let data = img.forOutput(index + i);
						// data = ditherBool ? Dither.bayerSingle(x_i, y_i, data, ditherFactor) : data;

						pixels[index + i] = data * 255;
					}
				}
			}

			updatePixels();

			process = true;
			x = 0;
			y = 0;
		} else {
			alert("Try choosing image again");
		}

		imgInput = false;
	} else if (process && !imgInput) {
		loadPixels();
		for (let step = 0; step < steps; step++) {
			const index = GetIndex(x, y, width);

			if (index + (steps * 4) < img.data.length) {
				const nextIndex = index + (steps * 4);
				const lineAlpha = 0.25;
				pixels[nextIndex + 0] = (0 * lineAlpha) + (pixels[nextIndex + 0] * (1 - lineAlpha));
				pixels[nextIndex + 1] = (255 * lineAlpha) + (pixels[nextIndex + 1] * (1 - lineAlpha));
				pixels[nextIndex + 2] = (0 * lineAlpha) + (pixels[nextIndex + 2] * (1 - lineAlpha));
				pixels[nextIndex + 3] = (255 * lineAlpha) + (pixels[nextIndex + 3] * (1 - lineAlpha));
			}

			let col = [];

			if (acesBool) {
				col = LinearACES.ToneMap(
					img.data[index + 0],
					img.data[index + 1],
					img.data[index + 2],
					img.data[index + 3]
				);
			} else {
				col = [img.data[index + 0], img.data[index + 1], img.data[index + 2], img.data[index + 3]];
			}

			// col.push(img.data[index + 3]); // add alpha

			for (let i = 0; i < 4; i++) {
				if (i < 3) {
					col[i] = sRGB.toSRGB(col[i]);
				}

				col[i] = ditherBool ? Dither.bayerSingle(x, y, col[i], ditherFactor) : col[i];

				pixels[index + i] = Math.round(col[i] * 255) >>> 0;
			}

			x++;
			if (x >= width) {
				x = 0;
				y++;
			}

			if (y >= height) {
				// console.log("----- PROCESS -----");

				process = false;

				// console.log(pixels);
				// console.log(img);

				console.log("-----PROCESS DONE -----");
				break;
			}
		}

		updatePixels();
	}
}

function handleFile(f) {
	// console.log(f);
	if (f.type == 'image') {
		fileImg = createImg(f.data, '', 'anonymous', imgReadSuccess);

		fileImg.hide();
	}
}

function imgReadSuccess() {
	resizeCanvas(fileImg.width, fileImg.height);

	img = new ImgWrap(width, height, ColorSpace.sRGB);

	background(28, 28, 28, 0);
	image(fileImg, 0, 0);

	// loadPixels();
	// console.log(pixels);
	// updatePixels();

	imgInput = true;
	process = false;
	imgIn = true;
	restarted = false;
}

function restartChange() {
	console.log("restart");

	if (imgIn) {
		imgInput = true;
		process = false;
		restarted = true;

		background(0, 0, 0, 0);
	}
}