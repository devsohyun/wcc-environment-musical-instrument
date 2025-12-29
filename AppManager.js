class AppManager {
  constructor() {
    this.config = {
      trees: {
        triggeredBy: 'darker',
        brightnessThreshold: 100,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 10,
        modFreqMax: 200,
        modDepthMin: 0,
        modDepthMax: 300
      },
      stream: {
        triggeredBy: 'brighter',
        brightnessThreshold: 100,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 10,
        modFreqMax: 80,
        modDepthMin: 0,
        modDepthMax: 300 
      },
      city: {
        triggeredBy: 'darker',
        brightnessThreshold: 100,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 10,
        modFreqMax: 150,
        modDepthMin: 0,
        modDepthMax: 150 
      }
    };
    this.state = 'intro'; // Possible states: 'loading', 'intro', 'tree', 'stream', 'city'
  }
  update() {
    // This is now purely a display function based on state
    if (this.state === 'loading') {
      this.drawLoadingMessage();
    } else if (this.state === 'intro') {
      this.drawLoadingMessage();
    } else if (this.state === 'results') {
      // The showResults() function already handles this display
    }

  }

  drawLoadingMessage() {
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text('Loading video...', width / 2, height / 2);
  }
  drawStartMessage() {
    fill(255, 220);
    rect(width / 2 - 150, height / 2 - 30, 300, 60, 10);
    fill(0);
    textAlign(CENTER);
    textSize(16);
    text('Click to start audio', width / 2, height / 2 + 6);
  }
}

