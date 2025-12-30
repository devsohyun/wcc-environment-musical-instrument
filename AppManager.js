class AppManager {
  constructor() {
    this.config = {
      trees: {
        videoFile: 'trees.mp4',
        isTriggerByBrigther: false,
        brightnessThreshold: 100,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 10,
        modFreqMax: 200,
        modDepthMin: 0,
        modDepthMax: 300,
      },
      stream: {
        videoFile: 'stream.mp4',
        isTriggerByBrigther: true,
        brightnessThreshold: 200,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 10,
        modFreqMax: 80,
        modDepthMin: 0,
        modDepthMax: 300,
      },
      city: {
        videoFile: 'city.mp4',
        isTriggerByBrigther: false,
        brightnessThreshold: 100,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 10,
        modFreqMax: 150,
        modDepthMin: 0,
        modDepthMax: 150,
      },
    };
    this.videoState = null; // 'trees', 'stream', 'city'
    this.uiState = 'intro'; // 'intro', 'loading', 'play'
    this.videoReady = false;
    this.particles = [];
    this.maxParticleCount = 300;
    this.triggerLineX = 0; // Vertical detection line placement
    this.debugMode = false; // Debug to see which pixels are triggering
  }

  currentConfig() {
    return this.config[this.videoState];
  }
  update(video) {
    // draw background and handle video
    if (!video.loadedmetadata) {
      this.drawLoadingMessage();
      return;
    }

    image(video, 0, 0, VID_WIDTH, VID_HEIGHT);

    if (audioContextOn && this.uiState !== 'intro') {
      this.drawTriggerLine();
      this.moveTriggerLine();
      this.detectVideoFM(video);
      this.updateAndDrawParticles();
    } else if (!audioContextOn) {
      this.uiState = 'intro';
      this.drawStartMessage();
    }
  }

  loadVideoByState(_state) {
    if (video) {
      video.stop();
      video.remove();

      const file = this.config[_state].videoFile;
      video = createVideo('assets/video/' + file, () => {
        this.videoReady = true;
        video.size(VID_WIDTH, VID_HEIGHT);
        video.loop();
        video.volume(0);
      });
      video.hide();
    }
  }

  drawTriggerLine() {
    stroke(255, 0, 0);
    strokeWeight(1);
    line(this.triggerLineX, 0, this.triggerLineX, height);
    noStroke();
  }

  moveTriggerLine() {
    this.triggerLineX += TRIGGER_LINE_SPEED;
    if (this.triggerLineX > width) this.triggerLineX = 0;
  }

  detectVideoFM(video) {
    video.loadPixels();

    let sumY = 0;
    let sumBrightness = 0;
    let hitCount = 0;
    let hitYs = []; // store all hit positions for random particle selection

    // Map trigger line from canvas -> video pixel coordinates
    const x = Math.floor(map(this.triggerLineX, 0, width, 0, video.width));

    for (let y = 0; y < video.height; y += PIXEL_JUMP) {
      const index = (y * video.width + x) * 4;
      const r = video.pixels[index];
      const g = video.pixels[index + 1];
      const b = video.pixels[index + 2];
      const brightness = (r + g + b) / 3;

      const hit = this.currentConfig().isTriggerByBrigther
        ? brightness > this.currentConfig().brightnessThreshold
        : brightness < this.currentConfig().brightnessThreshold;

      if (hit) {
        sumY += y;
        sumBrightness += brightness;
        hitCount++;
        hitYs.push(y); // save hit position
        if (this.debugMode) {
          stroke(255);
          strokeWeight(1);
          fill(0, 0, 0);
          circle(x, y, PIXEL_JUMP * 2); // Visual feedback on hits
        }
      }
    }

    if (hitCount > 0) {
      const avgY = sumY / hitCount;
      const avgBrightness = sumBrightness / hitCount;

      // Update audio based on average brightness/position
      this.applyFM(avgY, avgBrightness);

      // Randomly select a few hits to generate particles
      const MAX_PARTICLES_PER_FRAME = 5;
      for (let i = 0; i < MAX_PARTICLES_PER_FRAME; i++) {
        if (
          hitYs.length === 0 ||
          this.particles.length >= this.maxParticleCount
        )
          break;
        const randIndex = Math.floor(random(hitYs.length));
        const yPos = hitYs[randIndex];
        this.particles.push({
          x: map(x, 0, video.width, 0, width),
          y: map(yPos, 0, video.height, 0, height),
          size: random(4, 8),
          opacity: 255,
        });
        hitYs.splice(randIndex, 1); // remove so we don’t pick it again
      }
    } else {
      // No hit: fade audio out
      carrier.amp(0, 0.2);
      modulator.amp(0);
    }
  }

  applyFM(avgY, avgBrightness) {
    // Base pitch (gesture)
    const targetFreq = map(
      avgY,
      0,
      VID_HEIGHT,
      this.currentConfig().maxPitch,
      this.currentConfig().minPitch
    );
    carrierBaseFreq = lerp(carrierBaseFreq, targetFreq, 0.08);

    // FM speed
    const modFreq = map(
      avgY,
      0,
      VID_HEIGHT,
      this.currentConfig().modFreqMin,
      this.currentConfig().modFreqMax
    );

    // FM depth (energy)
    const modDepth = map(
      avgBrightness,
      this.currentConfig().brightnessThreshold,
      255,
      this.currentConfig().modDepthMin,
      this.currentConfig().modDepthMax
    );

    modulator.freq(modFreq);
    modulator.amp(modDepth);
    carrier.amp(0.25, 0.1);
  }

  updateAndDrawParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      noStroke();
      fill(255, 0, 0, p.opacity);
      circle(p.x, p.y, p.size);

      p.size += 1;
      p.opacity -= 30;

      if (p.opacity <= 0) {
        this.particles.splice(i, 1);
      }
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
