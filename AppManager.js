class AppManager {
  constructor() {
    this.config = {
      trees: {
        videoFile: 'trees.mp4',
        isTriggerByBrigther: false,
        brightnessThreshold: 200,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 0,
        modFreqMax: 112,
        modDepthMin: -150,
        modDepthMax: 150,
      },
      stream: {
        videoFile: 'stream.mp4',
        isTriggerByBrigther: true,
        brightnessThreshold: 200,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 10,
        modFreqMax: 80,
        modDepthMin: -10,
        modDepthMax: 10,
      },
      city: {
        videoFile: 'city.mp4',
        isTriggerByBrigther: false,
        brightnessThreshold: 200,
        minPitch: 0,
        maxPitch: 1000,
        modFreqMin: 10,
        modFreqMax: 150,
        modDepthMin: -300,
        modDepthMax: 300,
      },
    };
    this.videoState = null; // 'trees', 'stream', 'city'
    this.uiState = 'intro'; // 'intro', 'loading', 'play'
    this.videoReady = false;
    this.particles = [];
    this.maxParticleCount = 300;
    this.triggerLineX = 0; // Vertical detection line placement
    this.isSineWave = false; // Toggle for carrier waveform
    this.debugMode = false; // Debug to see which pixels are triggering
  }

  currentConfig() {
    return this.config[this.videoState];
  }
  update(_video) {
    // draw background and handle video
    if (!_video.loadedmetadata) {
      this.drawLoadingMessage();
      return;
    }

    image(_video, 0, 0, VID_WIDTH, VID_HEIGHT);

    if (audioContextOn && this.uiState !== 'intro') {
      this.drawTriggerLine();
      this.moveTriggerLine();
      this.detectVideoFM(_video);
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

  detectVideoFM(_video) {
    _video.loadPixels();

    let sumY = 0;
    let sumBrightness = 0;
    let hitCount = 0;
    let hitYs = []; // store all hit positions for random particle selection

    // Map trigger line from canvas -> video pixel coordinates
    const x = Math.floor(map(this.triggerLineX, 0, width, 0, _video.width));

    for (let y = 0; y < _video.height; y += PIXEL_JUMP) {
      const index = (y * _video.width + x) * 4;
      const r = _video.pixels[index];
      const g = _video.pixels[index + 1];
      const b = video.pixels[index + 2];
      const brightness = (r + g + b) / 3;

      const hit = this.currentConfig().isTriggerByBrigther
        ? brightness > this.currentConfig().brightnessThreshold
        : brightness < this.currentConfig().brightnessThreshold;

      if (hit) {
        sumY += y;
        sumBrightness += brightness;
        hitCount++;
        hitYs.push(y);

        if (this.debugMode) {
          fill(255);
          circle(x, y, 4);
        }
      }
    }

    if (hitCount > 0) {
      const MAX_PARTICLES_PER_FRAME = 5;

      this.applyFM(sumY / hitCount, sumBrightness / hitCount, hitCount);

      for (let i = 0; i < MAX_PARTICLES_PER_FRAME; i++) {
        if (
          hitYs.length === 0 ||
          this.particles.length >= this.maxParticleCount
        )
          break;

        const randIndex = floor(random(hitYs.length));
        const yPos = hitYs[randIndex];

        this.particles.push({
          x: map(x, 0, _video.width, 0, width),
          y: map(yPos, 0, _video.height, 0, height),
          size: random(4, 8),
          opacity: 255,
        });

        hitYs.splice(randIndex, 1);
      }
    } else {
      carrier.amp(0, 0.3);
      modulator.amp(0, 0.3);
    }
  }

  applyFM(avgY, avgBrightness, hitCount) {
    // Normalised brightness
    let normBrightness;

    if (this.currentConfig().isTriggerByBrigther) {
      // Bright pixels → higher value
      normBrightness = map(
        avgBrightness,
        this.currentConfig().brightnessThreshold,
        255,
        0,
        1
      );
    } else {
      // Dark pixels → higher value
      normBrightness = map(
        avgBrightness,
        0,
        this.currentConfig().brightnessThreshold,
        1,
        0
      );
    }

    normBrightness = constrain(normBrightness, 0, 1);
    normBrightness = pow(normBrightness, 2.2);

    // Pitch mapping
    const minPitch = DebugParams.basePitch;
    const maxPitch = DebugParams.basePitch + DebugParams.pitchRange;

    const targetFreq = map(avgY, 0, VID_HEIGHT, maxPitch, minPitch);
    carrierBaseFreq = lerp(carrierBaseFreq, targetFreq, DebugParams.smoothness);

    carrier.freq(carrierBaseFreq);

    // FM modulator frequency (slow + musical)
    const modFreq = lerp(
      modulator.freq().value,
      map(hitCount, 0, 60, 0.2, lerp(5, 35, DebugParams.fmSpeed)),
      0.1
    );

    modulator.freq(constrain(modFreq, 0.1, 40));

    // ✅ FIX: FM depth via modulator.amp (NO fmGain)
    const fmDepth = normBrightness * DebugParams.fmAmount * 80; // keep this small

    modulator.amp(constrain(fmDepth, 0, 120), 0.15);

    // Output amplitude
    carrier.amp(constrain(hitCount / 40, 0.05, 0.25), 0.2);

    // Filter brightness → timbre
    filter.freq(lerp(800, 3200, normBrightness), 0.2);
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
