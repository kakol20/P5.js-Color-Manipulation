const ProcessManager = (function () {
  let state = 'nothing';

  function GetIndex(x, y, w, c) {
    return (x + y * w) * c;
  }

  const maxFPS = 60;
  const maxTime = (1 / maxFPS) * 1000;

  let x, y, p;

  let constData = [];
  let processData = [];
  let processOrder = [];

  const debugStates = true;

  return {
    changeState(s) {
      state = s;

      if (debugStates) console.log('State Change: ' + s);
    },

    draw() {
      if (state === 'loadImage') {
        x = 0;
        y = 0;

        constData = [];
        processData = [];
        processOrder = [];

        this.changeState('saveImage');
      } else if (state === 'saveImage') {
        loadPixels();
        const startTime = new Date();
        while (true) {
          const index = GetIndex(x, y, width, 4);

          processOrder.push({ index: index, x: x, y: y });

          for (let i = 0; i < 4; i++) {
            // Normalize to 0-1
            let c = pixels[index + i] / 255.0;
            if (i != 3) {
              c = sRGB.toLinear(c);
            }

            constData.push(c);
            processData.push(c);
          }

          x++;
          if (x >= width) {
            x = 0;
            y++;
          }
          if (y >= height) {
            this.changeState('processImage');
            break;
          }

          const elapseTime = (new Date()) - startTime;
          if (elapseTime >= maxTime) break;
        }
        DOMManager.updateProgress('Loading', (GetIndex(x, y, width, 4) / GetIndex(width - 1, height - 1, width, 4)) * 100);

        if (state != 'saveImage') {
          x = 0;
          y = 0;
          p = 0;
        }

        // updatePixels();
      } else if (state === 'processImage') {
        const startTime = new Date();

        loadPixels();
        while (true) {
          const index = processOrder[p].index;
          
          x = processOrder[p].x, y = processOrder[p].y;

          // ----- START TEMP -----

          // Copy to local
          let c = [];
          for (let i = 0; i < 4; i++) {
            c.push(processData[index + i]);
          }

          // Process
          for (let i = 0; i < 3; i++) {
            c[i] = sRGB.tosRGB(c[i]);
          }

          let bw = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

          c = [bw, bw, bw, c[3]];

          // Show changes

          for (let i = 0; i < 4; i++) {
            processData[index + i] = c[i];
            pixels[index + i] = c[i] * 255;
          }

          // ----- END TEMP -----

          p++;
          if (p >= processOrder.length) {
            this.changeState('end');
            break;
          }

          const elapseTime = (new Date()) - startTime;
          if (elapseTime >= maxTime) break;
        }
        updatePixels();

        DOMManager.updateProgress('Processing', (p / processOrder.length) * 100);
      }
    }
  }
})()